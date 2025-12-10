const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const TeacherAccessKey = require('../models/TeacherAccessKey');
const Teacher = require('../models/Teacher');

// Generate random 5-digit access ID
const generateAccessId = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Admin: Create Teacher Access Key
router.post('/create', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { teacherName, email } = req.body;

    if (!teacherName) {
      return res.status(400).json({ message: 'Teacher name is required' });
    }

    // Generate unique 5-digit access ID
    let accessId;
    let isUnique = false;
    
    while (!isUnique) {
      accessId = generateAccessId();
      const existing = await TeacherAccessKey.findOne({ where: { accessId } });
      if (!existing) isUnique = true;
    }

    const accessKey = await TeacherAccessKey.create({
      accessId,
      teacherName,
      email: email || null,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Teacher access key created successfully',
      data: {
        id: accessKey.id,
        accessId: accessKey.accessId,
        teacherName: accessKey.teacherName,
        email: accessKey.email,
        isUsed: accessKey.isUsed,
        createdAt: accessKey.createdAt
      }
    });
  } catch (error) {
    console.error('Create access key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all access keys
router.get('/all', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const accessKeys = await TeacherAccessKey.findAll({
      include: [
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['id', 'facultyName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      accessKeys,
      total: accessKeys.length,
      used: accessKeys.filter(k => k.isUsed).length,
      available: accessKeys.filter(k => !k.isUsed).length
    });
  } catch (error) {
    console.error('Get access keys error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Public: Verify access key (for teacher signup)
router.post('/verify', async (req, res) => {
  try {
    const { accessId, teacherName } = req.body;

    if (!accessId || !teacherName) {
      return res.status(400).json({ message: 'Access ID and teacher name are required' });
    }

    const accessKey = await TeacherAccessKey.findOne({
      where: { accessId }
    });

    if (!accessKey) {
      return res.status(404).json({ message: 'Invalid access ID' });
    }

    if (accessKey.isUsed) {
      return res.status(400).json({ message: 'This access ID has already been used' });
    }

    // Case-insensitive name comparison
    if (accessKey.teacherName.toLowerCase() !== teacherName.toLowerCase()) {
      return res.status(400).json({ message: 'Teacher name does not match the access ID' });
    }

    res.json({
      message: 'Access key verified successfully',
      data: {
        accessId: accessKey.accessId,
        teacherName: accessKey.teacherName,
        email: accessKey.email
      }
    });
  } catch (error) {
    console.error('Verify access key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Delete access key
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const accessKey = await TeacherAccessKey.findByPk(id);
    if (!accessKey) {
      return res.status(404).json({ message: 'Access key not found' });
    }

    if (accessKey.isUsed) {
      return res.status(400).json({ message: 'Cannot delete used access key' });
    }

    await accessKey.destroy();
    res.json({ message: 'Access key deleted successfully' });
  } catch (error) {
    console.error('Delete access key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Regenerate access ID for unused key
router.put('/:id/regenerate', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const accessKey = await TeacherAccessKey.findByPk(id);
    if (!accessKey) {
      return res.status(404).json({ message: 'Access key not found' });
    }

    if (accessKey.isUsed) {
      return res.status(400).json({ message: 'Cannot regenerate used access key' });
    }

    // Generate new unique access ID
    let newAccessId;
    let isUnique = false;
    
    while (!isUnique) {
      newAccessId = generateAccessId();
      const existing = await TeacherAccessKey.findOne({ where: { accessId: newAccessId } });
      if (!existing) isUnique = true;
    }

    accessKey.accessId = newAccessId;
    await accessKey.save();

    res.json({
      message: 'Access ID regenerated successfully',
      data: {
        id: accessKey.id,
        accessId: accessKey.accessId,
        teacherName: accessKey.teacherName
      }
    });
  } catch (error) {
    console.error('Regenerate access ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
