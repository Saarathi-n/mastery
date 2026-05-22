
import MockTest from '../models/MockTest.js';

export async function submitMockTest(req, res) {
  try {
    const { userId, type, subject, chapter, class: _class, score, questions } = req.body;
    const mockTest = await MockTest.create({
      userId, type, subject, chapter, class: _class, questions, score
    });
    res.json({ id: mockTest._id, score });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export default { submitMockTest };

