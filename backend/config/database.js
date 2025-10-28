import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB connection configuration
const dbConfig = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/schedease_db',
  options: {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  }
};

// Database connection
let isConnected = false;

export async function initializeDatabase() {
  try {
    if (isConnected) {
      console.log('Database already connected');
      return mongoose.connection;
    }

    // Connect to MongoDB
    await mongoose.connect(dbConfig.mongoUri, dbConfig.options);
    
    isConnected = true;
    console.log('MongoDB connected successfully');

    // Initialize collections and seed data
    await seedDatabase();
    
    return mongoose.connection;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'instructor', 'student'],
    required: true
  },
  department: {
    type: String,
    trim: true
  },
  // Student specific fields
  section: {
    type: String,
    trim: true,
    // Only required if role is student
    required: function() {
      return this.role === 'student';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Department Schema
const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Room Schema
const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['classroom', 'laboratory', 'computer_lab', 'auditorium'],
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  building: {
    type: String,
    required: true,
    trim: true
  },
  floor: {
    type: Number,
    required: true
  },
  equipment: [{
    type: String,
    trim: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Course Schema
const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    enum: ['lecture', 'lab', 'seminar'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 30 // Duration in minutes
  },
  studentsEnrolled: {
    type: Number,
    default: 0,
    min: 0
  },
  requiredCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  specialRequirements: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Instructor Schema
const instructorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxHoursPerWeek: {
    type: Number,
    default: 20,
    min: 1
  },
  specializations: [{
    type: String,
    trim: true
  }],
  availability: {
    type: Map,
    of: [{
      startTime: String,
      endTime: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Student Schema
const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  year: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4'],
    validate: {
      validator: function(v) {
        return ['1', '2', '3', '4'].includes(v);
      },
      message: props => `${props.value} is not a valid year!`
    }
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schedule Schema
const scheduleSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schedule Request Schema
const scheduleRequestSchema = new mongoose.Schema({
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  },
  requestType: {
    type: String,
    enum: ['room_change', 'time_change', 'schedule_conflict'],
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  details: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create Models
export const User = mongoose.model('User', userSchema);
export const Department = mongoose.model('Department', departmentSchema);
export const Room = mongoose.model('Room', roomSchema);
export const Course = mongoose.model('Course', courseSchema);
export const Instructor = mongoose.model('Instructor', instructorSchema);
export const Student = mongoose.model('Student', studentSchema);
export const Schedule = mongoose.model('Schedule', scheduleSchema);
export const ScheduleRequest = mongoose.model('ScheduleRequest', scheduleRequestSchema);

export async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@university.edu' });
    if (!existingAdmin) {
      // Create default admin user
      const adminUser = new User({
        name: 'Dr. Sarah Johnson',
        email: 'admin@university.edu',
        password: 'password', // Will be hashed by pre-save middleware
        role: 'admin',
        department: 'Administration'
      });
      await adminUser.save();
      console.log('Admin user created');
    }

    // Create default instructor user
    const existingInstructor = await User.findOne({ email: 'instructor@university.edu' });
    if (!existingInstructor) {
      const instructorUser = new User({
        name: 'Prof. Michael Chen',
        email: 'instructor@university.edu',
        password: 'password',
        role: 'instructor',
        department: 'Computer Science'
      });
      await instructorUser.save();
      console.log('Instructor user created');
    }

    // Create default student user
    const existingStudent = await User.findOne({ email: 'student@university.edu' });
    if (!existingStudent) {
      const studentUser = new User({
        name: 'Alex Smith',
        email: 'student@university.edu',
        password: 'password',
        role: 'student',
        department: 'Computer Science',
        section: 'A'
      });
      await studentUser.save();
      console.log('Student user created');
    }

    // Insert default departments
    const departments = [
      { code: 'CS', name: 'Computer Science' },
      { code: 'MATH', name: 'Mathematics' },
      { code: 'PHYS', name: 'Physics' },
      { code: 'ENG', name: 'Engineering' }
    ];

    for (const dept of departments) {
      const existingDept = await Department.findOne({ code: dept.code });
      if (!existingDept) {
        await Department.create(dept);
      }
    }
    console.log('Departments seeded');

    // Insert sample rooms
    const roomsCount = await Room.countDocuments();
    if (roomsCount === 0) {
      const rooms = [
        {
          name: 'Room A-101',
          type: 'classroom',
          capacity: 150,
          building: 'Academic Building A',
          floor: 1,
          equipment: ['projector', 'whiteboard', 'audio_system']
        },
        {
          name: 'Lab B-205',
          type: 'computer_lab',
          capacity: 35,
          building: 'Technology Building B',
          floor: 2,
          equipment: ['computers', 'projector', 'programming_software', 'network']
        },
        {
          name: 'Room C-301',
          type: 'classroom',
          capacity: 100,
          building: 'Science Building C',
          floor: 3,
          equipment: ['projector', 'whiteboard']
        },
        {
          name: 'Physics Lab D-101',
          type: 'laboratory',
          capacity: 30,
          building: 'Science Building D',
          floor: 1,
          equipment: ['lab_equipment', 'safety_equipment', 'fume_hoods']
        },
        {
          name: 'Main Auditorium',
          type: 'auditorium',
          capacity: 300,
          building: 'Main Building',
          floor: 1,
          equipment: ['projector', 'audio_system', 'microphone', 'lighting']
        }
      ];

      await Room.insertMany(rooms);
      console.log('Rooms seeded');
    }

    // Insert sample courses
    const coursesCount = await Course.countDocuments();
    if (coursesCount === 0) {
      const courses = [
        {
          code: 'CS101',
          name: 'Introduction to Computer Science',
          department: 'Computer Science',
          credits: 3,
          type: 'lecture',
          duration: 90,
          studentsEnrolled: 45,
          requiredCapacity: 50,
          specialRequirements: ['projector', 'computer']
        },
        {
          code: 'CS102',
          name: 'Programming Fundamentals Lab',
          department: 'Computer Science',
          credits: 1,
          type: 'lab',
          duration: 120,
          studentsEnrolled: 30,
          requiredCapacity: 35,
          specialRequirements: ['computers', 'programming_software']
        },
        {
          code: 'MATH201',
          name: 'Calculus II',
          department: 'Mathematics',
          credits: 4,
          type: 'lecture',
          duration: 75,
          studentsEnrolled: 60,
          requiredCapacity: 80,
          specialRequirements: ['whiteboard', 'projector']
        },
        {
          code: 'PHYS301',
          name: 'Advanced Physics Lab',
          department: 'Physics',
          credits: 2,
          type: 'lab',
          duration: 180,
          studentsEnrolled: 25,
          requiredCapacity: 30,
          specialRequirements: ['lab_equipment', 'safety_equipment']
        },
        {
          code: 'ENG201',
          name: 'Engineering Mechanics',
          department: 'Engineering',
          credits: 3,
          type: 'lecture',
          duration: 90,
          studentsEnrolled: 40,
          requiredCapacity: 60,
          specialRequirements: ['projector', 'whiteboard']
        }
      ];

      await Course.insertMany(courses);
      console.log('Courses seeded');
    }

    // Create instructor profiles for existing instructor users
    const instructorUsers = await User.find({ role: 'instructor' });
    for (const instructorUser of instructorUsers) {
      const existingInstructor = await Instructor.findOne({ userId: instructorUser._id });
      if (!existingInstructor) {
        const instructor = new Instructor({
          userId: instructorUser._id,
          maxHoursPerWeek: 20,
          specializations: ['Computer Science', 'Programming', 'Software Engineering'],
          availability: new Map([
            ['Monday', [{ startTime: '09:00', endTime: '17:00' }]],
            ['Tuesday', [{ startTime: '09:00', endTime: '17:00' }]],
            ['Wednesday', [{ startTime: '09:00', endTime: '17:00' }]],
            ['Thursday', [{ startTime: '09:00', endTime: '17:00' }]],
            ['Friday', [{ startTime: '09:00', endTime: '15:00' }]]
          ])
        });
        await instructor.save();
      }
    }

    // Create student profiles for existing student users
    const studentUsers = await User.find({ role: 'student' });
    for (const studentUser of studentUsers) {
      const existingStudent = await Student.findOne({ userId: studentUser._id });
      if (!existingStudent) {
        const courses = await Course.find().limit(3);
        const student = new Student({
          userId: studentUser._id,
          studentId: `STU${Date.now()}`,
          year: '2',
          section: studentUser.section,
          enrolledCourses: courses.map(c => c._id)
        });
        await student.save();
      }
    }

    // Insert sample schedules
    const schedulesCount = await Schedule.countDocuments();
    if (schedulesCount === 0) {
      const courses = await Course.find();
      const instructors = await Instructor.find();
      const rooms = await Room.find({ isAvailable: true });

      if (courses.length > 0 && instructors.length > 0 && rooms.length > 0) {
        const schedules = [
          {
            courseId: courses[0]._id, // CS101
            instructorId: instructors[0]._id,
            roomId: rooms[0]._id,
            dayOfWeek: 'Monday',
            startTime: '09:00',
            endTime: '10:30',
            semester: 'Fall 2024',
            academicYear: '2024-2025'
          },
          {
            courseId: courses[1]._id, // CS102 Lab
            instructorId: instructors[0]._id,
            roomId: rooms[1]._id,
            dayOfWeek: 'Tuesday',
            startTime: '14:00',
            endTime: '16:00',
            semester: 'Fall 2024',
            academicYear: '2024-2025'
          },
          {
            courseId: courses[2]._id, // MATH201
            instructorId: instructors[0]._id,
            roomId: rooms[2]._id,
            dayOfWeek: 'Wednesday',
            startTime: '11:00',
            endTime: '12:15',
            semester: 'Fall 2024',
            academicYear: '2024-2025'
          }
        ];

        await Schedule.insertMany(schedules);
        console.log('Schedules seeded');
      }
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

export function getConnection() {
  if (!isConnected) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return mongoose.connection;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (isConnected) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
});

export default {
  initializeDatabase,
  seedDatabase,
  getConnection,
  User,
  Department,
  Room,
  Course,
  Instructor,
  Student,
  Schedule,
  ScheduleRequest
};