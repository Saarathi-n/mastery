
import User from '../models/User.js';
import { SCREEN_TEST_PASS_SCORES } from '../config/constants.js';

export async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (user) {
      res.json({ ...user.toObject(), id: user._id });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function updateGradeStream(req, res) {
  try {
    const { grade, stream, currentLevel } = req.body;
    await User.findByIdAndUpdate(
      req.params.id, 
      { grade, stream, currentLevel: currentLevel || grade }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function updateScreeningTest(req, res) {
  try {
    const { score, stream } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    user.screeningTestTaken = true;
    user.screeningTestScore = score;

    const isNEET = stream === "NEET";
    const isJEE = stream === "JEE";
    
    let nextLevel = "11th";
    if ((isNEET && score >= SCREEN_TEST_PASS_SCORES.NEET) || 
        (isJEE && score >= SCREEN_TEST_PASS_SCORES.JEE)) {
      nextLevel = "12th";
    } else if (stream === "Both" && score >= SCREEN_TEST_PASS_SCORES.Both) {
      nextLevel = "12th";
    }

    user.currentLevel = nextLevel;
    await user.save();
    
    res.json({ success: true, nextLevel, score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateDiagnosticTest(req, res) {
  try {
    const { passed, nextLevel, score } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });

    user.diagnosticTestCleared = true;
    user.currentLevel = nextLevel;
    user.screeningTestTaken = true;
    if (score) user.screeningTestScore = score;
    
    await user.save();
    res.json({ success: true, nextLevel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default { getUser, updateGradeStream, updateScreeningTest, updateDiagnosticTest };

