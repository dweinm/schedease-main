#!/usr/bin/env node

/**
 * Development startup script for schedease
 * This script checks environment setup and starts the development server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function checkEnvFile() {
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  No .env file found!');
    
    if (fs.existsSync(envExamplePath)) {
      console.log('📋 Copying .env.example to .env...');
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created from .env.example');
      console.log('📝 Please update the database password and other settings in .env');
    } else {
      console.log('❌ No .env.example file found. Please create a .env file manually.');
      process.exit(1);
    }
  } else {
    console.log('✅ .env file found');
  }
}

function checkRequiredEnvVars() {
  const requiredVars = [
    'MYSQL_HOST',
    'MYSQL_USER', 
    'MYSQL_DATABASE',
    'JWT_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('⚠️  Missing required environment variables:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    console.log('📝 Please update your .env file');
    return false;
  }
  
  return true;
}

function displayStartupInfo() {
  console.log('\n🎓 schedease Development Server');
  console.log('================================');
  console.log(`📍 Server Port: ${process.env.PORT || 3001}`);
  console.log(`🗄️  Database: ${process.env.MYSQL_DATABASE || 'schedease_db'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '***' + process.env.JWT_SECRET.slice(-4) : 'NOT SET'}`);
  console.log(`🌱 Seed Database: ${process.env.SEED_DATABASE || 'true'}`);
  console.log(`🐛 Debug Mode: ${process.env.ENABLE_DEBUG || 'true'}`);
  console.log('================================\n');
}

async function main() {
  try {
    // Load environment variables
    await import('dotenv/config');
    
    console.log('🚀 Starting schedease Development Server...\n');
    
    // Check and setup .env file
    checkEnvFile();
    
    // Re-load env after potential creation
    const dotenv = await import('dotenv');
    dotenv.config();
    
    // Check required environment variables
    if (!checkRequiredEnvVars()) {
      process.exit(1);
    }
    
    // Display startup information
    displayStartupInfo();
    
    // Start the server
    console.log('🔄 Initializing server...');
    await import('../server.js');
    
  } catch (error) {
    console.error('❌ Failed to start development server:', error);
    process.exit(1);
  }
}

main();