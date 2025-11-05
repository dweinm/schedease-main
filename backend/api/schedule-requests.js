import { ScheduleRequest, Instructor, Course, Room, Schedule, User } from '../config/database.js';
import { verifyToken } from '../utils/auth.js';
import mongoose from 'mongoose';
import { addNotification } from '../utils/notifications.js';

// Get all schedule requests
export async function getScheduleRequests(req, res) {
  try {
    const requests = await ScheduleRequest.find()
      .populate({
        path: 'instructorId',
        populate: {
          path: 'userId',
          select: 'name email department'
        }
      })
      .populate('courseId', 'code name')
      .sort({ createdAt: -1 });

    // Return under `data` key for frontend compatibility
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get schedule requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule requests' });
  }
}

// Get instructor's schedule requests
export async function getInstructorScheduleRequests(req, res) {
  try {
    const { instructorId } = req.params;
    
    const requests = await ScheduleRequest.find({ instructorId })
      .populate('courseId', 'code name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get instructor schedule requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch instructor schedule requests' });
  }
}

// Create a new schedule request
export async function createScheduleRequest(req, res) {
  try {
    // Expected body: { instructorId?, roomId, courseId?, scheduleId?, date or dayOfWeek, startTime, endTime, purpose, notes, semester?, year? }
    const { instructorId: bodyInstructorId, roomId, courseId, scheduleId, date, dayOfWeek: bodyDayOfWeek, startTime, endTime, purpose, notes, semester, year } = req.body;

    // If instructor not provided in body, try req.user (set by requireAuth)
    const instructorId = bodyInstructorId || (req.user && req.user.id);
    if (!instructorId) {
      return res.status(400).json({ success: false, message: 'Instructor ID required' });
    }

    // Verify instructor exists
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    if (!roomId || (!date && !bodyDayOfWeek) || !startTime || !endTime || !purpose) {
      return res.status(400).json({ success: false, message: 'roomId, date or dayOfWeek, startTime, endTime and purpose are required' });
    }

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Determine dayOfWeek
    const dayOfWeek = bodyDayOfWeek || (date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long' }) : undefined);

    // Conflict detection against existing Schedules for same room and dayOfWeek
    const overlappingSchedules = await Schedule.find({
      roomId: roomId,
      dayOfWeek: dayOfWeek,
      ...(semester ? { semester } : {}),
      ...(year ? { year } : {}),
    })
    .select('courseId dayOfWeek startTime endTime')
    .populate('courseId', 'code name');

    const conflicts = [];
    for (const s of overlappingSchedules) {
      if (startTime < s.endTime && endTime > s.startTime) {
        const code = s.courseId?.code || 'Unknown';
        const name = s.courseId?.name || '';
        conflicts.push(`Room conflict with ${code} ${name} (${s.dayOfWeek} ${s.startTime}-${s.endTime})`);
      }
    }
    const conflict_flag = conflicts.length > 0;

    // Save new request
    const request = new ScheduleRequest({
      instructorId,
      courseId: courseId || undefined,
      scheduleId: scheduleId || undefined,
      roomId,
      date: date || undefined,
      dayOfWeek,
      startTime,
      endTime,
      semester: semester || undefined,
      year: year || undefined,
      purpose,
      notes,
      requestType: (req.body && req.body.requestType) || 'room_change',
      details: (req.body && (req.body.details || req.body.purpose || req.body.notes)) || purpose || notes || 'Schedule change request',
      status: 'pending',
      conflict_flag,
      conflicts
    });

    await request.save();

    // Denormalize display fields
    try {
      const [instr, course, r] = await Promise.all([
        Instructor.findById(instructorId).populate('userId'),
        courseId ? Course.findById(courseId) : null,
        Room.findById(roomId)
      ]);
      if (instr?.userId?.name) request.instructorName = instr.userId.name;
      if (course) {
        request.courseName = course.name;
        request.courseCode = course.code;
      }
      if (r) request.roomName = r.name;
      await request.save();
    } catch {}

    const populated = await ScheduleRequest.findById(request._id)
      .populate({ path: 'instructorId', populate: { path: 'userId', select: 'name email' } })
      .populate('roomId', 'name building')
      .populate('courseId', 'code name');

    // Notify Admins: New schedule request
    try {
      await addNotification({
        role: 'admin',
        title: 'New Schedule Request',
        message: `${populated?.instructorId?.userId?.name || 'An instructor'} submitted a schedule request for ${populated?.courseId?.code || ''} ${populated?.courseId?.name || ''}`,
        type: 'request'
      });
    } catch {}

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create schedule request error:', error);
    res.status(500).json({ success: false, message: 'Failed to create schedule request' });
  }
}

// Update schedule request status
export async function updateScheduleRequestStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;

    const request = await ScheduleRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Schedule request not found' });
    }

    // Validate status
    const valid = ['pending', 'approved', 'rejected'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Store original status before updating
    const originalStatus = request.status;
    
    request.status = status;
    if (notes) request.notes = notes;
    request.updatedAt = Date.now();

    // If approved, create a Schedule entry and re-check conflicts
    if (status === 'approved') {
      // Check if all required fields are present to create a schedule
      // Only create schedule if request was previously not approved (to avoid duplicates)
      const wasAlreadyApproved = originalStatus === 'approved';
      
      if (!wasAlreadyApproved && request.courseId && request.instructorId && request.roomId && request.dayOfWeek && 
          request.startTime && request.endTime) {
        try {
          // Determine semester and year if not provided
          let semester = request.semester;
          let year = request.year;
          let academicYear = request.academicYear;

          if (!semester || !year) {
            // Derive from date if available
            if (request.date) {
              const date = new Date(request.date + 'T00:00:00');
              const month = date.getMonth(); // 0-11
              
              // Define semester ranges
              if (month >= 8 && month <= 11) semester = 'First Term';  // Sep-Dec
              else if (month >= 0 && month <= 3) semester = 'Second Term';  // Jan-Apr
              else semester = 'Third Term';  // May-Aug
              
              year = date.getFullYear();
            } else {
              // Use current date as fallback
              const now = new Date();
              const month = now.getMonth();
              if (month >= 8 && month <= 11) semester = 'First Term';
              else if (month >= 0 && month <= 3) semester = 'Second Term';
              else semester = 'Third Term';
              year = now.getFullYear();
            }
          }

          if (!academicYear) {
            academicYear = `${year}-${Number(year) + 1}`;
          }

          // Check for conflicts with existing schedules
          const overlappingSchedules = await Schedule.find({
            roomId: request.roomId,
            dayOfWeek: request.dayOfWeek,
            semester: semester,
            year: year
          })
          .select('courseId dayOfWeek startTime endTime')
          .populate('courseId', 'code name');

          const conflicts = [];
          for (const s of overlappingSchedules) {
            if (request.startTime < s.endTime && request.endTime > s.startTime) {
              const code = s.courseId?.code || 'Unknown';
              const name = s.courseId?.name || '';
              conflicts.push(`Room conflict with ${code} ${name} (${s.dayOfWeek} ${s.startTime}-${s.endTime})`);
            }
          }

          // Get course and room details for denormalized fields
          const [course, room, instructor] = await Promise.all([
            Course.findById(request.courseId),
            Room.findById(request.roomId),
            Instructor.findById(request.instructorId).populate('userId')
          ]);

          // Create the schedule entry
          const scheduleData = {
            courseId: request.courseId,
            instructorId: request.instructorId,
            roomId: request.roomId,
            dayOfWeek: request.dayOfWeek,
            startTime: request.startTime,
            endTime: request.endTime,
            semester: semester,
            year: year,
            academicYear: academicYear,
            status: conflicts.length > 0 ? 'conflict' : 'published',
            conflicts: conflicts,
            // Denormalized fields
            courseCode: course?.code || '',
            courseName: course?.name || '',
            instructorName: instructor?.userId?.name || 'Unknown Instructor',
            roomName: room?.name || '',
            building: room?.building || ''
          };

          const schedule = await Schedule.create(scheduleData);
          console.log('Schedule created from approved request:', schedule._id);
        } catch (scheduleError) {
          console.error('Error creating schedule from approved request:', scheduleError);
          // Don't fail the approval if schedule creation fails, but log the error
        }
      }

      // Re-check conflicts with other approved requests
      const existingApproved = await ScheduleRequest.find({
        _id: { $ne: request._id },
        roomId: request.roomId,
        date: request.date,
        status: 'approved'
      });

      let conflict_flag = false;
      for (const ex of existingApproved) {
        if (request.startTime < ex.endTime && request.endTime > ex.startTime) {
          conflict_flag = true;
          break;
        }
      }
      request.conflict_flag = conflict_flag;
    }

    await request.save();

    const populated = await ScheduleRequest.findById(request._id)
      .populate({ path: 'instructorId', populate: { path: 'userId', select: 'name email' } })
      .populate('roomId', 'name building');

    // Notify Instructor: status update
    try {
      const instr = await Instructor.findById(populated.instructorId).populate('userId');
      if (instr?.userId?._id) {
        await addNotification({
          userId: instr.userId._id.toString(),
          title: 'Schedule Request Update',
          message: `Your schedule request was ${populated.status}.`,
          type: 'request'
        });
      }
    } catch {}

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Update schedule request status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule request status' });
  }
}

// Approve via POST /approve
export const approveScheduleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    // delegate to updateScheduleRequestStatus with status=approved
    req.body = req.body || {};
    req.body.status = 'approved';
    return await updateScheduleRequestStatus(req, res);
  } catch (error) {
    console.error('Approve schedule request error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve schedule request' });
  }
};

// Reject via POST /reject
export const rejectScheduleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    req.body = req.body || {};
    req.body.status = 'rejected';
    return await updateScheduleRequestStatus(req, res);
  } catch (error) {
    console.error('Reject schedule request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject schedule request' });
  }
};

// Delete a schedule request
export async function deleteScheduleRequest(req, res) {
  try {
    const { requestId } = req.params;

    const request = await ScheduleRequest.findByIdAndDelete(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Schedule request not found' });
    }

    res.json({ success: true, message: 'Schedule request deleted successfully' });
  } catch (error) {
    console.error('Delete schedule request error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete schedule request' });
  }
}