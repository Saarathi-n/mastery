import mammoth from 'mammoth';
import { readFileSync } from 'fs';
import { parseQuestionsFromText } from './utils/parseDocxQuestions.js';

const buf = readFileSync('temp_jee.docx');
const result = await mammoth.extractRawText({ buffer: buf });
const qs = parseQuestionsFromText(result.value, 'JEE');
console.log('Total MCQ questions parsed:', qs.length);
console.log('First question:', JSON.stringify(qs[0], null, 2));
console.log('Last question:', JSON.stringify(qs[qs.length-1], null, 2));
const bySubject = {};
qs.forEach(q => { bySubject[q.subject] = (bySubject[q.subject]||0)+1; });
console.log('By subject:', bySubject);
