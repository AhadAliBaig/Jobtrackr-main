import express from 'express';
import pool from './config/database';
import jobsRouter from './routes/jobs';
import resumeRouter from './routes/resume';
import authRouter from './routes/auth';
import aiRouter from './routes/ai';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration - Only allow requests from your frontend
// Set FRONTEND_URL in your .env file (e.g., https://jobtrackr.vercel.app)
const allowedOrigins = [
  process.env.FRONTEND_URL,           // Production frontend
  'http://localhost:4200',            // Angular dev server
  'http://localhost:3000',            // Local testing
].filter(Boolean); 

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Allow cookies/auth headers
}));

app.use(express.json());

// Database
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error executing query', err);
    } else {
        console.log('Database connected at', res.rows[0].now);
    }
});

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running' });
});

app.use('/api/jobs', jobsRouter);
app.use('/api/resume', resumeRouter); 
app.use('/api/auth', authRouter);
app.use('/ai', aiRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//made all the changes to the server.ts file
