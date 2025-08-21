import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all active domain pricing
router.get('/pricing', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM domain_pricing WHERE is_active = true ORDER BY price'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get domain pricing error:', error);
    res.status(500).json({ error: 'Failed to fetch domain pricing' });
  }
});

// Get all domain pricing (admin only)
router.get('/pricing/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM domain_pricing ORDER BY price'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all domain pricing error:', error);
    res.status(500).json({ error: 'Failed to fetch domain pricing' });
  }
});

// Create domain pricing (admin only)
router.post('/pricing', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { extension, price, is_active } = req.body;
    
    const result = await pool.query(
      `INSERT INTO domain_pricing (extension, price, is_active)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [extension, price, is_active]
    );

    res.status(201).json({
      message: 'Domain pricing created successfully',
      pricing: result.rows[0]
    });
  } catch (error) {
    console.error('Create domain pricing error:', error);
    res.status(500).json({ error: 'Failed to create domain pricing' });
  }
});

// Update domain pricing (admin only)
router.put('/pricing/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { extension, price, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE domain_pricing 
       SET extension = $1, price = $2, is_active = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [extension, price, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain pricing not found' });
    }

    res.json({
      message: 'Domain pricing updated successfully',
      pricing: result.rows[0]
    });
  } catch (error) {
    console.error('Update domain pricing error:', error);
    res.status(500).json({ error: 'Failed to update domain pricing' });
  }
});

// Delete domain pricing (admin only)
router.delete('/pricing/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM domain_pricing WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain pricing not found' });
    }

    res.json({ message: 'Domain pricing deleted successfully' });
  } catch (error) {
    console.error('Delete domain pricing error:', error);
    res.status(500).json({ error: 'Failed to delete domain pricing' });
  }
});

// Get user domains
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_domains WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get user domains error:', error);
    res.status(500).json({ error: 'Failed to fetch user domains' });
  }
});

export default router;