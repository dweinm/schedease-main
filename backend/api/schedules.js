import { Router } from 'express';
import mongoose from 'mongoose';
import { Schedule, Course, Room, Instructor, User, Student } from '../config/database.js';
import { getSystemSettings } from '../config/systemSettings.js';
import { requireAuth } from '../utils/auth.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get all schedules
async function getSchedules(req, res) {
  try {
    const { semester, academicYear } = req.query;
    let filter = {};
    
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const schedules = await Schedule.find(filter)
      .populate('courseId', 'code name department credits type')
      .populate('roomId', 'name building capacity type')
      .populate({
        path: 'instructorId',
        populate: {
          path: 'userId',
          select: 'name email department'
        }
      })
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ success: true, schedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
}

// Get instructor schedules
async function getInstructorSchedules(req, res) {
  try {
    const { instructorId } = req.params;
    const { semester, academicYear } = req.query;
    
    let filter = { instructorId };
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const schedules = await Schedule.find(filter)
      .populate('courseId', 'code name department credits type')
      .populate('roomId', 'name building capacity type')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ success: true, schedules });
  } catch (error) {
    console.error('Get instructor schedules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch instructor schedules' });
  }
}

// Get student schedules
async function getStudentSchedules(req, res) {
  try {
    const { studentId } = req.params;
    const { semester, academicYear } = req.query;
    
    // First, find the student and their enrolled courses
    const student = await Student.findById(studentId).populate('enrolledCourses');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    let filter = { 
      courseId: { $in: student.enrolledCourses.map(course => course._id) }
    };
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const schedules = await Schedule.find(filter)
      .populate('courseId', 'code name department credits type')
      .populate('roomId', 'name building capacity type')
      .populate({
        path: 'instructorId',
        populate: {
          path: 'userId',
          select: 'name email department'
        }
      })
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ success: true, schedules });
  } catch (error) {
    console.error('Get student schedules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student schedules' });
  }
}

// Helper function has been moved to the bottom of the file

