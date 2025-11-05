import express from 'express';
import { User, Department, Course, Instructor, Student, Schedule, Room } from '../config/database.js';
import { requireAuth, requireAdmin } from './auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireAdmin);

// User Management
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save middleware
      role,
      department
    });
    await user.save();

    // Create role-specific profile
    if (role === 'instructor') {
      const instructor = new Instructor({
        userId: user._id,
        maxHoursPerWeek: 20,
        specializations: [],
        availability: new Map()
      });
      await instructor.save();
    } else if (role === 'student') {
      const student = new Student({
        userId: user._id,
        studentId: `STU${Date.now()}`,
        year: 1,
        enrolledCourses: []
      });
      await student.save();
    }

    res.json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Department Management
router.post('/departments', async (req, res) => {
  try {
    const { name, code } = req.body;

    const existingDept = await Department.findOne({ code });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this code already exists'
      });
    }

    const department = new Department({ name, code });
    await department.save();

    res.json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
});

// Analytics
router.get('/analytics', async (req, res) => {
  try {
    const [
      totalUsers,
      totalInstructors,
      totalStudents,
      totalCourses,
      totalRooms,
      totalSchedules
    ] = await Promise.all([
      User.countDocuments(),
      Instructor.countDocuments(),
      Student.countDocuments(),
      Course.countDocuments(),
      Room.countDocuments(),
      Schedule.countDocuments()
    ]);

    // Get room utilization
    const rooms = await Room.find();
    const schedules = await Schedule.find();
    const roomUtilization = rooms.map(room => {
      const roomSchedules = schedules.filter(s => s.roomId.toString() === room._id.toString());
      return {
        roomName: room.name,
        totalSlots: roomSchedules.length,
        utilization: (roomSchedules.length / (5 * 8)) * 100 // Assuming 5 days, 8 slots per day
      };
    });

    // Get department distribution
    const departments = await Department.find();
    const departmentStats = await Promise.all(
      departments.map(async dept => {
        const courseCount = await Course.countDocuments({ department: dept.name });
        const instructorCount = await User.countDocuments({ department: dept.name, role: 'instructor' });
        const studentCount = await User.countDocuments({ department: dept.name, role: 'student' });
        return {
          name: dept.name,
          courses: courseCount,
          instructors: instructorCount,
          students: studentCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        counts: {
          users: totalUsers,
          instructors: totalInstructors,
          students: totalStudents,
          courses: totalCourses,
          rooms: totalRooms,
          schedules: totalSchedules
        },
        roomUtilization,
        departmentStats,
        scheduleStats: {
          total: totalSchedules,
          published: await Schedule.countDocuments({ status: 'published' }),
          draft: await Schedule.countDocuments({ status: 'draft' }),
          conflict: await Schedule.countDocuments({ status: 'conflict' })
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// System Settings
router.put('/settings', async (req, res) => {
  try {
    const { maxHoursPerWeek, defaultConflictHandling, autoScheduleEnabled } = req.body;
    
    // Update global settings (you'll need to create a Settings model)
    // This is a placeholder for system-wide settings
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// Bulk Schedule Operations
router.post('/schedules/bulk', async (req, res) => {
  try {
    const { schedules } = req.body;
    const createdSchedules = await Schedule.insertMany(schedules);

    res.json({
      success: true,
      message: 'Schedules created successfully',
      data: createdSchedules
    });
  } catch (error) {
    console.error('Error creating bulk schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedules'
    });
  }
});

// Get instructors with full details
router.get('/instructors', async (req, res) => {
  try {
    const instructors = await Instructor.find()
      .populate({
        path: 'userId',
        select: 'name email department',
        model: 'User'
      })
      .lean(); // Use lean() for better performance

    if (!instructors || instructors.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const formattedInstructors = instructors.map(instructor => {
      const userData = instructor.userId || {};
      // Convert MongoDB Map to plain object for JSON serialization
      let availability = {};
      if (instructor.availability) {
        if (instructor.availability instanceof Map) {
          availability = Object.fromEntries(instructor.availability);
        } else {
          availability = instructor.availability;
        }
      }
      
      return {
        _id: instructor._id.toString(),
        id: instructor._id.toString(),
        name: userData.name || 'Unknown',
        email: userData.email,
        department: userData.department,
        maxHoursPerWeek: instructor.maxHoursPerWeek || 20,
        specializations: instructor.specializations || [],
        availability: availability,
        userId: userData._id ? userData._id.toString() : null
      };
    });

    res.json({
      success: true,
      data: formattedInstructors
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructors'
    });
  }
});

// Update user role
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, department } = req.body;

    // Get existing user and their current role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldRole = user.role;
    const newRole = role;

    // Update user basic info
    user.name = name;
    user.email = email;
    user.role = role;
    user.department = department;
    await user.save();

    // Handle role change
    if (oldRole !== newRole) {
      // Remove old role-specific profile
      if (oldRole === 'instructor') {
        await Instructor.findOneAndDelete({ userId: user._id });
      } else if (oldRole === 'student') {
        await Student.findOneAndDelete({ userId: user._id });
      }

      // Create new role-specific profile
      if (newRole === 'instructor') {
        const instructor = new Instructor({
          userId: user._id,
          maxHoursPerWeek: 20,
          specializations: [],
          availability: new Map()
        });
        await instructor.save();
      } else if (newRole === 'student') {
        const student = new Student({
          userId: user._id,
          studentId: `STU${Date.now()}`,
          year: 1,
          enrolledCourses: []
        });
        await student.save();
      }
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

export default router;