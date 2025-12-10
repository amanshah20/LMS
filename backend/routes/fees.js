const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const FeeQuery = require('../models/FeeQuery');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

// Get all student fees (Admin only)
router.get('/all', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    console.log('📊 Fetching all student fees...');
    const fees = await StudentFee.findAll({
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'studentId', 'fullName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Found ${fees.length} fee records`);
    res.json({ success: true, fees });
  } catch (error) {
    console.error('❌ Error fetching fees:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's own fee details
router.get('/my-fees', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    console.log(`💰 Fetching fees for student ID: ${req.user.id}`);
    const fees = await StudentFee.findAll({
      where: { studentId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const payments = await FeePayment.findAll({
      where: { studentId: req.user.id },
      order: [['paymentDate', 'DESC']]
    });

    console.log(`✅ Found ${fees.length} fee records and ${payments.length} payments`);
    res.json({ success: true, fees, payments });
  } catch (error) {
    console.error('❌ Error fetching student fees:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update fee structure (Admin only)
router.post('/create', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { 
      studentId, 
      tuitionFee, 
      examFee, 
      libraryFee, 
      labFee, 
      otherCharges, 
      dueDate,
      semester,
      academicYear 
    } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Calculate total fee
    const totalFee = (
      parseFloat(tuitionFee || 0) + 
      parseFloat(examFee || 0) + 
      parseFloat(libraryFee || 0) + 
      parseFloat(labFee || 0) + 
      parseFloat(otherCharges || 0)
    );

    const feeData = {
      studentId,
      tuitionFee: tuitionFee || 0,
      examFee: examFee || 0,
      libraryFee: libraryFee || 0,
      labFee: labFee || 0,
      otherCharges: otherCharges || 0,
      totalFee,
      paidAmount: 0,
      pendingAmount: totalFee,
      dueDate,
      semester,
      academicYear,
      status: 'pending'
    };

    const fee = await StudentFee.create(feeData);

    // Create notification for student
    await Notification.create({
      recipientRole: 'student',
      recipientId: studentId,
      title: '💰 New Fee Structure Added',
      message: `Fee of ₹${totalFee.toLocaleString()} has been added for ${semester} - ${academicYear}. Due date: ${new Date(dueDate).toLocaleDateString()}`,
      type: 'fee',
      priority: 'high'
    });

    console.log('✅ Fee structure created for student:', student.fullName);
    res.status(201).json({ 
      success: true, 
      message: 'Fee structure created successfully', 
      fee 
    });
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update fee structure (Admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { 
      tuitionFee, 
      examFee, 
      libraryFee, 
      labFee, 
      otherCharges, 
      dueDate,
      semester,
      academicYear 
    } = req.body;

    const fee = await StudentFee.findByPk(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Calculate new total
    const totalFee = (
      parseFloat(tuitionFee || fee.tuitionFee) + 
      parseFloat(examFee || fee.examFee) + 
      parseFloat(libraryFee || fee.libraryFee) + 
      parseFloat(labFee || fee.labFee) + 
      parseFloat(otherCharges || fee.otherCharges)
    );

    const pendingAmount = totalFee - parseFloat(fee.paidAmount);

    await fee.update({
      tuitionFee: tuitionFee || fee.tuitionFee,
      examFee: examFee || fee.examFee,
      libraryFee: libraryFee || fee.libraryFee,
      labFee: labFee || fee.labFee,
      otherCharges: otherCharges || fee.otherCharges,
      totalFee,
      pendingAmount,
      dueDate: dueDate || fee.dueDate,
      semester: semester || fee.semester,
      academicYear: academicYear || fee.academicYear,
      status: pendingAmount <= 0 ? 'paid' : (fee.paidAmount > 0 ? 'partial' : 'pending')
    });

    res.json({ success: true, message: 'Fee updated successfully', fee });
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete fee record (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const fee = await StudentFee.findByPk(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    await fee.destroy();
    console.log('✅ Fee record deleted:', req.params.id);
    res.json({ success: true, message: 'Fee record deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record payment (Student)
router.post('/pay', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { feeId, amount, paymentMethod, transactionId } = req.body;

    if (!feeId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Fee ID, amount, and payment method are required' });
    }

    const fee = await StudentFee.findByPk(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (fee.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create payment record
    const payment = await FeePayment.create({
      studentId: req.user.id,
      feeId,
      amount,
      paymentMethod,
      transactionId,
      paymentStatus: 'completed',
      paymentDate: new Date()
    });

    // Update fee record
    const newPaidAmount = parseFloat(fee.paidAmount) + parseFloat(amount);
    const newPendingAmount = parseFloat(fee.totalFee) - newPaidAmount;

    await fee.update({
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      status: newPendingAmount <= 0 ? 'paid' : 'partial'
    });

    console.log('✅ Payment recorded:', payment.id);
    res.json({ 
      success: true, 
      message: 'Payment recorded successfully', 
      payment,
      updatedFee: fee 
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit fee query (Student)
router.post('/query', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const query = await FeeQuery.create({
      studentId: req.user.id,
      subject,
      message,
      status: 'pending'
    });

    // Notify admin
    await Notification.create({
      recipientRole: 'admin',
      title: '❓ New Fee Query',
      message: `Student ${req.user.fullName || req.user.studentId} submitted a query: ${subject}`,
      type: 'fee',
      priority: 'medium'
    });

    console.log('✅ Fee query submitted:', query.id);
    res.status(201).json({ 
      success: true, 
      message: 'Query submitted successfully', 
      query 
    });
  } catch (error) {
    console.error('Error submitting query:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all fee queries (Admin)
router.get('/queries', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const queries = await FeeQuery.findAll({
      include: [{
        model: Student,
        attributes: ['id', 'studentId', 'fullName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, queries });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's own queries
router.get('/my-queries', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const queries = await FeeQuery.findAll({
      where: { studentId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, queries });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Respond to query (Admin)
router.put('/query/:id/respond', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { response } = req.body;

    const query = await FeeQuery.findByPk(req.params.id);
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    await query.update({
      adminResponse: response,
      responseDate: new Date(),
      status: 'resolved'
    });

    // Notify student
    await Notification.create({
      recipientRole: 'student',
      recipientId: query.studentId,
      title: '✅ Fee Query Response',
      message: `Your query "${query.subject}" has been answered by admin.`,
      type: 'fee',
      priority: 'high'
    });

    res.json({ success: true, message: 'Response sent successfully', query });
  } catch (error) {
    console.error('Error responding to query:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
