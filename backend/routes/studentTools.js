const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const StudentNote = require('../models/StudentNote');
const StudentTodo = require('../models/StudentTodo');
const StudentAIChat = require('../models/StudentAIChat');
const ClassmateMessage = require('../models/ClassmateMessage');
const Student = require('../models/Student');
const Section = require('../models/Section');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory for voice messages
const uploadsDir = path.join(__dirname, '../uploads/voice-messages');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for voice message upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voice-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for voice
  fileFilter: (req, file, cb) => {
    const allowedTypes = /webm|ogg|mp3|wav|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'));
    }
  }
});

// ==================== NOTES ENDPOINTS ====================

// Get all notes for the student
router.get('/notes', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const notes = await StudentNote.findAll({
      where: { studentId: req.user.id },
      order: [['updatedAt', 'DESC']]
    });
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new note
router.post('/notes', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const note = await StudentNote.create({
      studentId: req.user.id,
      title: title || 'Untitled Note',
      content: content || ''
    });
    
    res.status(201).json({ message: 'Note created successfully', note });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a note
router.put('/notes/:id', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    const note = await StudentNote.findOne({
      where: { id, studentId: req.user.id }
    });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    note.title = title || note.title;
    note.content = content !== undefined ? content : note.content;
    await note.save();
    
    res.json({ message: 'Note updated successfully', note });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a note
router.delete('/notes/:id', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const note = await StudentNote.findOne({
      where: { id, studentId: req.user.id }
    });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    await note.destroy();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== TODO ENDPOINTS ====================

// Get all todos for the student
router.get('/todos', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const todos = await StudentTodo.findAll({
      where: { studentId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ todos });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new todo
router.post('/todos', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { text, priority } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Todo text cannot be empty' });
    }
    
    const todo = await StudentTodo.create({
      studentId: req.user.id,
      text: text.trim(),
      priority: priority || 'medium',
      done: false
    });
    
    res.status(201).json({ message: 'Todo created successfully', todo });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a todo (toggle done or edit text)
router.put('/todos/:id', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { done, text, priority } = req.body;
    
    const todo = await StudentTodo.findOne({
      where: { id, studentId: req.user.id }
    });
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    if (done !== undefined) todo.done = done;
    if (text) todo.text = text;
    if (priority) todo.priority = priority;
    
    await todo.save();
    res.json({ message: 'Todo updated successfully', todo });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a todo
router.delete('/todos/:id', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const todo = await StudentTodo.findOne({
      where: { id, studentId: req.user.id }
    });
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    await todo.destroy();
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== AI CHATBOT ENDPOINTS ====================

// Get AI chat history
router.get('/ai-chat', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const chats = await StudentAIChat.findAll({
      where: { studentId: req.user.id },
      order: [['createdAt', 'ASC']],
      limit: 50
    });
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message to AI and get response
router.post('/ai-chat', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    // Save user message
    const userChat = await StudentAIChat.create({
      studentId: req.user.id,
      role: 'user',
      message: message.trim()
    });
    
    // Generate AI response using OpenAI-compatible API
    let aiResponse = '';
    
    try {
      // Check if OpenAI API key is configured
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (openaiApiKey) {
        // Real OpenAI API call
        const fetch = require('node-fetch');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful AI study assistant for students. Provide clear, concise, and educational responses. Help with homework, explain concepts, and encourage learning.'
              },
              {
                role: 'user',
                content: message.trim()
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
          aiResponse = data.choices[0].message.content;
        } else {
          throw new Error('Invalid API response');
        }
      } else {
        // Fallback: Simple rule-based responses for demo
        aiResponse = generateSmartResponse(message.trim());
      }
    } catch (apiError) {
      console.error('AI API Error:', apiError);
      aiResponse = generateSmartResponse(message.trim());
    }
    
    // Save AI response
    const assistantChat = await StudentAIChat.create({
      studentId: req.user.id,
      role: 'assistant',
      message: aiResponse
    });
    
    res.json({
      message: 'Response generated successfully',
      userMessage: userChat,
      aiMessage: assistantChat
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear AI chat history
router.delete('/ai-chat', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    await StudentAIChat.destroy({
      where: { studentId: req.user.id }
    });
    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== CLASSMATE CHAT ENDPOINTS ====================

// Get all classmate messages (for student's sections)
router.get('/classmate-chat', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const student = await Student.findByPk(req.user.id, {
      include: [{
        model: Section,
        through: { attributes: [] }
      }]
    });
    
    if (!student || !student.Sections || student.Sections.length === 0) {
      return res.json({ messages: [], sections: [], message: 'Not enrolled in any section' });
    }
    
    const sectionIds = student.Sections.map(s => s.id);
    
    const messages = await ClassmateMessage.findAll({
      where: { sectionId: sectionIds },
      include: [{
        model: Student,
        attributes: ['id', 'fullName', 'email']
      }],
      order: [['createdAt', 'ASC']],
      limit: 100
    });
    
    res.json({ messages, sections: student.Sections });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send text message to classmates
router.post('/classmate-chat/text', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { message, sectionId } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    const student = await Student.findByPk(req.user.id, {
      include: [{
        model: Section,
        where: { id: sectionId },
        through: { attributes: [] }
      }]
    });
    
    if (!student || !student.Sections || student.Sections.length === 0) {
      return res.status(403).json({ message: 'You are not enrolled in this section' });
    }
    
    const chatMessage = await ClassmateMessage.create({
      studentId: req.user.id,
      sectionId: sectionId,
      messageType: 'text',
      message: message.trim()
    });
    
    const messageWithStudent = await ClassmateMessage.findByPk(chatMessage.id, {
      include: [{
        model: Student,
        attributes: ['id', 'fullName', 'email']
      }]
    });
    
    res.status(201).json({ message: 'Message sent successfully', chatMessage: messageWithStudent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send voice message to classmates
router.post('/classmate-chat/voice', authMiddleware, roleMiddleware('student'), upload.single('voice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No voice file uploaded' });
    }
    
    const { sectionId, duration } = req.body;
    
    const student = await Student.findByPk(req.user.id, {
      include: [{
        model: Section,
        where: { id: sectionId },
        through: { attributes: [] }
      }]
    });
    
    if (!student || !student.Sections || student.Sections.length === 0) {
      return res.status(403).json({ message: 'You are not enrolled in this section' });
    }
    
    const voiceUrl = `/uploads/voice-messages/${req.file.filename}`;
    
    const chatMessage = await ClassmateMessage.create({
      studentId: req.user.id,
      sectionId: sectionId,
      messageType: 'voice',
      message: 'Voice message',
      voiceUrl: voiceUrl,
      voiceDuration: duration || 0
    });
    
    const messageWithStudent = await ClassmateMessage.findByPk(chatMessage.id, {
      include: [{
        model: Student,
        attributes: ['id', 'fullName', 'email']
      }]
    });
    
    res.status(201).json({ message: 'Voice message sent successfully', chatMessage: messageWithStudent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete own message
router.delete('/classmate-chat/:id', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await ClassmateMessage.findOne({
      where: { id, studentId: req.user.id }
    });
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found or you do not have permission' });
    }
    
    // Delete voice file if exists
    if (message.messageType === 'voice' && message.voiceUrl) {
      const filePath = path.join(__dirname, '../uploads/voice-messages', path.basename(message.voiceUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await message.destroy();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

function generateSmartResponse(message) {
  const lowerMsg = message.toLowerCase();
  
  // Educational responses
  if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
    return "Hello! I'm your AI study assistant. How can I help you with your studies today? Feel free to ask me about any subject, homework help, or study tips!";
  }
  
  if (lowerMsg.includes('what') && (lowerMsg.includes('are you') || lowerMsg.includes('is this'))) {
    return "I'm an AI-powered study assistant designed to help you with your academic journey. I can answer questions, explain concepts, help with homework, and provide study guidance. What would you like to learn about?";
  }
  
  if (lowerMsg.includes('help') || lowerMsg.includes('assist')) {
    return "I'd be happy to help! I can assist with:\n• Explaining difficult concepts\n• Homework guidance\n• Study tips and techniques\n• Subject-specific questions\n• Exam preparation\nWhat do you need help with?";
  }
  
  if (lowerMsg.includes('thank')) {
    return "You're welcome! I'm here whenever you need help. Keep up the great work with your studies! 📚";
  }
  
  // Math-related
  if (lowerMsg.includes('math') || lowerMsg.includes('calculate') || lowerMsg.includes('equation')) {
    return "I can help with math! For specific calculations or equations, please provide the problem. I can assist with:\n• Algebra\n• Geometry\n• Calculus\n• Statistics\n• Word problems\nWhat's your math question?";
  }
  
  // Science-related
  if (lowerMsg.includes('science') || lowerMsg.includes('physics') || lowerMsg.includes('chemistry') || lowerMsg.includes('biology')) {
    return "Science is fascinating! I can help explain scientific concepts, formulas, and theories. What specific topic would you like to explore?";
  }
  
  // Study tips
  if (lowerMsg.includes('study') && (lowerMsg.includes('how') || lowerMsg.includes('tips') || lowerMsg.includes('better'))) {
    return "Here are some effective study tips:\n1. Create a study schedule and stick to it\n2. Use active recall and spaced repetition\n3. Take regular breaks (Pomodoro technique)\n4. Teach concepts to others\n5. Practice with past papers\n6. Stay organized and eliminate distractions\nWould you like more specific advice?";
  }
  
  // Programming
  if (lowerMsg.includes('code') || lowerMsg.includes('programming') || lowerMsg.includes('javascript') || lowerMsg.includes('python')) {
    return "I can help with programming! Whether it's understanding algorithms, debugging, or learning new concepts, I'm here to assist. What programming question do you have?";
  }
  
  // Default educational response
  return `That's an interesting question! While I'm here to help with educational topics, I'd need more context to provide a detailed answer. Could you elaborate on what you'd like to know? I'm best at helping with:\n• Subject explanations\n• Homework assistance\n• Study strategies\n• Concept clarification\n\nNote: For more advanced and accurate responses, ask your administrator to configure the OpenAI API key.`;
}

module.exports = router;
