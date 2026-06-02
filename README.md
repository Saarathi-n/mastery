

# Mastery

Mastery is an AI-assisted learning platform for JEE and NEET prep. It combines diagnostic tests, subject dashboards, PDF-based study workflows, mock tests, and AI-powered help in one app.

View the live app: https://mastery-theta-beige.vercel.app/

## Features

- AI-powered learning and question support
- Diagnostic tests to identify weak areas
- Subject and chapter browsing for JEE and NEET prep
- Mock tests, progress tracking, and feedback flows
- PDF upload and library management
- Authentication, onboarding, and user dashboard experiences

## Tech Stack

- React + Vite frontend
- Express backend
- MongoDB with Mongoose
- Gemini API for AI features
- Cloudinary support for file storage
- Tailwind CSS for styling

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB connection string
- Gemini API key
- Optional Cloudinary credentials if you want cloud file uploads

### Install

1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env` and fill in your values.
3. Start the full app:
   `npm run dev`

## Environment Variables

Use these values in your `.env` file:

```bash
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5001
APP_URL=your_app_url_here
```

Optional extras supported by the app:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_DEFAULT_FOLDER`
- `USE_CLOUDINARY`
- `NVIDIA_API_KEY` or `VITE_NVIDIA_API_KEY`
- `LIBRARY_ROOT`
- `PYQ_ROOT`

## Scripts

- `npm run dev` - run frontend and backend together
- `npm run dev:frontend` - run the Vite dev server only
- `npm run dev:backend` - run the Express server only
- `npm run build` - build the frontend for production
- `npm run start` - start the backend in production mode

## Project Structure

- `src/` - React app, pages, and UI components
- `controllers/` - API route handlers
- `routes/` - API route definitions
- `models/` - MongoDB models
- `middleware/` - auth, error handling, and security helpers
- `utils/` - database, storage, and parsing utilities

## Notes

- The backend seeds sample questions on first run if the database is empty.
- If you are deploying, make sure `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` are set in the target environment.
