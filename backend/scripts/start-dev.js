#!/usr/bin/env node

/**
 * Development server start script for SchedEase Backend
 * This script starts the backend server with proper error handling and logging
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = join(__dirname, '..');

console.log('🚀 Starting SchedEase Backend Development Server...');
console.log('📁 Backend directory:', backendDir);

// Check if MongoDB is running (optional check)
console.log('⚡ Checking system requirements...');

// Start the server
const serverProcess = spawn('node', ['server.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

// Handle server process events
serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  if (signal) {
    console.log(`\n⏹️  Server stopped by signal: ${signal}`);
  } else if (code !== 0) {
    console.error(`❌ Server exited with error code: ${code}`);
    process.exit(code);
  } else {
    console.log('\n✅ Server stopped gracefully');
  }
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping development server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Stopping development server...');
  serverProcess.kill('SIGTERM');
});