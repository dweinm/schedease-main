import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, seedDatabase } from './config/database.js';

// Import API routes
import { login, register, getCurrentUser, requireAuth, requireAdmin } from './api/auth.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from './api/courses.js';
import { getRooms, getRoomById, createRoom, updateRoom, deleteRoom, getAvailableRooms } from './api/rooms.js';
import { 
  getSchedules, 
  getInstructorSchedules, 
  getStudentSchedules, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule 
} from './api/schedules.js';
import instructorRoutes from './api/instructor.js';
import adminRoutes from './api/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());

// Request logging middleware
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Initialize database
async function startServer() {
  try {
    await initializeDatabase();
    
    // Only seed database if enabled in environment
    if (process.env.SEED_DATABASE === 'true') {
      await seedDatabase();
      console.log('Database seeded with sample data');
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }

  // Authentication routes
  app.post('/api/auth/login', login);
  app.post('/api/auth/register', requireAuth, requireAdmin, register);
  app.get('/api/auth/me', getCurrentUser);

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
  app.delete('/api/schedules/:id', requireAuth, requireAdmin, deleteSchedule);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'schedease API is running' });
  });

  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ 
      success: false, 
      message: 'Endpoint not found' 
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 schedease API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.MYSQL_DATABASE || 'schedease_db'} on ${process.env.MYSQL_HOST || 'localhost'}`);
    console.log(`🔗 CORS Origins: ${corsOrigins.join(', ')}`);
  });
}

startServer();

app.use('/api/instructor', instructorRoutes);
app.use('/api/admin', adminRoutes);