import { ScheduleRequest, Instructor, Course } from '../config/database.js';
import { verifyToken } from '../utils/auth.js';

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

    res.json({ success: true, requests });
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

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get instructor schedule requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch instructor schedule requests' });
  }
}

// Create a new schedule request
export async function createScheduleRequest(req, res) {
  try {
    const { instructorId, requestType, courseId, details } = req.body;

    // Verify instructor exists
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    // If courseId is provided, verify course exists
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
    }

    const request = new ScheduleRequest({
      instructorId,
      requestType,
      courseId,
      details,
      status: 'pending'
    });

    await request.save();

    res.status(201).json({ success: true, request });
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

    request.status = status;
    if (notes) request.notes = notes;
    request.updatedAt = Date.now();

    await request.save();

    res.json({ success: true, request });
  } catch (error) {
    console.error('Update schedule request status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule request status' });
  }
}

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