const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Admin = require('../models/Admin');
const crypto = require('crypto');

// Generate new admin (super admin only)
router.post('/generate-admin', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, email, uniqueKey } = req.body;

    // Check if requester is super admin
    const superAdmin = await Admin.findByPk(req.user.id);
    if (!superAdmin || !superAdmin.isSuperAdmin) {
      return res.status(403).json({ 
        message: 'Unauthorized. Only super admin can generate new admin credentials.' 
      });
    }

    // Validate unique key
    if (uniqueKey !== '897541') {
      return res.status(400).json({ 
        message: 'Invalid unique key. Admin ID cannot be generated without correct key.' 
      });
    }

    // Validate inputs
    if (!name || !email) {
      return res.status(400).json({ 
        message: 'Name and email are required' 
      });
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Admin with this email already exists' 
      });
    }

    // Generate unique 5-digit admin code
    let adminCode;
    let isUnique = false;
    while (!isUnique) {
      adminCode = Math.floor(10000 + Math.random() * 90000).toString();
      const existing = await Admin.findOne({ where: { adminCode } });
      if (!existing) isUnique = true;
    }

    // Generate temporary password (first 3 letters of name + adminCode)
    const tempPassword = name.substring(0, 3).toLowerCase() + adminCode;

    // Create new admin
    const newAdmin = await Admin.create({
      adminCode,
      name,
      email,
      password: tempPassword, // Will be hashed automatically
      isSuperAdmin: false,
      createdBy: req.user.id
    });

    console.log('✅ New admin generated:', {
      code: adminCode,
      name: name,
      email: email,
      by: superAdmin.name
    });

    res.status(201).json({
      success: true,
      message: 'Admin credentials generated successfully',
      admin: {
        adminCode: newAdmin.adminCode,
        name: newAdmin.name,
        email: newAdmin.email,
        temporaryPassword: tempPassword // Send once, admin should change it
      }
    });
  } catch (error) {
    console.error('❌ Error generating admin:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all generated admins (super admin only)
router.get('/generated-admins', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    // Check if requester is super admin
    const superAdmin = await Admin.findByPk(req.user.id);
    if (!superAdmin || !superAdmin.isSuperAdmin) {
      return res.status(403).json({ 
        message: 'Unauthorized. Only super admin can view generated admins.' 
      });
    }

    const admins = await Admin.findAll({
      where: { 
        isSuperAdmin: false,
        createdBy: req.user.id
      },
      attributes: ['id', 'adminCode', 'name', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if current admin is super admin
router.get('/is-super-admin', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id);
    res.json({
      success: true,
      isSuperAdmin: admin ? admin.isSuperAdmin : false,
      name: admin ? admin.name : null
    });
  } catch (error) {
    console.error('❌ Error checking super admin:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
