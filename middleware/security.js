
import cors from 'cors';

export function setupSecurity(app) {
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.APP_URL 
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
  }));
}

export default setupSecurity;

