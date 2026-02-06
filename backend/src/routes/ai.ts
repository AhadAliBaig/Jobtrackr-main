import express from 'express';
import { ResumeAnalyzer } from '../ai/resumeAnalyzer';
import { AIConfig, AIService } from '../ai/aiService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All AI routes are protected - require valid JWT token
// This prevents unauthorized users from using your Gemini API credits

// Configure AI (reads from .env)
const aiConfig: AIConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};

const analyzer = new ResumeAnalyzer(aiConfig);
const aiService = new AIService(aiConfig);

// POST /ai/analyze - Analyze resume against job description
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { job_description, resume_text, use_ai } = req.body;

    // Validate input
    if (!job_description || !resume_text) {
      return res.status(400).json({
        error: 'job_description and resume_text are required',
      });
    }

    // Run analysis
    let result: any;
    if (use_ai === true) {
      result = await analyzer.analyze({ job_description, resume_text }, true);
    } else {
      result = analyzer.quickAnalyze({ job_description, resume_text });
    }

    // Normalize response to match frontend expectations
    const response = {
      match_score: Number(result.match_score ?? 0),
      missing_skills: Array.isArray(result.missing_skills) ? result.missing_skills : [],
      matched_skills: Array.isArray(result.matched_skills) ? result.matched_skills : [],
      summary: String(result.summary ?? ''),
      keyword_density: Number(result.keyword_density ?? 0),
      ai_suggestions: result.ai_suggestions || null,  // Use || instead of typeof check
    };

    res.json(response);
  } catch (error: any) {
    console.error('[AI ROUTE ERROR]', error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});


router.post('/cover-letter', authMiddleware, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ error: 'jobDescription required' });
    }
    
    const prompt = `Write a professional cover letter for this job. 250-350 words.\n\n${jobDescription}`;
    const result = await aiService.callAI(prompt);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json({ coverLetter: result.data });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

export default router;