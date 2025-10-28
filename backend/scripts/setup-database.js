import { initializeDatabase } from '../config/database.js';
import { createUser } from '../utils/auth.js';

async function setupDatabase() {
  try {
    console.log('Setting up SchedEase MongoDB database...');
    
    // Initialize database connection and seed with initial data
    await initializeDatabase();
    console.log('✓ Database connected and initialized');
    
    // Create additional default users if needed
    await createAdditionalUsers();
    console.log('✓ Additional users created if needed');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@university.edu / password');
    console.log('Instructor: instructor@university.edu / password');
    console.log('Student: student@university.edu / password');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function createAdditionalUsers() {
  const additionalUsers = [
    {
      name: 'Dr. Emily Rodriguez',
      email: 'instructor2@university.edu',
      password: 'password',
      role: 'instructor',
      department: 'Mathematics',
      maxHoursPerWeek: 18,
      specializations: ['Calculus', 'Linear Algebra', 'Statistics']
    },
    {
      name: 'Prof. David Kim',
      email: 'instructor3@university.edu',
      password: 'password',
      role: 'instructor',
      department: 'Physics',
      maxHoursPerWeek: 22,
      specializations: ['Quantum Physics', 'Mechanics', 'Thermodynamics']
    },
    {
      name: 'Maria Garcia',
      email: 'student2@university.edu',
      password: 'password',
      role: 'student',
      department: 'Mathematics',
      studentId: 'ST2024002',
      year: 3
    },
    {
      name: 'James Wilson',
      email: 'student3@university.edu',
      password: 'password',
      role: 'student',
      department: 'Physics',
      studentId: 'ST2024003',
      year: 1
    }
  ];

  for (const userData of additionalUsers) {
    try {
      const result = await createUser(userData);
      if (result.success) {
        console.log(`✓ Created ${userData.role}: ${userData.email}`);
      } else {
        console.log(`• ${userData.role} already exists or failed: ${userData.email}`);
      }
    } catch (error) {
      console.log(`• Failed to create ${userData.role}: ${userData.email} - ${error.message}`);
    }
  }
}

// Run the setup
setupDatabase();