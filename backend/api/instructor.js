import express from 'express';
import { Instructor, Schedule, User, Course, Enrollment } from '../config/database.js';
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

    // Convert MongoDB Map to plain object for JSON serialization
    const instructorData = instructor.toObject ? instructor.toObject() : instructor;
    if (instructorData.availability instanceof Map) {
      instructorData.availability = Object.fromEntries(instructorData.availability);
    }
    
    res.json({
      success: true,
      data: instructorData
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

    // Convert MongoDB Map to plain object for JSON serialization
    const instructorData = instructor.toObject ? instructor.toObject() : instructor;
    if (instructorData.availability instanceof Map) {
      instructorData.availability = Object.fromEntries(instructorData.availability);
    }

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: instructorData
    });
  } catch (error) {
    console.error('Error updating instructor availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability'
    });
  }
});

// Get instructor's courses
router.get('/courses', async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ userId: req.user._id });
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    // Find all courses assigned to this instructor
    const courses = await Course.find({ instructorId: instructor._id })
      .select('code name department credits type studentsEnrolled')
      .sort({ code: 1 });

    // For each course, get the number of enrolled students
    const coursesWithEnrollments = await Promise.all(courses.map(async (course) => {
      const enrollments = await Enrollment.countDocuments({ courseId: course._id });
      return {
        ...course.toObject(),
        studentsEnrolled: enrollments
      };
    }));

    res.json({
      success: true,
      data: coursesWithEnrollments
    });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructor courses'
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
      .populate('courseId', 'code name credits type')
      .populate('roomId', 'name building')
      .sort({ dayOfWeek: 1, startTime: 1 });
    
    // Transform the data for frontend
    const transformedSchedules = schedules.map(schedule => ({
      _id: schedule._id,
      courseCode: schedule.courseId?.code,
      courseName: schedule.courseId?.name,
      roomName: schedule.roomId?.name,
      building: schedule.roomId?.building,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      semester: schedule.semester,
      year: schedule.year
    }));

    res.json({
      success: true,
      data: transformedSchedules
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

// Get enrolled students for a specific course
router.get('/course/:courseId/students', async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ userId: req.user._id });
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    const course = await Course.findOne({
      _id: req.params.courseId,
      instructorId: instructor._id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not assigned to this instructor'
      });
    }

    const enrollments = await Enrollment.find({ courseId: course._id })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email -_id'
        },
        select: 'major year -_id'
      });

    const students = enrollments.map(enrollment => ({
      studentInfo: enrollment.studentId.userId,
      major: enrollment.studentId.major,
      year: enrollment.studentId.year,
      enrollmentDate: enrollment.enrollmentDate,
      status: enrollment.status
    }));

    res.json({
      success: true,
      data: {
        course: {
          code: course.code,
          name: course.name,
          type: course.type,
          credits: course.credits
        },
        students
      }
    });
  } catch (error) {
    console.error('Error fetching course students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled students'
    });
  }
});

// Get all students enrolled in any of instructor's courses
router.get('/students', async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ userId: req.user._id });
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    // Find all courses taught by this instructor
    const courses = await Course.find({ instructorId: instructor._id });
    const courseIds = courses.map(course => course._id);

    // Find all enrollments for these courses
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email -_id'
        },
        select: 'major year -_id'
      })
      .populate('courseId', 'code name type -_id');

    // Transform the data for frontend
    const studentsMap = new Map();
    
    enrollments.forEach(enrollment => {
      const studentKey = enrollment.studentId.userId.email;
      if (!studentsMap.has(studentKey)) {
        studentsMap.set(studentKey, {
          name: `${enrollment.studentId.userId.firstName} ${enrollment.studentId.userId.lastName}`,
          email: enrollment.studentId.userId.email,
          major: enrollment.studentId.major,
          year: enrollment.studentId.year,
          courses: []
        });
      }
      
      studentsMap.get(studentKey).courses.push({
        code: enrollment.courseId.code,
        name: enrollment.courseId.name,
        type: enrollment.courseId.type,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status
      });
    });

    const students = Array.from(studentsMap.values());

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching all enrolled students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled students'
    });
  }
});

export default router;