import { Course } from '../config/database.js';
import { Schedule } from '../config/database.js';

// Get all courses
export async function getCourses(req, res) {
  try {
    const courses = await Course.find().sort({ code: 1 }).populate({ path: 'instructorId', populate: { path: 'userId', model: 'User' } });
    res.json({ success: true, courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
}

// Get course by ID
export async function getCourseById(req, res) {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate({ path: 'instructorId', populate: { path: 'userId', model: 'User' } });
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, course });
  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course' });
  }
}

// Get courses for a specific instructor (by direct assignment or via schedules)
export async function getInstructorCourses(req, res) {
  try {
    const { instructorId } = req.params;

    // Find courses where course.instructorId matches
    const directlyAssigned = await Course.find({ instructorId: instructorId })
      .populate({ path: 'instructorId', populate: { path: 'userId', model: 'User' } });

    // Find distinct courseIds from schedules taught by this instructor
    const scheduleCourseIds = await Schedule.distinct('courseId', { instructorId });

    // Fetch those courses too (avoid duplicates)
    const viaSchedules = await Course.find({ _id: { $in: scheduleCourseIds } })
      .populate({ path: 'instructorId', populate: { path: 'userId', model: 'User' } });

    // Merge unique courses by _id
    const map = new Map();
    for (const c of [...directlyAssigned, ...viaSchedules]) {
      map.set(String(c._id), c);
    }
    const courses = Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));

    res.json({ success: true, courses });
  } catch (error) {
    console.error('Get instructor courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch instructor courses' });
  }
}

// Create new course
export async function createCourse(req, res) {
  try {
    const courseData = req.body;
    
    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: courseData.code });
    if (existingCourse) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }

    const course = new Course(courseData);
    const savedCourse = await course.save();

    // Populate instructor info for response
    const populated = await Course.findById(savedCourse._id).populate({ path: 'instructorId', populate: { path: 'userId', model: 'User' } });

    res.status(201).json({ 
      success: true, 
      message: 'Course created successfully',
      course: populated || savedCourse 
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: 'Failed to create course' });
  }
}

// Update course
export async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if trying to update to an existing course code
    if (updateData.code) {
      const existingCourse = await Course.findOne({ 
        code: updateData.code, 
        _id: { $ne: id } 
      });
      if (existingCourse) {
        return res.status(400).json({ success: false, message: 'Course code already exists' });
      }
    }

    const course = await Course.findByIdAndUpdate(
      id, 
      { ...updateData, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Return populated course
    const populated = await Course.findById(course._id).populate({ path: 'instructorId', populate: { path: 'userId', model: 'User' } });

    res.json({ 
      success: true, 
      message: 'Course updated successfully',
      course: populated || course 
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, message: 'Failed to update course' });
  }
}

// Delete course
export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;
    
    const course = await Course.findByIdAndDelete(id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
}