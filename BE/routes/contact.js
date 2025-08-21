import express from 'express';
import pool from '../config/database.js';
import { sendContactEmail } from '../config/email.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Submit contact form
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('subject').trim().isLength({ min: 5 }).withMessage('Subject must be at least 5 characters'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, company, subject, message } = req.body;
    
    // Save to database
    const result = await pool.query(
      `INSERT INTO contact_inquiries (name, email, phone, company, subject, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, phone || null, company || null, subject, message]
    );

    // Send emails
    try {
      await sendContactEmail({ name, email, phone, company, subject, message });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails - inquiry is saved
    }

    res.status(201).json({
      message: 'Contact form submitted successfully. We will get back to you within 24 hours.',
      inquiry: result.rows[0]
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// Get all contact inquiries (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contact_inquiries ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get contact inquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch contact inquiries' });
  }
});

// Update contact inquiry status (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      `UPDATE contact_inquiries 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact inquiry not found' });
    }

    res.json({
      message: 'Contact inquiry updated successfully',
      inquiry: result.rows[0]
    });
  } catch (error) {
    console.error('Update contact inquiry error:', error);
    res.status(500).json({ error: 'Failed to update contact inquiry' });
  }
});

export default router;