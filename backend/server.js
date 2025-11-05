import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';

// Import auth middleware
import { requireAuth, requireAdmin } from './utils/auth.js';

// Import API routes
// Individual route handlers
import { login, register, getCurrentUser } from './api/auth.js';
import { getInstructors, getInstructorById } from './api/instructors.js';
import { getCourses, getCourseById, getInstructorCourses, createCourse, updateCourse, deleteCourse } from './api/courses.js';
import { getAvailableRooms, getRoomById, getRooms, createRoom, updateRoom, deleteRoom } from './api/rooms.js';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from './api/users.js';
import { getScheduleRequests, getInstructorScheduleRequests, createScheduleRequest, updateScheduleRequestStatus, approveScheduleRequest, rejectScheduleRequest, deleteScheduleRequest } from './api/schedule-requests.js';
import { getStudents } from './api/admin/students.js';
import { getEnrollments, getStudentEnrollments, getMyEnrollments, getInstructorEnrollments, getScheduleEnrollments, createEnrollment, deleteEnrollment } from './api/enrollments.js';

// Router-style routes
import notificationsRouter from './api/notifications.js';
import schedulesRouter from './api/schedules.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Add notifications route
app.use('/api/notifications', notificationsRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SchedEase API Server'
  });
});

// Auth routes
app.post('/api/auth/login', login);
app.post('/api/auth/register', register); // Public registration
app.get('/api/auth/me', getCurrentUser);

// Instructor routes
app.get('/api/instructors', requireAuth, getInstructors);
app.get('/api/instructors/:id', requireAuth, getInstructorById);

// User routes
app.get('/api/users', requireAuth, requireAdmin, getUsers);
app.get('/api/users/:id', requireAuth, getUserById);
app.post('/api/users', requireAuth, requireAdmin, createUser);
app.put('/api/users/:id', requireAuth, requireAdmin, updateUser);
app.delete('/api/users/:id', requireAuth, requireAdmin, deleteUser);

// Course routes
app.get('/api/courses', requireAuth, getCourses);
app.get('/api/courses/:id', requireAuth, getCourseById);
app.get('/api/courses/instructor/:instructorId', requireAuth, getInstructorCourses);
app.post('/api/courses', requireAuth, requireAdmin, createCourse);
app.put('/api/courses/:id', requireAuth, requireAdmin, updateCourse);
app.delete('/api/courses/:id', requireAuth, requireAdmin, deleteCourse);

// Room routes
app.get('/api/rooms/available', requireAuth, getAvailableRooms);  // Put specific routes before wildcard routes
app.get('/api/rooms/:id', requireAuth, getRoomById);
app.get('/api/rooms', requireAuth, getRooms);
app.post('/api/rooms', requireAuth, requireAdmin, createRoom);
app.put('/api/rooms/:id', requireAuth, requireAdmin, updateRoom);
app.delete('/api/rooms/:id', requireAuth, requireAdmin, deleteRoom);

// Schedule routes
app.use('/api/schedules', schedulesRouter);

// Admin routes
app.get('/api/admin/students', requireAuth, requireAdmin, getStudents);

// Enrollment routes
app.get('/api/enrollments/me', requireAuth, getMyEnrollments);  // Most specific routes first
app.get('/api/enrollments/student/:studentId', requireAuth, getStudentEnrollments);
app.get('/api/enrollments/instructor/:instructorId', requireAuth, getInstructorEnrollments);
app.get('/api/enrollments/schedule/:scheduleId', requireAuth, getScheduleEnrollments);
app.get('/api/enrollments', requireAuth, requireAdmin, getEnrollments);
app.post('/api/enrollments', requireAuth, requireAdmin, createEnrollment);
app.delete('/api/enrollments/:id', requireAuth, requireAdmin, deleteEnrollment);

// Schedule Request routes
app.get('/api/schedule-requests', requireAuth, getScheduleRequests);
app.get('/api/schedule-requests/instructor/:instructorId', requireAuth, getInstructorScheduleRequests);
app.post('/api/schedule-requests', requireAuth, createScheduleRequest);
app.put('/api/schedule-requests/:requestId', requireAuth, requireAdmin, updateScheduleRequestStatus);
app.post('/api/schedule-requests/:requestId/approve', requireAuth, requireAdmin, approveScheduleRequest);
app.post('/api/schedule-requests/:requestId/reject', requireAuth, requireAdmin, rejectScheduleRequest);
app.delete('/api/schedule-requests/:requestId', requireAuth, deleteScheduleRequest);
// Schedule routes are now handled by the router

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting SchedEase API Server...');
    
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Database is automatically seeded during initialization
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🌟 SchedEase API Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📝 Available endpoints:');
        console.log('  POST /api/auth/login - User login');
        console.log('  GET  /api/auth/me - Get current user');
        console.log('  GET  /api/courses - Get all courses');
        console.log('  GET  /api/rooms - Get all rooms');
        console.log('  GET  /api/schedules - Get all schedules');
        console.log('\n🔐 Default login credentials:');
        console.log('  Admin: admin@university.edu / password');
        console.log('  Instructor: instructor@university.edu / password');
        console.log('  Student: student@university.edu / password');
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down SchedEase API Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down SchedEase API Server...');
  process.exit(0);
});

// Start the server
startServer();