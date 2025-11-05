import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../../../../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'abcdefghijkl';

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
  const expiresIn = /\D/.test(String(raw)) ? String(raw) : `${raw}h`;

  return jwt.sign(
    {
      id: user.id,
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
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = rows[0];
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return { success: false, message: 'Invalid password' };
    }

    const token = generateToken(user);
    
    // Remove password from user object
    delete user.password;

    return { 
      success: true, 
      user, 
      token 
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
}

export async function createUser(userData) {
  try {
    const pool = getPool();
    const hashedPassword = await hashPassword(userData.password);

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, role, department) 
       VALUES (?, ?, ?, ?, ?)`,
      [userData.name, userData.email, hashedPassword, userData.role, userData.department]
    );

    // If it's an instructor, create instructor record
    if (userData.role === 'instructor') {
      await pool.execute(
        `INSERT INTO instructors (id, user_id, max_hours_per_week, specializations, availability) 
         VALUES (UUID(), ?, ?, ?, ?)`,
        [
          result.insertId,
          userData.maxHoursPerWeek || 20,
          JSON.stringify(userData.specializations || []),
          JSON.stringify(userData.availability || [])
        ]
      );
    }

    // If it's a student, create student record
    if (userData.role === 'student') {
      await pool.execute(
        `INSERT INTO students (user_id, student_id, year, enrolled_courses) 
         VALUES (?, ?, ?, ?)`,
        [
          result.insertId,
          userData.studentId,
          userData.year || 1,
          JSON.stringify(userData.enrolledCourses || [])
        ]
      );
    }

    return { success: true, message: 'User created successfully' };
  } catch (error) {
    console.error('User creation error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, message: 'Email already exists' };
    }
    return { success: false, message: 'Failed to create user' };
  }
}

export async function getUserById(userId) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, department FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}