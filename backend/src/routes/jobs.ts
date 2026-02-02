import express from 'express';
import pool from '../config/database';

const router = express.Router();

// GET /api/jobs - Get all jobs for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {

if (!userId) {
  return res.status(401).json({ error: 'Not authenticated' });
} // TODO: Get from auth token later
    
    const result = await pool.query(
      'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - Get a single job by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

if (!userId) {
  return res.status(401).json({ error: 'Not authenticated' });
}; // TODO: Get from auth token later
    
    const result = await pool.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs - Create a new job
router.post('/', async (req, res) => {
  try {
    const { company, title, status, notes, jobDescription, aiAnalysis, deadline } = req.body;
    const userId = req.headers['x-user-id'];

if (!userId) {
  return res.status(401).json({ error: 'Not authenticated' });
}; // TODO: Get from auth token later
    
    // Validate required fields
    if (!company || !title || !jobDescription) {
      return res.status(400).json({ error: 'Company, title, and job description are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO jobs (user_id, company, title, status, notes, job_description, ai_analysis, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, company, title, status || 'Applied', notes || null, jobDescription, aiAnalysis || null, deadline || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// PUT /api/jobs/:id - Update a job
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company, title, status, notes, jobDescription, aiAnalysis, deadline } = req.body;
    const userId = req.headers['x-user-id'];

if (!userId) {
  return res.status(401).json({ error: 'Not authenticated' });
}; // TODO: Get from auth token later
    
    // Check if job exists and belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const result = await pool.query(
      `UPDATE jobs 
       SET company = $1, title = $2, status = $3, notes = $4, 
           job_description = $5, ai_analysis = $6, deadline = $7,
           updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [company, title, status, notes, jobDescription, aiAnalysis, deadline, id, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// DELETE /api/jobs/:id - Delete a job
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

if (!userId) {
  return res.status(401).json({ error: 'Not authenticated' });
}; // TODO: Get from auth token later
    
    const result = await pool.query(
      'DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ message: 'Job deleted successfully', job: result.rows[0] });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;