import express from 'express';
import { auth } from '../config/firebase.js';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { idToken, userData } = req.body;
    
    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1 OR email = $2',
      [decodedToken.uid, decodedToken.email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user in database
    const isAdmin = decodedToken.email === process.env.ADMIN_EMAIL;
    
    const result = await pool.query(
      `INSERT INTO users (firebase_uid, email, full_name, phone, company, is_admin, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        decodedToken.uid,
        decodedToken.email,
        userData.fullName || decodedToken.name || '',
        userData.phone || '',
        userData.company || '',
        isAdmin,
        decodedToken.email_verified || false
      ]
    );

    const user = result.rows[0];
    delete user.firebase_uid; // Don't send Firebase UID to client

    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get or create user in database
    let userQuery = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    let user;
    if (userQuery.rows.length === 0) {
      // Create user if doesn't exist (OAuth login)
      const isAdmin = decodedToken.email === process.env.ADMIN_EMAIL;
      
      const result = await pool.query(
        `INSERT INTO users (firebase_uid, email, full_name, is_admin, email_verified)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          decodedToken.uid,
          decodedToken.email,
          decodedToken.name || '',
          isAdmin,
          decodedToken.email_verified || false
        ]
      );
      user = result.rows[0];
    } else {
      user = userQuery.rows[0];
    }

    delete user.firebase_uid; // Don't send Firebase UID to client

    res.json({
      message: 'Login successful',
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = { ...req.user };
    delete user.firebase_uid;
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, company } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, phone = $2, company = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [full_name, phone, company, req.user.id]
    );

    const user = result.rows[0];
    delete user.firebase_uid;

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;