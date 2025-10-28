import express from 'express';
import { Instructor, Schedule, User } from '../config/database.js';
import { requireAuth, requireInstructor } from './auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireInstructor);

// Get instructor profile
router.get('/profile', async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ userId: req.user._id })
      .populate('userId', 'name email department');
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor profile not found'
      });
    }

    res.json({
      success: true,
      data: instructor
    });
  } catch (error) {
    console.error('Error fetching instructor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructor profile'
    });
  }
});

// Update instructor availability
router.put('/availability', async (req, res) => {
  try {
    const { availability } = req.body;
    const instructor = await Instructor.findOne({ userId: req.user._id });
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    instructor.availability = availability;
    await instructor.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: instructor
    });
  } catch (error) {
    console.error('Error updating instructor availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability'
    });
  }
});

// Get instructor's schedules
router.get('/schedules', async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ userId: req.user._id });
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    const schedules = await Schedule.find({ instructorId: instructor._id })
      .populate('courseId', 'code name')
      .populate('roomId', 'name building');

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching instructor schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules'
    });
  }
});

// Update instructor specializations
router.put('/specializations', async (req, res) => {
  try {
    const { specializations } = req.body;
    const instructor = await Instructor.findOne({ userId: req.user._id });
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    instructor.specializations = specializations;
    await instructor.save();

    res.json({
      success: true,
      message: 'Specializations updated successfully',
      data: instructor
    });
  } catch (error) {
    console.error('Error updating instructor specializations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update specializations'
    });
  }
});

// Get instructor course load
router.get('/course-load', async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ userId: req.user._id });
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    const schedules = await Schedule.find({ instructorId: instructor._id })
      .populate('courseId', 'code name credits duration');

    const courseLoad = {
      totalCourses: schedules.length,
      totalHours: schedules.reduce((acc, schedule) => {
        const duration = schedule.courseId.duration || 0;
        return acc + duration;
      }, 0) / 60, // Convert minutes to hours
      maxHoursPerWeek: instructor.maxHoursPerWeek
    };

    res.json({
      success: true,
      data: courseLoad
    });
  } catch (error) {
    console.error('Error calculating course load:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate course load'
    });
  }
});

export default router;