import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [usersResult, domainsResult, hostingResult, inquiriesResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM user_domains WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as count FROM user_hosting WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as count FROM contact_inquiries WHERE status = $1', ['new'])
    ]);

    res.json({
      totalUsers: parseInt(usersResult.rows[0].count),
      activeDomains: parseInt(domainsResult.rows[0].count),
      activeHosting: parseInt(hostingResult.rows[0].count),
      newInquiries: parseInt(inquiriesResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, 
              (SELECT COUNT(*) FROM user_domains WHERE user_id = u.id) as domain_count,
              (SELECT COUNT(*) FROM user_hosting WHERE user_id = u.id) as hosting_count
       FROM users u
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [userResult, domainsResult, hostingResult, complaintsResult] = await Promise.all([
      pool.query('SELECT * FROM users WHERE id = $1', [id]),
      pool.query('SELECT * FROM user_domains WHERE user_id = $1 ORDER BY created_at DESC', [id]),
      pool.query(`SELECT uh.*, hp.name as package_name 
                  FROM user_hosting uh 
                  JOIN hosting_packages hp ON uh.package_id = hp.id 
                  WHERE uh.user_id = $1 
                  ORDER BY uh.created_at DESC`, [id]),
      pool.query('SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC', [id])
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: userResult.rows[0],
      domains: domainsResult.rows,
      hosting: hostingResult.rows,
      complaints: complaintsResult.rows
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

export default router;