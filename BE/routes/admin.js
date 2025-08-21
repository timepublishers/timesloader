import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { sendInvoiceEmail } from '../config/email.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [usersResult, domainsResult, hostingResult, inquiriesResult, invoicesResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM user_domains WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as count FROM user_hosting WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as count FROM contact_inquiries WHERE status = $1', ['new']),
      pool.query('SELECT COUNT(*) as count FROM invoices WHERE status = $1', ['pending'])
    ]);

    res.json({
      totalUsers: parseInt(usersResult.rows[0].count),
      activeDomains: parseInt(domainsResult.rows[0].count),
      activeHosting: parseInt(hostingResult.rows[0].count),
      newInquiries: parseInt(inquiriesResult.rows[0].count),
      pendingInvoices: parseInt(invoicesResult.rows[0].count)
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
              (SELECT COUNT(*) FROM user_hosting WHERE user_id = u.id) as hosting_count,
              (SELECT COUNT(*) FROM other_services WHERE user_id = u.id) as other_services_count
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
    
    const [userResult, domainsResult, hostingResult, otherServicesResult, complaintsResult, invoicesResult] = await Promise.all([
      pool.query('SELECT * FROM users WHERE id = $1', [id]),
      pool.query('SELECT * FROM user_domains WHERE user_id = $1 ORDER BY created_at DESC', [id]),
      pool.query(`SELECT uh.*, hp.name as package_name 
                  FROM user_hosting uh 
                  JOIN hosting_packages hp ON uh.package_id = hp.id 
                  WHERE uh.user_id = $1 
                  ORDER BY uh.created_at DESC`, [id]),
      pool.query('SELECT * FROM other_services WHERE user_id = $1 ORDER BY created_at DESC', [id]),
      pool.query('SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC', [id]),
      pool.query('SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC', [id])
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: userResult.rows[0],
      domains: domainsResult.rows,
      hosting: hostingResult.rows,
      otherServices: otherServicesResult.rows,
      complaints: complaintsResult.rows,
      invoices: invoicesResult.rows
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Create new domain service
router.post('/services/domain', authenticateToken, requireAdmin, [
  body('user_id').isUUID().withMessage('Valid user ID is required'),
  body('domain_name').trim().isLength({ min: 1 }).withMessage('Domain name is required'),
  body('tld').trim().isLength({ min: 1 }).withMessage('TLD is required'),
  body('price_paid').isInt({ min: 0 }).withMessage('Price must be a positive number'),
  body('registration_date').isISO8601().withMessage('Valid registration date is required'),
  body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, domain_name, tld, price_paid, registration_date, expiry_date, auto_renew } = req.body;
    
    const result = await pool.query(
      `INSERT INTO user_domains (user_id, domain_name, tld, extension, price_paid, registration_date, expiry_date, payment_due_date, auto_renew)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user_id, domain_name, tld, tld, price_paid, registration_date, expiry_date, expiry_date, auto_renew || false]
    );

    res.status(201).json({
      message: 'Domain service created successfully',
      domain: result.rows[0]
    });
  } catch (error) {
    console.error('Create domain service error:', error);
    res.status(500).json({ error: 'Failed to create domain service' });
  }
});

// Create new hosting service
router.post('/services/hosting', authenticateToken, requireAdmin, [
  body('user_id').isUUID().withMessage('Valid user ID is required'),
  body('package_id').isUUID().withMessage('Valid package ID is required'),
  body('domain_name').trim().isLength({ min: 1 }).withMessage('Domain name is required'),
  body('tld').trim().isLength({ min: 1 }).withMessage('TLD is required'),
  body('price_paid').isInt({ min: 0 }).withMessage('Price must be a positive number'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, package_id, domain_name, tld, price_paid, start_date, expiry_date, auto_renew } = req.body;
    
    // Get package details
    const packageResult = await pool.query('SELECT * FROM hosting_packages WHERE id = $1', [package_id]);
    if (packageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hosting package not found' });
    }
    
    const pkg = packageResult.rows[0];
    
    const result = await pool.query(
      `INSERT INTO user_hosting (user_id, package_id, domain_name, tld, price_paid, start_date, expiry_date, payment_due_date, auto_renew, storage, bandwidth, email_accounts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [user_id, package_id, domain_name, tld, price_paid, start_date, expiry_date, expiry_date, auto_renew || false, pkg.storage, pkg.bandwidth, pkg.email_accounts]
    );

    res.status(201).json({
      message: 'Hosting service created successfully',
      hosting: result.rows[0]
    });
  } catch (error) {
    console.error('Create hosting service error:', error);
    res.status(500).json({ error: 'Failed to create hosting service' });
  }
});

// Create new other service
router.post('/services/other', authenticateToken, requireAdmin, [
  body('user_id').isUUID().withMessage('Valid user ID is required'),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('amount').isInt({ min: 0 }).withMessage('Amount must be a positive number'),
  body('period').isIn(['one_time', 'monthly', 'yearly']).withMessage('Invalid period'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, title, description, amount, period } = req.body;
    
    const result = await pool.query(
      `INSERT INTO other_services (user_id, title, description, amount, period)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, title, description, amount, period]
    );

    res.status(201).json({
      message: 'Other service created successfully',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('Create other service error:', error);
    res.status(500).json({ error: 'Failed to create other service' });
  }
});

// Get user services for invoice creation
router.get('/users/:id/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [domainsResult, hostingResult, otherServicesResult] = await Promise.all([
      pool.query('SELECT *, \'domain\' as service_type FROM user_domains WHERE user_id = $1', [id]),
      pool.query(`SELECT uh.*, hp.name as package_name, 'hosting' as service_type 
                  FROM user_hosting uh 
                  JOIN hosting_packages hp ON uh.package_id = hp.id 
                  WHERE uh.user_id = $1`, [id]),
      pool.query('SELECT *, \'other\' as service_type FROM other_services WHERE user_id = $1', [id])
    ]);

    const services = [
      ...domainsResult.rows,
      ...hostingResult.rows,
      ...otherServicesResult.rows
    ];

    res.json(services);
  } catch (error) {
    console.error('Get user services error:', error);
    res.status(500).json({ error: 'Failed to fetch user services' });
  }
});

// Create invoice
router.post('/invoices', authenticateToken, requireAdmin, [
  body('user_id').isUUID().withMessage('Valid user ID is required'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  body('total_amount').isInt({ min: 1 }).withMessage('Total amount must be positive'),
  body('due_date').isISO8601().withMessage('Valid due date is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, services, total_amount, due_date } = req.body;
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Create invoice
    const invoiceResult = await pool.query(
      `INSERT INTO invoices (user_id, invoice_number, total_amount, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, invoiceNumber, total_amount, due_date]
    );
    
    const invoice = invoiceResult.rows[0];
    
    // Create invoice items
    for (const service of services) {
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, service_type, service_id, description, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoice.id, service.service_type, service.id, service.description, service.amount]
      );
    }
    
    // Get user details for email
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
    const user = userResult.rows[0];
    
    // Send invoice email
    try {
      await sendInvoiceEmail(user.email, user.full_name, invoice, services);
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
    }

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Get all invoices
router.get('/invoices', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.full_name, u.email 
       FROM invoices i
       JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Update invoice status (admin marks as paid)
router.put('/invoices/:id/mark-paid', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE invoices 
       SET status = 'paid', admin_marked_paid_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      message: 'Invoice marked as paid successfully',
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
});

export default router;