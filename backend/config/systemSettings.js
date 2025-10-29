import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  scheduling: {
    autoConflictDetection: { type: Boolean, default: true },
    allowOverlappingClasses: { type: Boolean, default: false },
    maxClassDuration: { type: Number, default: 240 },
    minBreakBetweenClasses: { type: Number, default: 15 },
    defaultClassDuration: { type: Number, default: 90 },
    workingDaysStart: { type: String, default: 'Monday' },
    workingDaysEnd: { type: String, default: 'Friday' },
    workingHoursStart: { type: String, default: '08:00' },
    workingHoursEnd: { type: String, default: '18:00' }
  }
}, { timestamps: true });

export const SystemSettings = mongoose.model('SystemSettings', SystemSettingsSchema);

// Initialize default settings if none exist
export async function initializeSystemSettings() {
  try {
    const settings = await SystemSettings.findOne();
    if (!settings) {
      await SystemSettings.create({});
    }
  } catch (error) {
    console.error('Error initializing system settings:', error);
  }
}

// Get current settings
export async function getSystemSettings() {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    return settings;
  } catch (error) {
    console.error('Error getting system settings:', error);
    throw error;
  }
}