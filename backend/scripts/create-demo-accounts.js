import { initializeDatabase } from '../config/database.js';
import { createUser } from '../utils/auth.js';
import chalk from 'chalk';

async function createDemoAccounts() {
  try {
    console.log(chalk.blue('🎯 Creating SchedEase demo accounts...\n'));
    
    // Initialize database connection
    await initializeDatabase();
    console.log(chalk.green('✓ Database connected\n'));
    
    // Demo accounts to create
    const demoAccounts = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'admin@university.edu',
        password: 'password',
        role: 'admin',
        department: 'Administration'
      },
      {
        name: 'Prof. Michael Chen',
        email: 'instructor@university.edu',
        password: 'password',
        role: 'instructor',
        department: 'Computer Science'
      },
      {
        name: 'Alex Smith',
        email: 'student@university.edu',
        password: 'password',
        role: 'student',
        department: 'Computer Science'
      },
      {
        name: 'Dr. Emily Rodriguez',
        email: 'instructor2@university.edu',
        password: 'password',
        role: 'instructor',
        department: 'Mathematics'
      },
      {
        name: 'Prof. David Kim',
        email: 'instructor3@university.edu',
        password: 'password',
        role: 'instructor',
        department: 'Physics'
      },
      {
        name: 'Maria Garcia',
        email: 'student2@university.edu',
        password: 'password',
        role: 'student',
        department: 'Mathematics'
      },
      {
        name: 'James Wilson',
        email: 'student3@university.edu',
        password: 'password',
        role: 'student',
        department: 'Physics'
      }
    ];

    console.log(chalk.yellow('Creating demo accounts:'));
    console.log(chalk.gray('─'.repeat(50)));

    let successCount = 0;
    let existingCount = 0;

    for (const account of demoAccounts) {
      try {
        const result = await createUser(account);
        if (result.success) {
          console.log(chalk.green(`✓ ${account.role.padEnd(10)} | ${account.email}`));
          successCount++;
        } else {
          console.log(chalk.yellow(`• ${account.role.padEnd(10)} | ${account.email} (already exists)`));
          existingCount++;
        }
      } catch (error) {
        console.log(chalk.red(`✗ ${account.role.padEnd(10)} | ${account.email} - ${error.message}`));
      }
    }

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.blue(`📊 Summary:`));
    console.log(chalk.green(`   Created: ${successCount} accounts`));
    console.log(chalk.yellow(`   Existing: ${existingCount} accounts`));
    console.log(chalk.blue(`   Total: ${successCount + existingCount} accounts available\n`));

    if (successCount > 0 || existingCount > 0) {
      console.log(chalk.green('🎉 Demo accounts are ready!\n'));
      
      console.log(chalk.blue('🔐 Login Credentials:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.red('👑 Admin Access:'));
      console.log(chalk.white('   Email: admin@university.edu'));
      console.log(chalk.white('   Password: password\n'));
      
      console.log(chalk.blue('👨‍🏫 Instructor Access:'));
      console.log(chalk.white('   Email: instructor@university.edu'));
      console.log(chalk.white('   Password: password\n'));
      
      console.log(chalk.green('👨‍🎓 Student Access:'));
      console.log(chalk.white('   Email: student@university.edu'));
      console.log(chalk.white('   Password: password\n'));
      
      console.log(chalk.gray('💡 Additional accounts:'));
      console.log(chalk.gray('   instructor2@university.edu / password'));
      console.log(chalk.gray('   instructor3@university.edu / password'));
      console.log(chalk.gray('   student2@university.edu / password'));
      console.log(chalk.gray('   student3@university.edu / password\n'));

      console.log(chalk.cyan('🚀 Start the servers:'));
      console.log(chalk.white('   Backend: npm run dev (port 3001)'));
      console.log(chalk.white('   Frontend: cd ../frontend && npm run dev (port 3000)\n'));
    }
    
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('❌ Failed to create demo accounts:'), error);
    process.exit(1);
  }
}

// Run the script
createDemoAccounts();