import { Instructor, User } from '../config/database.js';

// Get all instructors with populated user data
export const getInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find()
      .populate('userId', 'name email department')
      .sort({ 'userId.name': 1 });

    const normalizedInstructors = instructors.map(instructor => {
      // Convert MongoDB Map to plain object for JSON serialization
      let availability = {};
      if (instructor.availability) {
        if (instructor.availability instanceof Map) {
          availability = Object.fromEntries(instructor.availability);
        } else {
          availability = instructor.availability;
        }
      }
      
      return {
        _id: instructor._id,
        id: instructor._id,
        name: instructor.userId?.name || 'Unknown Instructor',
        email: instructor.userId?.email || '',
        department: instructor.userId?.department || '',
        maxHoursPerWeek: instructor.maxHoursPerWeek || 20,
        specializations: instructor.specializations || [],
        availability: availability,
        userId: instructor.userId,
        status: 'active'
      };
    });

    res.json({ success: true, instructors: normalizedInstructors });
  } catch (error) {
    console.error('Get instructors error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch instructors' });
  }
}

// Get instructor by ID
export const getInstructorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const instructor = await Instructor.findById(id)
      .populate('userId', 'name email department');
    
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    const normalizedInstructor = {
      _id: instructor._id,
      id: instructor._id,
      name: instructor.userId?.name || 'Unknown Instructor',
      email: instructor.userId?.email || '',
      department: instructor.userId?.department || '',
      maxHoursPerWeek: instructor.maxHoursPerWeek || 20,
      specializations: instructor.specializations || [],
      availability: instructor.availability || {},
      userId: instructor.userId,
      status: 'active'
    };

    res.json({ success: true, instructor: normalizedInstructor });
  } catch (error) {
    console.error('Get instructor error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch instructor' });
  }
}