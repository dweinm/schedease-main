import { Enrollment, Student, Course, Schedule, Instructor } from '../config/database.js';

// Get all enrollments (admin)
export async function getEnrollments(req, res) {
  try {
    const enrollments = await Enrollment.find()
      .populate('studentId')
      .populate('courseId')
      .populate('scheduleId')
      .populate({ path: 'instructorId', populate: { path: 'userId', model: 'User' } });

    res.json({ success: true, enrollments });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
  }
}

// Get enrollments for a specific student (admin or student themself)
export async function getStudentEnrollments(req, res) {
  try {
    const { studentId } = req.params;

    // allow students to fetch their own enrollments
    if (req.user.role !== 'admin') {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student || String(student._id) !== String(studentId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    const enrollments = await Enrollment.find({ studentId })
      .populate('studentId')
      .populate('courseId')
      .populate('scheduleId')
      .populate({ path: 'instructorId', populate: { path: 'userId', model: 'User' } });

    res.json({ success: true, enrollments });
  } catch (error) {
    console.error('Get student enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student enrollments' });
  }
}

// Get enrollments for the current authenticated student
export async function getMyEnrollments(req, res) {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const enrollments = await Enrollment.find({ studentId: student._id })
      .populate('studentId')
      .populate('courseId')
      .populate('scheduleId')
      .populate({ path: 'instructorId', populate: { path: 'userId', model: 'User' } });

    res.json({ success: true, enrollments });
  } catch (error) {
    console.error('Get my enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
  }
}

// Get enrollments for instructor (admin or instructor themself)
export async function getInstructorEnrollments(req, res) {
  try {
    const { instructorId } = req.params;

    if (req.user.role !== 'admin') {
      // find instructor profile for this user
      const instr = await Instructor.findOne({ userId: req.user.id });
      if (!instr || String(instr._id) !== String(instructorId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    const enrollments = await Enrollment.find({ instructorId })
      .populate('studentId')
      .populate('courseId')
      .populate('scheduleId');

    res.json({ success: true, enrollments });
  } catch (error) {
    console.error('Get instructor enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
  }
}

// Create enrollment(s) - supports single or bulk
export const createEnrollment = async (req, res) => {
  try {
    const payload = req.body;

    // Required: courseId
    if (!payload.courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required' });
    }

    // Validate referenced entities
    const course = await Course.findById(payload.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const schedule = payload.scheduleId ? await Schedule.findById(payload.scheduleId) : null;
    const instructor = payload.instructorId ? await Instructor.findById(payload.instructorId) : null;

    // Determine target students: explicit list or by year/section
    let studentsToEnroll = [];
    if (payload.students && Array.isArray(payload.students) && payload.students.length > 0) {
      studentsToEnroll = await Student.find({ _id: { $in: payload.students } });
    } else if (payload.yearLevel || payload.section) {
      const query = {};
      if (payload.yearLevel) query.year = payload.yearLevel;
      if (payload.section) query.section = payload.section;
      studentsToEnroll = await Student.find(query);
    } else if (payload.studentId) {
      const s = await Student.findById(payload.studentId);
      if (s) studentsToEnroll = [s];
    } else {
      return res.status(400).json({ success: false, message: 'No students specified for enrollment' });
    }

    if (studentsToEnroll.length === 0) {
      return res.status(404).json({ success: false, message: 'No matching students found to enroll' });
    }

    const created = [];
    const conflicts = [];

    for (const stud of studentsToEnroll) {
      // Check for duplicate enrollment for same course+schedule
      const exists = await Enrollment.findOne({ studentId: stud._id, courseId: course._id, scheduleId: schedule?._id || null });
      if (exists) {
        conflicts.push({ studentId: stud._id, reason: 'Already enrolled' });
        continue;
      }

      // Optional: basic conflict check - same schedule overlap
      if (schedule) {
        const studentEnrollments = await Enrollment.find({ studentId: stud._id }).populate('scheduleId');
        for (const se of studentEnrollments) {
          if (se.scheduleId && String(se.scheduleId._id) !== String(schedule._id)) {
            // simple day/time overlap check
            if (se.scheduleId.dayOfWeek === schedule.dayOfWeek) {
              // compare times (HH:MM strings)
              const sStart = se.scheduleId.startTime;
              const sEnd = se.scheduleId.endTime;
              const tStart = schedule.startTime;
              const tEnd = schedule.endTime;
              if (!(tEnd <= sStart || tStart >= sEnd)) {
                conflicts.push({ studentId: stud._id, reason: 'Schedule conflict' });
                break; // still proceed to enroll per requirements
              }
            }
          }
        }
      }

      // Load student with user info for denormalization
      const populatedStudent = await Student.findById(stud._id).populate('userId');

      const enrollment = new Enrollment({
        studentId: stud._id,
        courseId: course._id,
        scheduleId: schedule?._id || null,
        instructorId: instructor?._id || null,
        yearLevel: payload.yearLevel || stud.year,
        section: payload.section || stud.section,
        // Denormalized fields
        studentName: populatedStudent.userId.name,
        courseName: course.name,
        courseCode: course.code
      });
      
      const saved = await enrollment.save();
      
      // Update course enrollment count
      await Course.findByIdAndUpdate(course._id, { $inc: { studentsEnrolled: 1 } });

      // Update schedule enrolled count if schedule exists
      if (schedule) {
        // Get current enrollments for this schedule
        const enrolledCount = await Enrollment.countDocuments({ scheduleId: schedule._id });
        await Schedule.findByIdAndUpdate(schedule._id, { 
          $set: { enrolledCount: enrolledCount + 1 } 
        });
      }

      created.push(saved);
    }

    res.status(201).json({ success: true, message: 'Enrollments created', created, conflicts });
  } catch (error) {
    console.error('Create enrollment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create enrollments' });
  }
}

// Delete/unenroll
export async function deleteEnrollment(req, res) {
  try {
    const { id } = req.params;
    
    // Find enrollment before deleting to get courseId and scheduleId
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    
    // Delete the enrollment
    await enrollment.deleteOne();
    
    // Decrement course enrollment count
    await Course.findByIdAndUpdate(enrollment.courseId, { $inc: { studentsEnrolled: -1 } });
    
    // Update schedule enrolled count if schedule exists
    if (enrollment.scheduleId) {
      // Get current enrollments for this schedule
      const enrolledCount = await Enrollment.countDocuments({ scheduleId: enrollment.scheduleId });
      await Schedule.findByIdAndUpdate(enrollment.scheduleId, { 
        $set: { enrolledCount: enrolledCount } 
      });
    }
    
    res.json({ success: true, message: 'Enrollment removed' });
  } catch (error) {
    console.error('Delete enrollment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete enrollment' });
  }
}
