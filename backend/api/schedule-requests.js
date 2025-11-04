import { ScheduleRequest, Instructor, Course, Room, Schedule } from '../config/database.js';
import { verifyToken } from '../utils/auth.js';
import mongoose from 'mongoose';

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

    request.status = status;
    if (notes) request.notes = notes;
    request.updatedAt = Date.now();

    // If approved, re-check conflicts and set conflict_flag if overlapping approved exists
    if (status === 'approved') {
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