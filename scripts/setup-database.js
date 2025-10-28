import { initializeDatabase, seedDatabase } from '../config/database.js';
import { createUser, hashPassword } from '../utils/auth.js';

async function setupDatabase() {
  try {
    console.log('Setting up schedease database...');
    
    // Initialize database and create tables
    await initializeDatabase();
    console.log('✓ Database and tables created');
    
    // Seed with initial data
    await seedDatabase();
    console.log('✓ Basic data seeded');
    
    // Create default users
    await createDefaultUsers();
    console.log('✓ Default users created');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@university.edu / admin123');
    console.log('Instructor: instructor@university.edu / instructor123');
    console.log('Student: student@university.edu / student123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function createDefaultUsers() {
  const defaultUsers = [
    {
      name: 'Dr. Sarah Johnson',
      email: 'admin@university.edu',
      password: 'admin123',
      role: 'admin',
      department: 'Administration'
    },
    {
      name: 'Prof. Michael Chen',
      email: 'instructor@university.edu',
      password: 'instructor123',
      role: 'instructor',
      department: 'Computer Science',
      maxHoursPerWeek: 20,
      specializations: ['Programming', 'Software Engineering'],
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '15:00' },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', startTime: '09:00', endTime: '15:00' }
      ]
    },
    {
      name: 'Alex Smith',
      email: 'student@university.edu',
      password: 'student123',
      role: 'student',
      department: 'Computer Science',
      studentId: 'ST2024001',
      year: 2,
      enrolledCourses: []
    }
  ];

  for (const userData of defaultUsers) {
    try {
      await createUser(userData);
      console.log(`✓ Created ${userData.role}: ${userData.email}`);
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log(`• ${userData.role} already exists: ${userData.email}`);
      } else {
        console.error(`Failed to create ${userData.role}:`, error);
      }
    }
  }
}

// Run the setup
setupDatabase();