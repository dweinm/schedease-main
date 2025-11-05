import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Instructor, Student } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-123456789';

export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(user) {
  // Allow TOKEN_EXPIRATION_HOURS to be either:
  // - a number (e.g. '24') which we treat as hours
  // - a timespan string supported by jsonwebtoken (e.g. '7d', '20h', '60s')
  const raw = process.env.TOKEN_EXPIRATION_HOURS || '24';

  // If the raw value contains any non-digit characters, assume it's
  // already a valid timespan string and pass it through. Otherwise,
  // treat it as hours and append 'h'. This prevents values like
  // '7d' from becoming '7dh'.
  const expiresIn = /\D/.test(String(raw)) ? String(raw) : `${raw}h`;

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(email, password) {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return { success: false, message: 'Invalid password' };
    }

    const token = generateToken(user);
    
    // Remove password from user object
    const userObject = user.toObject();
    delete userObject.password;

    return { 
      success: true, 
      user: userObject, 
      token 
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
}

export async function createUser(userData) {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return { success: false, message: 'Email already exists' };
    }

    // Create the user with role-specific fields
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password, // Will be hashed by pre-save middleware
      role: userData.role,
      department: userData.department,
      ...(userData.role === 'student' ? { section: userData.section } : {}) // Add section only for students
    });

    const savedUser = await user.save();

    // If it's an instructor, create instructor record
    if (userData.role === 'instructor') {
      const instructor = new Instructor({
        userId: savedUser._id,
        maxHoursPerWeek: userData.maxHoursPerWeek || 20,
        specializations: userData.specializations || [],
        availability: userData.availability || new Map()
      });
      await instructor.save();
    }

    // If it's a student, create student record
    if (userData.role === 'student') {
      const student = new Student({
        userId: savedUser._id,
        studentId: userData.studentId || `STU${Date.now()}`,
        department: savedUser.department,
        year: userData.year,
        section: userData.section,
        enrolledCourses: userData.enrolledCourses || []
      });
      await student.save();
    }

    // Auto-login after successful registration
    const token = generateToken(savedUser);
    const userObject = savedUser.toObject();
    delete userObject.password;

    return { 
      success: true, 
      message: 'User created successfully',
      user: userObject,
      token
    };
  } catch (error) {
    console.error('User creation error:', error);
    return { success: false, message: 'Failed to create user' };
  }
}

export async function getUserById(userId) {
  try {
    const user = await User.findById(userId).select('-password');
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export async function updateUserPassword(userId, newPassword) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    user.password = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, message: 'Failed to update password' };
  }
}

export async function deleteUser(userId) {
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Clean up related records
    if (user.role === 'instructor') {
      await Instructor.findOneAndDelete({ userId });
    } else if (user.role === 'student') {
      await Student.findOneAndDelete({ userId });
    }

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, message: 'Failed to delete user' };
  }
}

// Auth middleware
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Admin check middleware
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}