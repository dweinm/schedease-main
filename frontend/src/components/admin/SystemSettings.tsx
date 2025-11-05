import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import apiService from '../services/api';

interface SystemSettings {
  general: {
    institutionName: string;
    academicYear: string;
    defaultSemester: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
  };
  scheduling: {
    autoConflictDetection: boolean;
    allowOverlappingClasses: boolean;
    maxClassDuration: number;
    minBreakBetweenClasses: number;
    defaultClassDuration: number;
    workingDaysStart: string;
    workingDaysEnd: string;
    workingHoursStart: string;
    workingHoursEnd: string;
  };
  notifications: {
    emailNotifications: boolean;
    scheduleChangeNotifications: boolean;
    conflictAlerts: boolean;
    maintenanceNotifications: boolean;
    emailServer: string;
    emailPort: number;
    adminEmail: string;
  };
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorAuth: boolean;
  };
  system: {
    backupFrequency: string;
    logRetentionDays: number;
    maintenanceMode: boolean;
    debugMode: boolean;
    apiRateLimit: number;
  };
}

const initialSettings: SystemSettings = {
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

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [dbStatus, setDbStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [emailStatus, setEmailStatus] = useState<'unknown' | 'active' | 'inactive'>('unknown');

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // apiService.getSystemSettings returns the settings object (or throws)
      const fetchedSettings = await apiService.getSystemSettings();
      
      // Merge with initial settings to ensure all required fields exist
      const mergedSettings = {
        general: { ...initialSettings.general, ...(fetchedSettings.general || {}) },
        scheduling: { ...initialSettings.scheduling, ...(fetchedSettings.scheduling || {}) },
        notifications: { ...initialSettings.notifications, ...(fetchedSettings.notifications || {}) },
        security: { ...initialSettings.security, ...(fetchedSettings.security || {}) },
        system: { ...initialSettings.system, ...(fetchedSettings.system || {}) }
      };
      
  setSettings(mergedSettings);
  setHasChanges(false);

      // Also test connections on load
      await Promise.all([
        testConnection('database'),
        testConnection('email')
      ]).catch(console.error); // Don't let connection tests block settings load
      
      toast.success('Settings loaded successfully');
    } catch (error) {
      console.error('Failed to load system settings:', error);
      toast.error('Failed to load system settings, using defaults');
      // Set default settings on error
      setSettings(initialSettings);
    }
  };

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // apiService.updateSystemSettings returns the saved settings (or throws)
      const saved = await apiService.updateSystemSettings(settings);
      if (saved) {
        setSettings(prev => ({
          general: { ...prev.general, ...(saved.general || {}) },
          scheduling: { ...prev.scheduling, ...(saved.scheduling || {}) },
          notifications: { ...prev.notifications, ...(saved.notifications || {}) },
          security: { ...prev.security, ...(saved.security || {}) },
          system: { ...prev.system, ...(saved.system || {}) }
        }));
      }

      toast.success('Settings saved successfully');
      setHasChanges(false);
      
      // Re-test connections after save
      await Promise.all([
        testConnection('database'),
        testConnection('email')
      ]).catch(console.error);

    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      try {
        setSaving(true);
        // Use the dedicated reset endpoint
        const resetSettings = await apiService.resetSystemSettings();
        
        // Update local state with the reset settings
        setSettings(resetSettings);
        setHasChanges(false);
        toast.success('Settings reset to defaults successfully');
        
        // Re-test connections after reset
        await Promise.all([testConnection('database'), testConnection('email')]).catch(console.error);
      } catch (error) {
        console.error('Failed to reset settings:', error);
        // Fallback to local reset if API fails
        setSettings(initialSettings);
        setHasChanges(true);
        toast.error('Failed to reset settings remotely — defaults applied locally. Click Save to persist.');
      } finally {
        setSaving(false);
      }
    }
  };

  const testConnection = async (type: 'database' | 'email') => {
    if (type === 'database') {
      try {
        await apiService.testDatabaseConnection();
        setDbStatus('online');
        toast.success('Database connection test successful');
      } catch (error) {
        setDbStatus('offline');
        console.error('Database connection test failed:', error);
        toast.error('Database connection test failed');
      }
    } else {
      try {
        const emailConfig = {
          emailServer: settings.notifications.emailServer,
          emailPort: settings.notifications.emailPort,
          adminEmail: settings.notifications.adminEmail,
        };
        await apiService.testEmailConnection(emailConfig);
        setEmailStatus('active');
        toast.success('Email connection test successful');
      } catch (error) {
        setEmailStatus('inactive');
        console.error('Email connection test failed:', error);
        toast.error('Email connection test failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                variant={hasChanges && !saving ? 'success' : undefined}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution Name</Label>
                    <Input
                      id="institution"
                      value={settings.general.institutionName}
                      onChange={(e) => updateSetting('general', 'institutionName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input
                      id="academicYear"
                      value={settings.general.academicYear}
                      onChange={(e) => updateSetting('general', 'academicYear', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultSemester">Default Semester</Label>
                    <Select value={settings.general.defaultSemester} onValueChange={(value) => updateSetting('general', 'defaultSemester', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Semester">First Semester</SelectItem>
                        <SelectItem value="Second Semester">Second Semester</SelectItem>
                        <SelectItem value="Third Semester">Third Semester</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.general.timezone} onValueChange={(value) => updateSetting('general', 'timezone', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select value={settings.general.dateFormat} onValueChange={(value) => updateSetting('general', 'dateFormat', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Time Format</Label>
                    <Select value={settings.general.timeFormat} onValueChange={(value) => updateSetting('general', 'timeFormat', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Scheduling Settings */}
            <TabsContent value="scheduling" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Conflict Detection</Label>
                      <p className="text-sm text-muted-foreground">Automatically detect scheduling conflicts</p>
                    </div>
                    <Switch
                      checked={settings.scheduling.autoConflictDetection}
                      onCheckedChange={(checked) => updateSetting('scheduling', 'autoConflictDetection', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Overlapping Classes</Label>
                      <p className="text-sm text-muted-foreground">Permit classes to overlap in time</p>
                    </div>
                    <Switch
                      checked={settings.scheduling.allowOverlappingClasses}
                      onCheckedChange={(checked) => updateSetting('scheduling', 'allowOverlappingClasses', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDuration">Max Class Duration (minutes)</Label>
                    <Input
                      id="maxDuration"
                      type="number"
                      value={settings.scheduling.maxClassDuration}
                      onChange={(e) => updateSetting('scheduling', 'maxClassDuration', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minBreak">Min Break Between Classes (minutes)</Label>
                    <Input
                      id="minBreak"
                      type="number"
                      value={settings.scheduling.minBreakBetweenClasses}
                      onChange={(e) => updateSetting('scheduling', 'minBreakBetweenClasses', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultDuration">Default Class Duration (minutes)</Label>
                    <Input
                      id="defaultDuration"
                      type="number"
                      value={settings.scheduling.defaultClassDuration}
                      onChange={(e) => updateSetting('scheduling', 'defaultClassDuration', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Working Days</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={settings.scheduling.workingDaysStart} onValueChange={(value) => updateSetting('scheduling', 'workingDaysStart', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={settings.scheduling.workingDaysEnd} onValueChange={(value) => updateSetting('scheduling', 'workingDaysEnd', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Working Hours</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        value={settings.scheduling.workingHoursStart}
                        onChange={(e) => updateSetting('scheduling', 'workingHoursStart', e.target.value)}
                      />
                      <Input
                        type="time"
                        value={settings.scheduling.workingHoursEnd}
                        onChange={(e) => updateSetting('scheduling', 'workingHoursEnd', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Enable email notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Schedule Change Notifications</Label>
                      <p className="text-sm text-muted-foreground">Notify users of schedule changes</p>
                    </div>
                    <Switch
                      checked={settings.notifications.scheduleChangeNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications', 'scheduleChangeNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Conflict Alerts</Label>
                      <p className="text-sm text-muted-foreground">Alert users of scheduling conflicts</p>
                    </div>
                    <Switch
                      checked={settings.notifications.conflictAlerts}
                      onCheckedChange={(checked) => updateSetting('notifications', 'conflictAlerts', checked)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailServer">Email Server</Label>
                    <div className="flex gap-2">
                      <Input
                        id="emailServer"
                        value={settings.notifications.emailServer}
                        onChange={(e) => updateSetting('notifications', 'emailServer', e.target.value)}
                      />
                      <Button
                        variant={emailStatus === 'active' ? 'success' : emailStatus === 'inactive' ? 'destructive' : 'outline'}
                        onClick={() => testConnection('email')}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailPort">Email Port</Label>
                    <Input
                      id="emailPort"
                      type="number"
                      value={settings.notifications.emailPort}
                      onChange={(e) => updateSetting('notifications', 'emailPort', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={settings.notifications.adminEmail}
                      onChange={(e) => updateSetting('notifications', 'adminEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordLength">Minimum Password Length</Label>
                    <Input
                      id="passwordLength"
                      type="number"
                      min="6"
                      max="20"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Uppercase Letters</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain uppercase letters</p>
                    </div>
                    <Switch
                      checked={settings.security.passwordRequireUppercase}
                      onCheckedChange={(checked) => updateSetting('security', 'passwordRequireUppercase', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Numbers</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain numbers</p>
                    </div>
                    <Switch
                      checked={settings.security.passwordRequireNumbers}
                      onCheckedChange={(checked) => updateSetting('security', 'passwordRequireNumbers', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Symbols</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                    </div>
                    <Switch
                      checked={settings.security.passwordRequireSymbols}
                      onCheckedChange={(checked) => updateSetting('security', 'passwordRequireSymbols', checked)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="1"
                      max="72"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min="3"
                      max="10"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Enable 2FA for all users</p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) => updateSetting('security', 'twoFactorAuth', checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="backupFreq">Backup Frequency</Label>
                    <Select value={settings.system.backupFrequency} onValueChange={(value) => updateSetting('system', 'backupFrequency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logRetention">Log Retention (days)</Label>
                    <Input
                      id="logRetention"
                      type="number"
                      min="7"
                      max="365"
                      value={settings.system.logRetentionDays}
                      onChange={(e) => updateSetting('system', 'logRetentionDays', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rateLimit">API Rate Limit (requests/hour)</Label>
                    <Input
                      id="rateLimit"
                      type="number"
                      min="100"
                      max="10000"
                      value={settings.system.apiRateLimit}
                      onChange={(e) => updateSetting('system', 'apiRateLimit', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable maintenance mode</p>
                    </div>
                    <Switch
                      checked={settings.system.maintenanceMode}
                      onCheckedChange={(checked) => updateSetting('system', 'maintenanceMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Debug Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable debug logging</p>
                    </div>
                    <Switch
                      checked={settings.system.debugMode}
                      onCheckedChange={(checked) => updateSetting('system', 'debugMode', checked)}
                    />
                  </div>
                  
                  {/* System Status */}
                  <div className="space-y-3 pt-4">
                    <Label>System Status</Label>
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between p-2 rounded ${dbStatus === 'online' ? 'bg-green-50' : dbStatus === 'offline' ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          {dbStatus === 'online' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {dbStatus === 'offline' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                          {dbStatus === 'unknown' && <Info className="h-4 w-4 text-gray-600" />}
                          <span className="text-sm">Database Connection</span>
                        </div>
                        <Badge className={`${dbStatus === 'online' ? 'bg-green-100 text-green-800' : dbStatus === 'offline' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {dbStatus === 'online' ? 'Online' : dbStatus === 'offline' ? 'Offline' : 'Unknown'}
                        </Badge>
                      </div>
                      <div className={`flex items-center justify-between p-2 rounded ${emailStatus === 'active' ? 'bg-green-50' : emailStatus === 'inactive' ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          {emailStatus === 'active' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {emailStatus === 'inactive' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                          {emailStatus === 'unknown' && <Info className="h-4 w-4 text-gray-600" />}
                          <span className="text-sm">Email Service</span>
                        </div>
                        <Badge className={`${emailStatus === 'active' ? 'bg-green-100 text-green-800' : emailStatus === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {emailStatus === 'active' ? 'Active' : emailStatus === 'inactive' ? 'Inactive' : 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">Backup Service</span>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Changes Banner */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-3">
          <Info className="h-5 w-5" />
          <span>You have unsaved changes</span>
          <Button
            size="sm"
            variant={hasChanges && !saving ? 'success' : 'secondary'}
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save Now'}
          </Button>
        </div>
      )}
    </div>
  );
}
