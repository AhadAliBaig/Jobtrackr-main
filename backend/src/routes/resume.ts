import express from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All resume routes are protected - require valid JWT token

// GET /api/resume - Get user's resume
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId; // From verified JWT token
    
    const result = await pool.query(
      'SELECT resume_text FROM resumes WHERE user_id = $1',
      [userId]
    );
    
    // If no resume exists, return empty string (frontend expects string)
    if (result.rows.length === 0) {
      return res.json('');
    }
    
    res.json(result.rows[0].resume_text);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// POST /api/resume - Save or update user's resume
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { resumeText } = req.body;
    const userId = req.userId; // From verified JWT token
    
    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }
    
    // Use UPSERT (INSERT ... ON CONFLICT) since user_id is UNIQUE
    // If resume exists, update it; if not, insert it
    const result = await pool.query(
      `INSERT INTO resumes (user_id, resume_text, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET resume_text = $2, updated_at = NOW()
       RETURNING resume_text`,
      [userId, resumeText]
    );
    
    res.json({ 
      success: true, 
      message: 'Resume saved successfully!' 
    });
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({ error: 'Failed to save resume' });
  }
});

export default router;