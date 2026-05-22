
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already taken" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        stream: user.stream,
        currentLevel: user.currentLevel,
        diagnosticTestCleared: user.diagnosticTestCleared,
        screeningTestTaken: user.screeningTestTaken,
        screeningTestScore: user.screeningTestScore
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export default { register, login };

