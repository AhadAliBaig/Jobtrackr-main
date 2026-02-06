import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendEmail, generatePasswordResetEmail } from '../services/emailService';

const router = express.Router();

// JWT secret - should match the one in middleware/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper: Generate JWT token with userId in payload, expires in 7 days
function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper: Generate secure random reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to generate initials from name
function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Generate initials
    const initials = generateInitials(name);
    
    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users (name, email, password, initials)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, initials, created_at`,
      [name, email, hashedPassword, initials]
    );
    
    // Return user data (without password) + JWT token
    const user = result.rows[0];
    const token = generateToken(user.id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        initials: user.initials
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const result = await pool.query(
      'SELECT id, name, email, password, initials FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Compare password with hash
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Return user data (without password) + JWT token
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        initials: user.initials
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/auth/me - Get current user (protected route)
// Uses authMiddleware to verify the JWT token first
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // userId is attached by authMiddleware after verifying the token
    const userId = req.userId;
    
    const result = await pool.query(
      'SELECT id, name, email, initials, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        initials: user.initials,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user by email
    const result = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );
    
    // Don't reveal if email exists (security best practice)
    if (result.rows.length === 0) {
      // Still return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent.'
      });
    }
    
    const user = result.rows[0];
    
    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    // Store reset token in database
    // Note: You'll need to add reset_token and reset_token_expires columns to users table
    // For now, we'll try to update - if columns don't exist, you'll need to add them
    try {
      await pool.query(
        `UPDATE users 
         SET reset_token = $1, reset_token_expires = $2 
         WHERE id = $3`,
        [resetToken, resetTokenExpires, user.id]
      );
    } catch (dbError: any) {
      // If columns don't exist, log error and provide migration SQL
      console.error('[Forgot Password] Database error - columns may not exist:', dbError.message);
      console.log('\n=== RUN THIS SQL TO ADD RESET TOKEN COLUMNS ===');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;');
      console.log('================================================\n');
      
      return res.status(500).json({ 
        error: 'Password reset feature not configured. Please contact support.' 
      });
    }
    
    // Generate reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${resetToken}`;
    
    // Send password reset email
    const emailHtml = generatePasswordResetEmail(resetLink, user.name);
    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset Your JobTrackr Password',
      html: emailHtml
    });
    
    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      // Still return success to user (don't reveal email issues)
      // But log it for debugging
    }
    
    res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.',
      // Only show reset link in development if email service not configured
      resetLink: (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) ? resetLink : undefined
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    // Validate password strength (same as registration)
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one special character' });
    }
    
    // Find user with valid reset token
    const result = await pool.query(
      `SELECT id, email FROM users 
       WHERE reset_token = $1 
       AND reset_token_expires > NOW()`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const user = result.rows[0];
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password and clear reset token
    await pool.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_token_expires = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );
    
    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;