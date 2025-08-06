import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all active hosting packages
router.get('/packages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM hosting_packages WHERE is_active = true ORDER BY price'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get hosting packages error:', error);
    res.status(500).json({ error: 'Failed to fetch hosting packages' });
  }
});

// Get all hosting packages (admin only)
router.get('/packages/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM hosting_packages ORDER BY price'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all hosting packages error:', error);
    res.status(500).json({ error: 'Failed to fetch hosting packages' });
  }
});

// Create hosting package (admin only)
router.post('/packages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, storage, bandwidth, email_accounts, databases, features, is_active } = req.body;
    
    const result = await pool.query(
      `INSERT INTO hosting_packages (name, description, price, storage, bandwidth, email_accounts, databases, features, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, description, price, storage, bandwidth, email_accounts, databases, features, is_active]
    );

    res.status(201).json({
      message: 'Hosting package created successfully',
      package: result.rows[0]
    });
  } catch (error) {
    console.error('Create hosting package error:', error);
    res.status(500).json({ error: 'Failed to create hosting package' });
  }
});

// Update hosting package (admin only)
router.put('/packages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, storage, bandwidth, email_accounts, databases, features, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE hosting_packages 
       SET name = $1, description = $2, price = $3, storage = $4, bandwidth = $5,
           email_accounts = $6, databases = $7, features = $8, is_active = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, description, price, storage, bandwidth, email_accounts, databases, features, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hosting package not found' });
    }

    res.json({
      message: 'Hosting package updated successfully',
      package: result.rows[0]
    });
  } catch (error) {
    console.error('Update hosting package error:', error);
    res.status(500).json({ error: 'Failed to update hosting package' });
  }
});

// Delete hosting package (admin only)
router.delete('/packages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM hosting_packages WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hosting package not found' });
    }

    res.json({ message: 'Hosting package deleted successfully' });
  } catch (error) {
    console.error('Delete hosting package error:', error);
    res.status(500).json({ error: 'Failed to delete hosting package' });
  }
});

// Get user hosting services
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT uh.*, hp.name as package_name, hp.storage, hp.bandwidth
       FROM user_hosting uh
       JOIN hosting_packages hp ON uh.package_id = hp.id
       WHERE uh.user_id = $1
       ORDER BY uh.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get user hosting error:', error);
    res.status(500).json({ error: 'Failed to fetch user hosting services' });
  }
});

export default router;