import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get user invoices
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, 
              json_agg(
                json_build_object(
                  'id', ii.id,
                  'service_type', ii.service_type,
                  'description', ii.description,
                  'amount', ii.amount
                )
              ) as items
       FROM invoices i
       LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
       WHERE i.user_id = $1
       GROUP BY i.id
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get user invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get specific invoice details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1',
      [id]
    );
    
    res.json({
      invoice: invoiceResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Get invoice details error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// Mark invoice as paid by user (with proof)
router.put('/:id/mark-paid', authenticateToken, upload.single('payment_proof'), async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_message } = req.body;
    
    // Check if invoice exists and belongs to user
    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    let payment_proof_url = null;
    
    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'payment_proofs',
              public_id: `payment_${id}_${Date.now()}`
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
        
        payment_proof_url = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload payment proof' });
      }
    }
    
    // Update invoice
    const updateResult = await pool.query(
      `UPDATE invoices 
       SET payment_proof_url = $1, payment_message = $2, user_marked_paid_at = NOW(), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [payment_proof_url, payment_message, id]
    );

    res.json({
      message: 'Payment proof submitted successfully',
      invoice: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    res.status(500).json({ error: 'Failed to submit payment proof' });
  }
});

export default router;