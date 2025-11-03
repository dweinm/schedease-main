import { Student } from '../../config/database.js';

export async function getStudents(req, res) {
  try {
    // Fetch all students with user details populated
    const students = await Student.find()
      .populate('userId', 'name email department') // Only get needed user fields
      .sort({ year: 1, section: 1 }); // Sort by year and section

    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
}

// Using named exports only