// Helper function to ensure all required fields are present and valid
function validateScheduleData(scheduleData) {
  console.log('Validating schedule data:', scheduleData); // Debug log

  const requiredFields = ['courseId', 'instructorId', 'roomId', 'dayOfWeek', 'startTime', 'endTime', 'semester', 'year'];
  const missingFields = requiredFields.filter(field => !scheduleData[field]);
  
  // First check for missing fields
  if (missingFields.length > 0) {
    return {
      isValid: false,
      missingFields,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate field values
  const validationErrors = [];
  
  // Validate and convert MongoDB ObjectIds
  ['courseId', 'instructorId', 'roomId'].forEach(field => {
    let value = scheduleData[field];
    if (typeof value === 'string') {
      // Try to clean up the ID by removing any non-hex characters
      value = value.replace(/[^0-9a-fA-F]/g, '');
      // Pad with zeros if needed to reach 24 characters
      while (value.length < 24) {
        value = '0' + value;
      }
      // Trim to 24 characters if longer
      value = value.slice(0, 24);
      scheduleData[field] = value;
    }
    
    if (!mongoose.Types.ObjectId.isValid(value)) {
      validationErrors.push(`Invalid ${field}: must be a valid MongoDB ObjectId`);
    }
  });

  // Validate semester enum
  const validSemesters = ['First Term', 'Second Term', 'Third Term'];
  if (!validSemesters.includes(scheduleData.semester)) {
    validationErrors.push(`'${scheduleData.semester}' is not a valid semester. Must be one of: ${validSemesters.join(', ')}`);
  }

  // Validate year
  const year = Number(scheduleData.year);
  if (isNaN(year) || !Number.isInteger(year)) {
    validationErrors.push('Year must be a valid number');
  }

  // Validate dayOfWeek enum
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (!validDays.includes(scheduleData.dayOfWeek)) {
    validationErrors.push(`'${scheduleData.dayOfWeek}' is not a valid day. Must be one of: ${validDays.join(', ')}`);
  }

  // If we found any validation errors
  if (validationErrors.length > 0) {
    return {
      isValid: false,
      missingFields: [],
      message: validationErrors.join('; ')
    };
  }

  // Convert year to number if it's a string
  scheduleData.year = year;

  return {
    isValid: true,
    missingFields: []
  };
}

// Create new schedule entry
async function createSchedule(req, res) {
  try {
    const scheduleData = req.body;
    console.log('Creating schedule with data:', scheduleData); // Debug log

    // Validate required fields and data types
    const validation = validateScheduleData(scheduleData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message || `Missing required fields: ${validation.missingFields.join(', ')}`
      });
    }

    // Check for conflicts
    const conflictCheck = await checkScheduleConflicts(scheduleData);
    console.log('Conflict check results:', conflictCheck); // Debug log
    
    // If conflicts exist, set the status accordingly but allow creation
    if (conflictCheck.hasConflicts) {
      scheduleData.status = 'conflict';
      scheduleData.conflicts = conflictCheck.conflicts;
    } else {
      scheduleData.status = 'published';
      scheduleData.conflicts = [];
    }

      // Convert string IDs to ObjectIds with proper validation
    const idFields = ['courseId', 'instructorId', 'roomId'];
    for (const field of idFields) {
      if (scheduleData[field]) {
        const cleanId = scheduleData[field].toString().replace(/[^0-9a-fA-F]/g, '').padStart(24, '0').slice(0, 24);
        if (mongoose.Types.ObjectId.isValid(cleanId)) {
          scheduleData[field] = new mongoose.Types.ObjectId(cleanId);
        } else {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field} format`
          });
        }
      }
    }  // Verify that the referenced entities exist
  const [course, instructor, room] = await Promise.all([
    Course.findById(scheduleData.courseId),
    Instructor.findById(scheduleData.instructorId),
    Room.findById(scheduleData.roomId)
  ]);

  if (!course || !instructor || !room) {
    return res.status(400).json({
      success: false,
      message: 'Referenced course, instructor, or room not found'
    });
  }

  // Add denormalized fields for easier display
  scheduleData.courseCode = course.code;
  scheduleData.courseName = course.name;
  scheduleData.instructorName = instructor.userId?.name || 'Unknown Instructor';
  scheduleData.roomName = room.name;
  scheduleData.building = room.building;
  scheduleData.academicYear = `${scheduleData.year}-${Number(scheduleData.year) + 1}`;
  
  // Create the new schedule with all required fields
  const schedule = await Schedule.create(scheduleData);
  const populatedSchedule = await Schedule.findById(schedule._id)
    .populate('courseId', 'code name department credits type')
    .populate('roomId', 'name building capacity type')
    .populate({
      path: 'instructorId',
      populate: {
        path: 'userId',
        select: 'name email department'
      }
    });
    
  res.status(201).json({ 
      success: true, 
      message: 'Schedule created successfully',
      schedule: populatedSchedule
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to create schedule' });
  }
}

// Update schedule entry
async function updateSchedule(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check for conflicts if updating time/room/instructor
    let status = 'published';
    let conflicts = [];
    
    if (updateData.dayOfWeek || updateData.startTime || updateData.endTime || 
        updateData.roomId || updateData.instructorId) {
      // Check for conflicts, excluding the current schedule
      console.log('Checking conflicts for schedule update:', { id, updateData });
      const conflictCheck = await checkScheduleConflicts(updateData, id);
      console.log('Conflict check results:', conflictCheck);
      
      // If there are conflicts, prevent the update
      if (conflictCheck.hasConflicts) {
        return res.status(400).json({
          success: false,
          message: 'Schedule conflicts detected',
          conflicts: conflictCheck.conflicts
        });
      }
    }

    // Fetch related data if IDs are being updated
    if (updateData.courseId || updateData.instructorId || updateData.roomId) {
      const course = await Course.findById(updateData.courseId);
      const instructor = await Instructor.findById(updateData.instructorId).populate('userId');
      const room = await Room.findById(updateData.roomId);

      if (!course || !instructor || !room) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid course, instructor, or room ID' 
        });
      }

      // Add denormalized fields without reassigning updateData
      Object.assign(updateData, {
        courseCode: course.code,
        courseName: course.name,
        instructorName: instructor.userId?.name || 'Unknown Instructor',
        roomName: room.name,
        building: room.building,
        status,
        conflicts
      });
    } else {
      updateData.status = status;
      updateData.conflicts = conflicts;
    }

    const schedule = await Schedule.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    )
    .populate('courseId', 'code name department credits type')
    .populate('roomId', 'name building capacity type')
    .populate({
      path: 'instructorId',
      populate: {
        path: 'userId',
        select: 'name email department'
      }
    });

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({ 
      success: true, 
      message: status === 'conflict' ? 'Schedule updated with conflicts' : 'Schedule updated successfully',
      schedule 
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule' });
  }
}

// Delete schedule entry
async function deleteSchedule(req, res) {
  try {
    const { id } = req.params;
    
    const schedule = await Schedule.findByIdAndDelete(id);
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({ 
      success: true, 
      message: 'Schedule deleted successfully' 
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete schedule' });
  }
}

// Helper function to check for schedule conflicts
async function checkScheduleConflicts(scheduleData, excludeId = null) {
  const conflicts = [];
  
  try {
    const { dayOfWeek, startTime, endTime, roomId, instructorId, semester, year, courseId } = scheduleData;
    
    // Validate that we have all required fields
    if (!dayOfWeek || !startTime || !endTime || !semester || !year) {
      return {
        success: false,
        conflicts: ['Missing required schedule data'],
        hasConflicts: true
      };
    }

    // Get system settings to check if conflict detection is enabled
    let settings;
    try {
      settings = await getSystemSettings();
    } catch (err) {
      console.error('Error getting system settings:', err);
      settings = { scheduling: { autoConflictDetection: true, allowOverlappingClasses: false } };
    }
    const { autoConflictDetection, allowOverlappingClasses } = settings.scheduling;

    // If conflict detection is disabled, return no conflicts
    if (!autoConflictDetection) {
      return {
        success: true,
        conflicts: [],
        hasConflicts: false
      };
    }

    // Base query to exclude the current schedule being edited
    const baseFilter = excludeId ? { _id: { $ne: excludeId } } : {};

    // Common time filter for all conflict checks
    const timeOverlapFilter = {
      dayOfWeek,
      semester,
      year,
      $or: [{
        $and: [
          { startTime: { $lte: endTime } },
          { endTime: { $gte: startTime } }
        ]
      }]
    };

    // Check for exact duplicates (same course, instructor, room, time, semester, year)
    let exactDuplicate = null;
    try {
      // First validate the IDs
      if (!mongoose.Types.ObjectId.isValid(courseId) || 
          !mongoose.Types.ObjectId.isValid(instructorId) || 
          !mongoose.Types.ObjectId.isValid(roomId)) {
        console.log('Invalid IDs provided:', { courseId, instructorId, roomId });
        throw new Error('Invalid ID format');
      }

      // Then try to find exact duplicates
      exactDuplicate = await Schedule.findOne({
        ...baseFilter,
        courseId: new mongoose.Types.ObjectId(courseId),
        instructorId: new mongoose.Types.ObjectId(instructorId),
        roomId: new mongoose.Types.ObjectId(roomId),
        dayOfWeek,
        startTime,
        endTime,
        semester,
        year
      })
      .populate('courseId', 'code name')
      .populate('roomId', 'name building')
      .lean();

      // Validate that population worked
      if (exactDuplicate && (!exactDuplicate.courseId || !exactDuplicate.roomId)) {
        console.log('Population failed:', exactDuplicate);
        throw new Error('Failed to populate referenced documents');
      }
    } catch (err) {
      console.error('Error fetching exact duplicates:', err);
      // Don't throw, just continue with the conflict checks
      exactDuplicate = null;
    }

    if (exactDuplicate) {
      const courseCode = exactDuplicate.courseId?.code || 'Unknown Course';
      const roomName = exactDuplicate.roomId?.name || 'Unknown Room';
      const building = exactDuplicate.roomId?.building || 'Unknown Building';
      conflicts.push(`Duplicate schedule found: ${courseCode} is already scheduled in ${roomName} (${building}) at the same time slot (${dayOfWeek} ${startTime}-${endTime}) in ${semester} ${year}`);
    }

    // Create time overlap filter with semester and year
    const timeFilter = {
      ...baseFilter,
      dayOfWeek,
      semester,
      year,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    // Function to check if schedules are effectively the same
    const isSameSchedule = (schedule) => {
      return schedule.roomId?.toString() === roomId?.toString() &&
             schedule.instructorId?.toString() === instructorId?.toString() &&
             schedule.courseId?.toString() === courseId?.toString() &&
             schedule.dayOfWeek === dayOfWeek &&
             schedule.startTime === startTime &&
             schedule.endTime === endTime &&
             schedule.semester === semester &&
             schedule.year === year;
    };

      // Check room conflicts (regardless of allowOverlappingClasses setting)
    if (roomId && mongoose.Types.ObjectId.isValid(roomId)) {
      let roomConflicts = [];
      try {
        roomConflicts = await Schedule.find({
          ...timeFilter,
          roomId: new mongoose.Types.ObjectId(roomId)
        })
        .populate('courseId', 'code name')
        .lean();

        // Filter out any conflicts where population failed
        roomConflicts = roomConflicts.filter(conflict => conflict && conflict.courseId);
      } catch (err) {
        console.error('Error fetching room conflicts:', err);
      }

      const actualRoomConflicts = roomConflicts.filter(conflict => 
        conflict && !isSameSchedule(conflict));      if (actualRoomConflicts.length > 0) {
        const conflictDetails = actualRoomConflicts.map(s => 
          `${s.courseId?.code || 'Unknown Course'} (${s.startTime}-${s.endTime})`
        ).join(', ');
        // Room conflicts are always reported as they can't be overridden
        conflicts.push(`Room is already booked during this time: ${conflictDetails}`);
      }
    }

    // Check instructor conflicts
    if (instructorId && !allowOverlappingClasses && mongoose.Types.ObjectId.isValid(instructorId)) {
      let instructorConflicts = [];
      try {
        instructorConflicts = await Schedule.find({
          ...timeFilter,
          instructorId: new mongoose.Types.ObjectId(instructorId)
        })
        .populate('courseId', 'code name')
        .lean();

        // Filter out any conflicts where population failed
        instructorConflicts = instructorConflicts.filter(conflict => conflict && conflict.courseId);
      } catch (err) {
        console.error('Error fetching instructor conflicts:', err);
      }
      
      const actualInstructorConflicts = instructorConflicts.filter(conflict => 
        conflict && conflict.courseId && !isSameSchedule(conflict));

      if (actualInstructorConflicts.length > 0) {
        const conflictDetails = actualInstructorConflicts.map(s => 
          `${s.courseId?.code || 'Unknown Course'} (${s.startTime}-${s.endTime})`
        ).join(', ');
        conflicts.push(`Instructor has another class during this time: ${conflictDetails}`);
      }
    }

    // Check course conflicts (same course in same semester/year)
    let courseConflicts = [];
    try {
      if (mongoose.Types.ObjectId.isValid(courseId)) {
        courseConflicts = await Schedule.find({
          ...baseFilter,
          courseId: new mongoose.Types.ObjectId(courseId),
          semester,
          year,
          _id: { $ne: excludeId }
        })
        .populate('courseId', 'code name')
        .lean();

        // Filter out any conflicts where population failed
        courseConflicts = courseConflicts.filter(conflict => conflict && conflict.courseId);
      }
    } catch (err) {
      console.error('Error fetching course conflicts:', err);
    }

    if (courseConflicts.length > 0 && !courseConflicts.some(conflict => 
      conflict && conflict.courseId && isSameSchedule(conflict))) {
      const conflictDetails = courseConflicts.map(s => 
        `${s.dayOfWeek} (${s.startTime}-${s.endTime})`
      ).join(', ');
      const courseCode = courseConflicts[0]?.courseId?.code || 'Unknown Course';
      conflicts.push(`Course ${courseCode} is already scheduled in ${semester} ${year} on: ${conflictDetails}`);
    }

    // Log the final results
    console.log('Conflict check results:', {
      conflicts,
      semester,
      year,
      dayOfWeek,
      startTime,
      endTime,
      hasConflicts: conflicts.length > 0
    });

    return {
      success: true,
      conflicts,
      hasConflicts: conflicts.length > 0
    };
  } catch (error) {
    console.error('Conflict check error:', error);
    return { 
      success: false, 
      conflicts: ['Error checking for conflicts: ' + (error.message || 'Unknown error')], 
      hasConflicts: true 
    };
  }
}

// NOTE: Removed named exports since we're only using the router

// Configure routes
router.get('/', getSchedules);
router.get('/instructor/:instructorId', getInstructorSchedules);
router.get('/student/:studentId', getStudentSchedules);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

// Export router as default since other files import this
export default router;