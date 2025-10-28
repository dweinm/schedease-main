const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Assuming auth middleware exists

// In a real application, settings would be stored in a database
// For this example, we'll use a simple in-memory object
let systemSettings = {
  general: {
    institutionName: 'University of Technology',
    academicYear: '2025-2026',
    defaultSemester: 'First Semester',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  },
  scheduling: {
    autoConflictDetection: true,
    allowOverlappingClasses: false,
    maxClassDuration: 240,
    minBreakBetweenClasses: 15,
    defaultClassDuration: 90,
    workingDaysStart: 'Monday',
    workingDaysEnd: 'Friday',
    workingHoursStart: '08:00',
    workingHoursEnd: '18:00'
  },
  notifications: {
    emailNotifications: true,
    scheduleChangeNotifications: true,
    conflictAlerts: true,
    maintenanceNotifications: false,
    emailServer: 'smtp.university.edu',
    emailPort: 587,
    adminEmail: 'admin@university.edu'
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    twoFactorAuth: false
  },
  system: {
    backupFrequency: 'daily',
    logRetentionDays: 30,
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: 1000
  }
};

// @route   GET /api/settings
// @desc    Get all system settings
// @access  Private (admin only)
router.get('/', auth, (req, res) => {
  // In a real app, you'd fetch from DB
  res.json(systemSettings);
});

// @route   GET /api/settings/academic-year
// @desc    Get current academic year
// @access  Private
router.get('/academic-year', auth, (req, res) => {
  res.json({
    success: true,
    academicYear: systemSettings.general.academicYear
  });
});

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private (admin only)
router.put('/', auth, (req, res) => {
  // In a real app, you'd update DB
  systemSettings = { ...systemSettings, ...req.body };
  res.json({ message: 'Settings updated successfully', settings: systemSettings });
});

// @route   GET /api/settings/test-db-connection
// @desc    Test database connection
// @access  Private (admin only)
router.get('/test-db-connection', auth, (req, res) => {
  // Simulate DB connection test
  const isConnected = Math.random() > 0.1; // 90% success rate
  if (isConnected) {
    res.json({ success: true, message: 'Database connected successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to connect to database' });
  }
});

// @route   POST /api/settings/test-email-connection
// @desc    Test email connection
// @access  Private (admin only)
router.post('/test-email-connection', auth, (req, res) => {
  const { emailServer, emailPort, adminEmail } = req.body;
  // Simulate email connection test
  const isConnected = Math.random() > 0.1; // 90% success rate
  if (isConnected) {
    res.json({ success: true, message: `Email server ${emailServer} connected successfully` });
  } else {
    res.status(500).json({ success: false, message: `Failed to connect to email server ${emailServer}` });
  }
});

module.exports = router;
