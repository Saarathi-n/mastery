
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function authenticateFlexible(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1] || req.query.token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

export default authenticate;

