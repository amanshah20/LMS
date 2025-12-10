const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const CourseVideo = require('../models/CourseVideo');
const Notification = require('../models/Notification');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all courses (for students and admins)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    console.log('📚 Fetching all courses for user:', req.user.role, req.user.id);
    
    const courses = await Course.findAll({
      where: { status: 'active' },
      include: [{
        model: CourseVideo,
        as: 'videos'
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log('✅ Found', courses.length, 'active courses');
    console.log('📚 Courses:', courses.map(c => ({ id: c.id, title: c.title, videos: c.videos?.length || 0 })));

    res.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// Get single course
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [{
        model: CourseVideo,
        as: 'videos',
        order: [['orderIndex', 'ASC']]
      }]
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
});

// Create course (Admin only)
router.post('/create', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    console.log('📚 Course Creation Request from:', req.user);
    console.log('📚 Course Data:', req.body);
    
    const { title, description, instructor, category, level, duration, videos } = req.body;

    if (!title || !instructor) {
      console.log('❌ Missing required fields:', { title, instructor });
      return res.status(400).json({ message: 'Title and instructor are required' });
    }

    // Create course
    console.log('✅ Creating course...');
    const course = await Course.create({
      title,
      description,
      instructor,
      category,
      level,
      duration,
      totalLessons: videos ? videos.length : 0,
      status: 'active'
    });
    console.log('✅ Course created with ID:', course.id);

    // Create videos if provided
    if (videos && videos.length > 0) {
      console.log('📹 Creating', videos.length, 'videos...');
      const videoData = videos.map((video, index) => ({
        courseId: course.id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        duration: video.duration,
        orderIndex: index + 1
      }));

      await CourseVideo.bulkCreate(videoData);
      console.log('✅ Videos created successfully');
    }

    // Create notification for all students
    console.log('📢 Creating notification for students...');
    await Notification.create({
      recipientRole: 'student',
      title: 'New Course Available',
      message: `New course "${title}" by ${instructor} is now available. Enroll now!`,
      type: 'course',
      priority: 'high'
    });
    console.log('✅ Notification sent to all students');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('❌ Course Creation Error:', error);
    console.error('❌ Error Stack:', error.stack);
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
});

// Update course (Admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { title, description, instructor, category, level, duration, status } = req.body;
    
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.instructor = instructor || course.instructor;
    course.category = category || course.category;
    course.level = level || course.level;
    course.duration = duration || course.duration;
    course.status = status || course.status;

    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Error updating course', error: error.message });
  }
});

// Delete course (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Delete all videos associated with the course
    await CourseVideo.destroy({ where: { courseId: req.params.id } });
    
    await course.destroy();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
});

// Add video to course (Admin only)
router.post('/:id/videos', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { title, description, videoUrl, duration } = req.body;
    const courseId = req.params.id;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get current video count for order index
    const videoCount = await CourseVideo.count({ where: { courseId } });

    const video = await CourseVideo.create({
      courseId,
      title,
      description,
      videoUrl,
      duration,
      orderIndex: videoCount + 1
    });

    // Update total lessons count
    course.totalLessons = videoCount + 1;
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Video added successfully',
      video
    });
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ message: 'Error adding video', error: error.message });
  }
});

// Delete video from course (Admin only)
router.delete('/:courseId/videos/:videoId', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { courseId, videoId } = req.params;

    const video = await CourseVideo.findOne({
      where: { id: videoId, courseId }
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    await video.destroy();

    // Update total lessons count
    const course = await Course.findByPk(courseId);
    const videoCount = await CourseVideo.count({ where: { courseId } });
    course.totalLessons = videoCount;
    await course.save();

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Error deleting video', error: error.message });
  }
});

module.exports = router;
