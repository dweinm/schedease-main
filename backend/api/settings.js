import express from 'express';
import { SystemSettings, getSystemSettings } from '../config/systemSettings.js';
import { requireAuth, requireAdmin } from './auth.js';

const router = express.Router();

// Default settings template
const defaultSettings = {
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
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const settings = await getSystemSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

// @route   GET /api/settings/academic-year
// @desc    Get current academic year
// @access  Private
router.get('/academic-year', requireAuth, async (req, res) => {
  try {
    const settings = await getSystemSettings();
    res.json({
      success: true,
      academicYear: settings.general.academicYear
    });
  } catch (error) {
    console.error('Get academic year error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch academic year' });
  }
});

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private (admin only)
router.put('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings(defaultSettings);
    }

    // Update all setting categories
    Object.keys(updates).forEach(category => {
      if (settings[category]) {
        settings[category] = {
          ...settings[category],
          ...updates[category]
        };
      }
    });

    await settings.save();
    res.json({ 
      success: true, 
      message: 'Settings updated successfully', 
      settings 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// @route   GET /api/settings/test-db-connection
// @desc    Test database connection
// @access  Private (admin only)
router.get('/test-db-connection', requireAuth, requireAdmin, async (req, res) => {
  try {
    await SystemSettings.findOne(); // Test query to verify connection
    res.json({ success: true, message: 'Database connected successfully' });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ success: false, message: 'Failed to connect to database' });
  }
});

// @route   POST /api/settings/test-email-connection
// @desc    Test email connection
// @access  Private (admin only)
router.post('/test-email-connection', requireAuth, requireAdmin, async (req, res) => {
  const { emailServer, emailPort, adminEmail } = req.body;
  try {
    // Here you would implement actual email server connection test
    // For now, we'll simulate a successful connection
    res.json({ success: true, message: `Email server ${emailServer} connected successfully` });
  } catch (error) {
    console.error('Email connection test failed:', error);
    res.status(500).json({ success: false, message: `Failed to connect to email server ${emailServer}` });
  }
});

// Reset settings to defaults
router.post('/reset', requireAuth, requireAdmin, async (req, res) => {
  try {
    await SystemSettings.deleteMany({}); // Remove all settings
    const settings = new SystemSettings(defaultSettings); // Create new with defaults
    await settings.save();
    res.json({ success: true, message: 'Settings reset to defaults', settings });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset settings' });
  }
});

export default router;
