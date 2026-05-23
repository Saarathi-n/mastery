
import Question from '../models/Question.js';
import cloudinary, { searchCloudinaryRawResources } from '../utils/cloudinary.js';
import config from '../config/index.js';
import { SUBJECTS } from '../config/constants.js';

export async function getQuestions(req, res) {
  try {
    const { subject, class: _class, type, exam } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (_class) filter.class = _class;
    if (type) filter.type = type;
    if (exam && exam !== 'Both') filter.exam = exam;

    const questions = await Question.find(filter);
    res.json(questions.map((q) => ({ ...q.toObject(), id: q._id })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function getDiagnosticQuestions(req, res) {
  try {
    const { type, exam } = req.query;
    let filter = {};
    if (type) filter.type = type;
    if (exam && exam !== 'Both') filter.exam = exam;
    
    let questions = await Question.find(filter);
    
    if (type === 'diagnostic') {
      const grouped = {};
      SUBJECTS.forEach(s => grouped[s] = []);
      
      questions.forEach(q => {
        if (grouped[q.subject]) grouped[q.subject].push(q);
      });
      
      let shuffled = [];
      for (const subj of SUBJECTS) {
        if (!grouped[subj]) continue;
        for (let i = grouped[subj].length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [grouped[subj][i], grouped[subj][j]] = [grouped[subj][j], grouped[subj][i]];
        }
        shuffled.push(...grouped[subj]);
      }
      
      questions = shuffled;
    }

    res.json(questions.map((q) => ({ ...q.toObject(), id: q._id })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function getScreenTestQuestions(req, res) {
  try {
    const { exam } = req.query;
    let cloudinaryFolder;
    
    if (exam === 'NEET') {
      cloudinaryFolder = 'mastery/neet-screentest';
    } else if (exam === 'JEE') {
      cloudinaryFolder = 'mastery/screentest';
    } else {
      return res.status(400).json({ error: "Invalid exam type" });
    }

    console.log('Checking Cloudinary folder:', cloudinaryFolder);
    
    const resources = await searchCloudinaryRawResources(cloudinaryFolder);
    console.log('Found resources in folder:', resources.length);
    console.log('Resource details:', resources.map(r => ({ public_id: r.public_id, filename: r.filename, format: r.format })));
    
    let questions = [];
    
    // Try to get JSON questions from Cloudinary
    for (const resource of resources) {
      if (resource.filename?.toLowerCase().endsWith('.json') || 
          resource.format === 'json' || 
          resource.public_id?.toLowerCase().endsWith('.json')) {
        try {
          console.log('Fetching JSON file:', resource.public_id);
          const url = cloudinary.utils.private_download_url(
            resource.public_id, 
            'json', 
            { resource_type: 'raw' }
          );
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            console.log('Parsed JSON data:', data);
            if (Array.isArray(data)) {
              questions.push(...data);
            } else if (data.questions) {
              questions.push(...data.questions);
            }
          }
        } catch (err) {
          console.error('Error parsing JSON from Cloudinary:', err);
        }
      }
    }

    // Fall back to MongoDB diagnostic questions if no Cloudinary JSON found
    if (questions.length === 0) {
      console.log('No JSON questions found, falling back to MongoDB diagnostic questions');
      let filter = { type: 'diagnostic' };
      if (exam && exam !== 'Both') {
        filter.exam = exam;
      }
      
      questions = await Question.find(filter);
      
      // Shuffle questions within subjects
      const grouped = {};
      SUBJECTS.forEach(s => grouped[s] = []);
      
      questions.forEach(q => {
        if (grouped[q.subject]) grouped[q.subject].push(q);
      });
      
      let shuffled = [];
      for (const subj of SUBJECTS) {
        if (!grouped[subj]) continue;
        for (let i = grouped[subj].length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [grouped[subj][i], grouped[subj][j]] = [grouped[subj][j], grouped[subj][i]];
        }
        shuffled.push(...grouped[subj]);
      }
      
      // Include any that didn't match those 4 subjects
      for (let q of questions) {
        if (!['Physics', 'Chemistry', 'Mathematics', 'Biology'].includes(q.subject)) {
          shuffled.push(q);
        }
      }
      
      questions = shuffled;
    }

    console.log('Total questions found:', questions.length);
    res.json(questions.map(q => q._id ? { ...q, id: q._id } : q));
  } catch (err) {
    console.error('Error in screentest questions:', err);
    res.status(500).json({ error: err.message });
  }
}

export default { getQuestions, getDiagnosticQuestions, getScreenTestQuestions };

