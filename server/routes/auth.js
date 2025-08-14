import express from 'express';
import { auth } from '../config/firebase.js';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../config/email.js';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const router = express.Router();

// Generate 6-digit PIN
const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register user with email verification
router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, phone, company } = req.body;
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate verification PIN
    const verificationPin = generatePIN();
    const pinExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user in database (not verified yet)
    const isAdmin = email === process.env.ADMIN_EMAIL;
    
    const result = await pool.query(
      `INSERT INTO users (email, full_name, phone, company, is_admin, email_verified, verification_pin, pin_expiry, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, email, full_name, phone, company, is_admin, email_verified, created_at`,
      [email, fullName, phone || null, company || null, isAdmin, false, verificationPin, pinExpiry, password]
    );

    const user = result.rows[0];

    // Send verification email
    try {
      await sendVerificationEmail(email, fullName, verificationPin);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Delete the user if email fails
      await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email for the verification PIN.',
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email with PIN
router.post('/verify-email', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN must be 6 digits'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, pin } = req.body;

    // Find user with matching email and PIN
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND verification_pin = $2',
      [email, pin]
    );

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid PIN or email' });
    }

    const user = userQuery.rows[0];

    // Check if PIN is expired
    if (new Date() > new Date(user.pin_expiry)) {
      return res.status(400).json({ error: 'PIN has expired. Please request a new one.' });
    }

    // Create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email: user.email,
        password: user.password_hash,
        displayName: user.full_name,
        emailVerified: true
      });
    } catch (firebaseError) {
      console.error('Firebase user creation failed:', firebaseError);
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    // Update user as verified and add Firebase UID
    await pool.query(
      `UPDATE users 
       SET email_verified = true, firebase_uid = $1, verification_pin = NULL, pin_expiry = NULL, password_hash = NULL
       WHERE id = $2`,
      [firebaseUser.uid, user.id]
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.full_name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Generate custom token for immediate login
    const customToken = await auth.createCustomToken(firebaseUser.uid);

    res.json({
      message: 'Email verified successfully! You can now sign in.',
      customToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        company: user.company,
        is_admin: user.is_admin,
        email_verified: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Resend verification PIN
router.post('/resend-pin', [
  body('email').isEmail().withMessage('Please provide a valid email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find unverified user
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND email_verified = false',
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: 'User not found or already verified' });
    }

    const user = userQuery.rows[0];

    // Generate new PIN
    const verificationPin = generatePIN();
    const pinExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update PIN in database
    await pool.query(
      'UPDATE users SET verification_pin = $1, pin_expiry = $2 WHERE id = $3',
      [verificationPin, pinExpiry, user.id]
    );

    // Send verification email
    await sendVerificationEmail(email, user.full_name, verificationPin);

    res.json({
      message: 'Verification PIN sent to your email'
    });
  } catch (error) {
    console.error('Resend PIN error:', error);
    res.status(500).json({ error: 'Failed to resend PIN' });
  }
});

// Login user (Firebase token)
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

      // Send welcome email for OAuth users
      if (user.email_verified) {
        try {
          await sendWelcomeEmail(user.email, user.full_name);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
      }
    } else {
      user = userQuery.rows[0];
    }

    // Remove sensitive data
    delete user.firebase_uid;
    delete user.verification_pin;
    delete user.pin_expiry;
    delete user.password_hash;

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
    delete user.verification_pin;
    delete user.pin_expiry;
    delete user.password_hash;
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('full_name').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('phone').optional().trim(),
  body('company').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, phone, company } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), 
           phone = COALESCE($2, phone), 
           company = COALESCE($3, company), 
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [full_name, phone, company, req.user.id]
    );

    const user = result.rows[0];
    delete user.firebase_uid;
    delete user.verification_pin;
    delete user.pin_expiry;
    delete user.password_hash;

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