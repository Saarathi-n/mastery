import mammoth from 'mammoth';

const SUBJECT_HEADERS = ['MATHEMATICS', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'BOTANY', 'ZOOLOGY'];

function detectSubject(line) {
  const upper = line.toUpperCase().trim();
  for (const s of SUBJECT_HEADERS) {
    if (upper === s || upper.startsWith(s + ' ')) return s.charAt(0) + s.slice(1).toLowerCase();
  }
  return null;
}

function isNumericalSection(line) {
  return /Section B/i.test(line) || /Numerical Answer/i.test(line);
}

function isMcqSection(line) {
  return /Section A/i.test(line) || /MCQ/i.test(line);
}

function parseOptions(optionLine) {
  // Handles: "(A) text   (B) text   (C) text   (D) text"
  // Also handles multiline options across subsequent lines
  const opts = [];
  // Match all option blocks: (A)..., (B)..., (C)..., (D)...
  const regex = /\([A-D]\)\s*(.*?)(?=\s*\([A-D]\)|$)/g;
  let m;
  while ((m = regex.exec(optionLine)) !== null) {
    const text = m[1].trim();
    if (text) opts.push(text);
  }
  return opts;
}

/**
 * Parse raw text extracted from a docx and return MCQ question objects.
 * @param {string} rawText
 * @param {string} exam - 'JEE' or 'NEET'
 * @returns {Array} questions
 */
export function parseQuestionsFromText(rawText, exam = 'JEE') {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const questions = [];
  let currentSubject = 'General';
  let inNumericalSection = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect subject
    const subject = detectSubject(line);
    if (subject) {
      currentSubject = subject;
      i++;
      continue;
    }

    // Detect section type
    if (isNumericalSection(line)) {
      inNumericalSection = true;
      i++;
      continue;
    }
    if (isMcqSection(line)) {
      inNumericalSection = false;
      i++;
      continue;
    }

    // Skip numerical section questions
    if (inNumericalSection) {
      i++;
      continue;
    }

    // Detect question line: starts with Q<number>.
    const qMatch = line.match(/^Q(\d+)\.\s+(.+)/);
    if (!qMatch) {
      i++;
      continue;
    }

    const qNum = parseInt(qMatch[1]);
    let questionText = qMatch[2];
    i++;

    // Collect continuation lines until we hit the options line
    while (i < lines.length) {
      const next = lines[i];
      // Stop if next line is an option line
      if (/^\([A-D]\)/.test(next)) break;
      // Stop if next line is the next question
      if (/^Q\d+\./.test(next)) break;
      // Stop if it's a section/subject header
      if (detectSubject(next) || isNumericalSection(next) || isMcqSection(next)) break;
      questionText += ' ' + next;
      i++;
    }

    // Now collect option lines
    let optionText = '';
    while (i < lines.length) {
      const next = lines[i];
      if (/^\([A-D]\)/.test(next)) {
        optionText += ' ' + next;
        i++;
      } else if (/^[A-D]\)/.test(next)) {
        // alternate format: "A) text"
        optionText += ' (' + next;
        i++;
      } else if (optionText && /^\([C-D]\)/.test(next)) {
        // Still options
        optionText += ' ' + next;
        i++;
      } else {
        break;
      }
    }

    // Parse the options
    const options = parseOptions(optionText);

    // Only include if we got 4 options (valid MCQ)
    if (options.length === 4) {
      // Determine subject mapping for JEE/NEET
      let mappedSubject = currentSubject;
      if (exam === 'JEE' && mappedSubject === 'Biology') mappedSubject = 'Mathematics';

      questions.push({
        subject: mappedSubject,
        chapter: 'Mixed',
        class: '12',
        type: 'diagnostic',
        exam,
        question: questionText.trim(),
        options,
        correctAnswer: options[0], // placeholder — will need manual correction or answer key
        explanation: '',
      });
    }
  }

  return questions;
}

/**
 * Download a docx from a URL and parse it.
 * @param {string} url - URL to the docx file
 * @param {string} exam - 'JEE' or 'NEET'
 */
export async function parseDocxFromUrl(url, exam = 'JEE') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch docx: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return parseQuestionsFromText(result.value, exam);
}
