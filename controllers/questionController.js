
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
      
      return res.json(shuffled);
    }
    
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function getScreenTestQuestions(req, res) {
  try {
    const { exam } = req.query;
    let folder;
    
    if (exam === 'NEET') {
      folder = config.folders.neetScreentest;
    } else if (exam === 'JEE') {
      folder = config.folders.screentest;
    } else {
      return res.status(400).json({ error: "Invalid exam type" });
    }

    const cloudinaryFolder = `mastery/${folder}`;
    const resources = await searchCloudinaryRawResources(cloudinaryFolder);
    
    const questions = [];
    for (const resource of resources) {
      if (resource.filename?.toLowerCase().endsWith('.json')) {
        try {
          const url = cloudinary.utils.private_download_url(
            resource.public_id, 
            'json', 
            { resource_type: 'raw' }
          );
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
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

    res.json(questions);
  } catch (err) {
    console.error('Error in screentest questions:', err);
    res.status(500).json({ error: err.message });
  }
}

export default { getQuestions, getDiagnosticQuestions, getScreenTestQuestions };

