import { Schedule, Course, Room, Instructor, User, Student } from '../config/database.js';

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
    if (!conflictCheck.success) {
      return res.status(400).json(conflictCheck);
    }

    const schedule = new Schedule(scheduleData);
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
      message: 'Schedule created successfully',
      schedule: populatedSchedule 
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

    // Check for conflicts if updating time/room/instructor
    if (updateData.dayOfWeek || updateData.startTime || updateData.endTime || 
        updateData.roomId || updateData.instructorId) {
      const conflictCheck = await checkScheduleConflicts(updateData, id);
      if (!conflictCheck.success) {
        return res.status(400).json(conflictCheck);
      }
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
      message: 'Schedule updated successfully',
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
    const { dayOfWeek, startTime, endTime, roomId, instructorId, semester, academicYear } = scheduleData;
    
    let filter = {
      dayOfWeek,
      semester: semester || 'Fall 2024',
      academicYear: academicYear || '2024-2025',
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    // Check room conflict
    const roomConflict = await Schedule.findOne({
      ...filter,
      roomId
    });

    if (roomConflict) {
      return { 
        success: false, 
        message: 'Room is already booked for this time slot',
        conflictType: 'room'
      };
    }

    // Check instructor conflict
    const instructorConflict = await Schedule.findOne({
      ...filter,
      instructorId
    });

    if (instructorConflict) {
      return { 
        success: false, 
        message: 'Instructor is already scheduled for this time slot',
        conflictType: 'instructor'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Conflict check error:', error);
    return { success: false, message: 'Failed to check for conflicts' };
  }
}