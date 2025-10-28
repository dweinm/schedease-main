import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';

// Import API routes
import { login, register, getCurrentUser, requireAuth, requireAdmin } from './api/auth.js';
import { getInstructors, getInstructorById } from './api/instructors.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from './api/courses.js';
import { getRooms, getRoomById, getAvailableRooms, createRoom, updateRoom, deleteRoom } from './api/rooms.js';
import notificationsRouter from './api/notifications.js';
import { 
  getSchedules, 
  getInstructorSchedules, 
  getStudentSchedules, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule 
} from './api/schedules.js';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from './api/users.js';
import { 
  getScheduleRequests, 
  getInstructorScheduleRequests, 
  createScheduleRequest, 
  updateScheduleRequestStatus, 
  deleteScheduleRequest 
} from './api/schedule-requests.js';
import { getStudents } from './api/admin/students.js';

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
app.post('/api/courses', requireAuth, requireAdmin, createCourse);
app.put('/api/courses/:id', requireAuth, requireAdmin, updateCourse);
app.delete('/api/courses/:id', requireAuth, requireAdmin, deleteCourse);

// Room routes
app.get('/api/rooms', requireAuth, getRooms);
app.get('/api/rooms/:id', requireAuth, getRoomById);
app.get('/api/rooms/available', requireAuth, getAvailableRooms);
app.post('/api/rooms', requireAuth, requireAdmin, createRoom);
app.put('/api/rooms/:id', requireAuth, requireAdmin, updateRoom);
app.delete('/api/rooms/:id', requireAuth, requireAdmin, deleteRoom);

// Schedule routes
app.get('/api/schedules', requireAuth, getSchedules);
app.get('/api/schedules/instructor/:instructorId', requireAuth, getInstructorSchedules);
app.get('/api/schedules/student/:studentId', requireAuth, getStudentSchedules);
app.post('/api/schedules', requireAuth, requireAdmin, createSchedule);
app.put('/api/schedules/:id', requireAuth, requireAdmin, updateSchedule);

// Admin routes
app.get('/api/admin/students', requireAuth, requireAdmin, getStudents);

// Schedule Request routes
app.get('/api/schedule-requests', requireAuth, getScheduleRequests);
app.get('/api/schedule-requests/instructor/:instructorId', requireAuth, getInstructorScheduleRequests);
app.post('/api/schedule-requests', requireAuth, createScheduleRequest);
app.put('/api/schedule-requests/:requestId', requireAuth, requireAdmin, updateScheduleRequestStatus);
app.delete('/api/schedule-requests/:requestId', requireAuth, deleteScheduleRequest);
app.delete('/api/schedules/:id', requireAuth, requireAdmin, deleteSchedule);

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