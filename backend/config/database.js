import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB connection configuration
const dbConfig = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/schedease_db',
  options: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    w: 'majority'
  }
};

// Database connection
let isConnected = false;

export async function initializeDatabase() {
  try {
    if (isConnected) {
      console.log('📊 Database already connected');
      return mongoose.connection;
    }

    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await mongoose.connect(dbConfig.mongoUri, dbConfig.options);
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(`⚠️ Connection attempt failed. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
      }
    }
    
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    
    // Test the connection
    await mongoose.connection.db.admin().ping();
    console.log('🔵 Database ping successful');

    // Initialize collections and seed data
    await seedDatabase();
    console.log('🌱 Database seeded successfully');
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('💡 Possible reasons:');
      console.error('   1. MongoDB service is not running');
      console.error('   2. Connection string is incorrect');
      console.error('   3. Network connectivity issues');
      console.error('   4. Firewall blocking the connection');
    }
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
  // Optional reference to an Instructor profile
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor'
  },
  // Denormalized instructor name for quick display on frontend
  instructorName: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to denormalize instructorName from Instructor -> User
courseSchema.pre('save', async function(next) {
  try {
    // If an instructorId is set, populate the instructor's user name
    if (this.instructorId) {
      // Use the Instructor model to look up the linked User's name
      const InstructorModel = mongoose.model('Instructor');
      const instr = await InstructorModel.findById(this.instructorId).populate('userId');
      if (instr && instr.userId && instr.userId.name) {
        this.instructorName = instr.userId.name;
      }
    } else {
      this.instructorName = undefined;
    }
    next();
  } catch (err) {
    next(err);
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
  department: {
    type: String,
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

// Student enrollments and schedule data moved to their respective schema sections

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
  // Room for which the request is made (room booking)
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  // Specific date for the request (YYYY-MM-DD)
  date: {
    type: String
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  purpose: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  // Flag set when a conflict with an approved request is detected
  conflict_flag: {
    type: Boolean,
    default: false
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
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
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
    enum: ['First Term', 'Second Term', 'Third Term']
  },
  year: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'conflict', 'canceled'],
    default: 'published'
  },
  conflicts: [{
    type: String
  }],
  // Denormalized fields for easier querying
  courseCode: String,
  courseName: String,
  instructorName: String,
  roomName: String,
  building: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt timestamp
scheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Enrollment Schema - links students to courses/schedules/instructors
const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
  yearLevel: { type: String, enum: ['1','2','3','4'] },
  section: { type: String },
  department: { type: String },
  // Denormalized fields for quick access
  studentName: { type: String },
  courseName: { type: String },
  courseCode: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save middleware to populate denormalized fields
enrollmentSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('studentId') || this.isModified('courseId')) {
      // Populate student name
      const student = await mongoose.model('Student').findById(this.studentId).populate('userId');
      if (student && student.userId) {
        this.studentName = student.userId.name;
        // Store department from Student or User for quick filtering
        this.department = student.department || student.userId.department || this.department;
      }

      // Populate course details
      const course = await mongoose.model('Course').findById(this.courseId);
      if (course) {
        this.courseName = course.name;
        this.courseCode = course.code;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

//Create Models
export const User = mongoose.model('User', userSchema);
export const Department = mongoose.model('Department', departmentSchema);
export const Room = mongoose.model('Room', roomSchema);
export const Course = mongoose.model('Course', courseSchema);
export const Schedule = mongoose.model('Schedule', scheduleSchema);
export const Instructor = mongoose.model('Instructor', instructorSchema);
export const Student = mongoose.model('Student', studentSchema);
export const ScheduleRequest = mongoose.model('ScheduleRequest', scheduleRequestSchema);
export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

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
          department: studentUser.department,
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
            semester: 'First Term',
            year: 2024,
            academicYear: '2024-2025'
          },
          {
            courseId: courses[1]._id, // CS102 Lab
            instructorId: instructors[0]._id,
            roomId: rooms[1]._id,
            dayOfWeek: 'Tuesday',
            startTime: '14:00',
            endTime: '16:00',
            semester: 'First Term',
            year: 2024,
            academicYear: '2024-2025'
          },
          {
            courseId: courses[2]._id, // MATH201
            instructorId: instructors[0]._id,
            roomId: rooms[2]._id,
            dayOfWeek: 'Wednesday',
            startTime: '11:00',
            endTime: '12:15',
            semester: 'First Term',
            year: 2024,
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
  ScheduleRequest,
  Enrollment
};