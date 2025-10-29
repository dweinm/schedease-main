import { Schedule, Course, Room, Instructor, User, Student } from '../config/database.js';
import { getSystemSettings } from '../config/systemSettings.js';

// Get all schedules
export async function getSchedules(req, res) {
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
export async function getInstructorSchedules(req, res) {
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
export async function getStudentSchedules(req, res) {
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

// Create new schedule entry
export async function createSchedule(req, res) {
  try {
    const scheduleData = req.body;

    // Check for conflicts
    const conflictCheck = await checkScheduleConflicts(scheduleData);
    
    // If there are conflicts and they include an exact duplicate, prevent creation
    if (conflictCheck.hasConflicts && conflictCheck.conflicts.some(c => c === 'This exact schedule already exists')) {
      return res.status(400).json({
        success: false,
        message: 'This exact schedule already exists',
        conflicts: conflictCheck.conflicts
      });
    }
    
    // Otherwise, proceed with creation but mark conflicts if any
    scheduleData.status = conflictCheck.hasConflicts ? 'conflict' : 'published';
    scheduleData.conflicts = conflictCheck.conflicts || [];
    
    // Log status for debugging
    console.log('Creating schedule with status:', scheduleData.status);

    // Fetch related data to save denormalized fields
    const course = await Course.findById(scheduleData.courseId);
    const instructor = await Instructor.findById(scheduleData.instructorId).populate('userId');
    const room = await Room.findById(scheduleData.roomId);

    if (!course || !instructor || !room) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid course, instructor, or room ID' 
      });
    }

    // Add denormalized fields
    const enrichedScheduleData = {
      ...scheduleData,
      courseCode: course.code,
      courseName: course.name,
      instructorName: instructor.userId?.name || 'Unknown Instructor',
      roomName: room.name,
      building: room.building
    };

    const schedule = new Schedule(enrichedScheduleData);
    const savedSchedule = await schedule.save();

    // Populate the saved schedule
    const populatedSchedule = await Schedule.findById(savedSchedule._id)
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
      message: conflictCheck.hasConflicts ? 'Schedule created with conflicts' : 'Schedule created successfully',
      schedule: populatedSchedule,
      conflicts: conflictCheck.conflicts
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to create schedule' });
  }
}

// Update schedule entry
export async function updateSchedule(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check for conflicts if updating time/room/instructor, but always proceed
    let status = updateData.status || 'published';
    let conflicts = updateData.conflicts || [];
    
    if (updateData.dayOfWeek || updateData.startTime || updateData.endTime || 
        updateData.roomId || updateData.instructorId) {
      // Check for conflicts, excluding the current schedule
      console.log('Checking conflicts for schedule update:', { id, updateData });
      const conflictCheck = await checkScheduleConflicts(updateData, id);
      console.log('Conflict check results:', conflictCheck);
      
      // Set status and conflicts based on check results
      status = conflictCheck.hasConflicts ? 'conflict' : 'published';
      conflicts = conflictCheck.conflicts;
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
export async function deleteSchedule(req, res) {
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
  try {
    const { dayOfWeek, startTime, endTime, roomId, instructorId, semester, year, courseId } = scheduleData;
    const conflicts = [];

    // Get system settings to check if conflict detection is enabled
    const settings = await getSystemSettings();
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

    // Check for exact duplicates (same course, time, semester, year)
    const exactDuplicate = await Schedule.findOne({
      ...baseFilter,
      courseId,
      dayOfWeek,
      startTime,
      endTime,
      semester,
      year
    }).populate('courseId', 'code name');

    if (exactDuplicate) {
      conflicts.push(`Course ${exactDuplicate.courseId.code} is already scheduled for this time slot in ${semester} ${year}`);
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
    if (roomId) {
      const roomConflicts = await Schedule.find({
        ...timeFilter,
        roomId
      }).populate('courseId', 'code');

      const actualRoomConflicts = roomConflicts.filter(conflict => !isSameSchedule(conflict));
      
      if (actualRoomConflicts.length > 0) {
        const conflictDetails = actualRoomConflicts.map(s => 
          `${s.courseId.code} (${s.startTime}-${s.endTime})`
        ).join(', ');
        // Room conflicts are always reported as they can't be overridden
        conflicts.push(`Room is already booked during this time: ${conflictDetails}`);
      }
    }

    // Check instructor conflicts
    if (instructorId && !allowOverlappingClasses) {
      const instructorConflicts = await Schedule.find({
        ...timeFilter,
        instructorId
      }).populate('courseId', 'code');
      
      const actualInstructorConflicts = instructorConflicts.filter(conflict => !isSameSchedule(conflict));

      if (actualInstructorConflicts.length > 0) {
        const conflictDetails = actualInstructorConflicts.map(s => 
          `${s.courseId.code} (${s.startTime}-${s.endTime})`
        ).join(', ');
        conflicts.push(`Instructor has another class during this time: ${conflictDetails}`);
      }
    }

    // Check course conflicts (same course in same semester/year)
    const courseConflicts = await Schedule.find({
      ...baseFilter,
      courseId,
      semester,
      year,
      _id: { $ne: excludeId }
    }).populate('courseId', 'code');

    if (courseConflicts.length > 0 && !courseConflicts.some(conflict => isSameSchedule(conflict))) {
      const conflictDetails = courseConflicts.map(s => 
        `${s.dayOfWeek} (${s.startTime}-${s.endTime})`
      ).join(', ');
      conflicts.push(`Course ${courseConflicts[0].courseId.code} is already scheduled in ${semester} ${year} on: ${conflictDetails}`);
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
      success: conflicts.length === 0,
      conflicts,
      hasConflicts: conflicts.length > 0
    };
  } catch (error) {
    console.error('Conflict check error:', error);
    return { 
      success: false, 
      conflicts: ['Error checking for conflicts'], 
      hasConflicts: true 
    };
  }
}