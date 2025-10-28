// API service for SchedEase frontend
const API_BASE_URL = 'http://localhost:3001/api';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  studentName?: string;
  courseName?: string;
  semester?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface Schedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleRequest {
  id: string;
  instructorId: string;
  instructorName: string;
  courseId: string;
  courseName: string;
  requestType: 'change' | 'cancel' | 'new';
  currentSchedule?: Schedule;
  requestedSchedule?: Schedule;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T | Partial<T>;
  courses?: T;
  rooms?: T;
  schedules?: T;
  instructors?: T;
  users?: T;
  user?: T;
  token?: string;
}

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

interface EmailTestConfig {
  emailServer: string;
  emailPort: number;
  adminEmail: string;
}
 

class ApiService {
  public baseUrl = API_BASE_URL;

  private async makeRequest<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const token = localStorage.getItem('authToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText || 'Request failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error (${path}):`, error);
      throw error;
    }
  }

  // --------------------
  // Auth endpoints
  // --------------------
  async login(email: string, password: string) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData: any) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me');
  }

  // --------------------
  // Courses endpoints
  // --------------------
  async getCourses() {
    return this.makeRequest('/courses');
  }

  async getCourseById(id: string) {
    return this.makeRequest(`/courses/${id}`);
  }

  async createCourse(courseData: any) {
    return this.makeRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  }

  async updateCourse(id: string, courseData: any) {
    return this.makeRequest(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
  }

  async deleteCourse(id: string) {
    return this.makeRequest(`/courses/${id}`, {
      method: 'DELETE'
    });
  }

  // --------------------
  // Rooms endpoints
  // --------------------
  async getRooms() {
    return this.makeRequest('/rooms');
  }

  async getRoomById(id: string) {
    return this.makeRequest(`/rooms/${id}`);
  }

  async getAvailableRooms(filters?: { type?: string; minCapacity?: number; equipment?: string[] }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.minCapacity) params.append('minCapacity', String(filters.minCapacity));
    if (filters?.equipment) filters.equipment.forEach(e => params.append('equipment', e));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/rooms/available${qs}`);
  }

  async createRoom(roomData: any) {
    return this.makeRequest('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData)
    });
  }

  async updateRoom(id: string, roomData: any) {
    return this.makeRequest(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData)
    });
  }

  async deleteRoom(id: string) {
    return this.makeRequest(`/rooms/${id}`, {
      method: 'DELETE'
    });
  }

  // --------------------
  // Analytics endpoints
  // --------------------
  async getAnalytics(dateRange?: string) {
    try {
      return await this.makeRequest<{ success: boolean; data: any }>(`/analytics${dateRange ? `?range=${dateRange}` : ''}`);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  }

  // --------------------
  // System Settings
  // --------------------
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await this.makeRequest<ApiResponse>('/settings');
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch system settings');
      }

      const fetchedData = response.data as unknown as Partial<SystemSettings>;

      // Ensure we have all required sections, with defaults if needed
      const settings: SystemSettings = {
        general: {
          institutionName: '',
          academicYear: '',
          defaultSemester: '',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
          ...(fetchedData?.general || {})
        },
        scheduling: {
          autoConflictDetection: true,
          allowOverlappingClasses: false,
          maxClassDuration: 180,
          minBreakBetweenClasses: 10,
          defaultClassDuration: 50,
          workingDaysStart: 'Monday',
          workingDaysEnd: 'Friday',
          workingHoursStart: '08:00',
          workingHoursEnd: '18:00',
          ...(fetchedData?.scheduling || {})
        },
        notifications: {
          emailNotifications: false,
          scheduleChangeNotifications: true,
          conflictAlerts: true,
          maintenanceNotifications: true,
          emailServer: '',
          emailPort: 587,
          adminEmail: '',
          ...(fetchedData?.notifications || {})
        },
        security: {
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireNumbers: true,
          passwordRequireSymbols: true,
          sessionTimeout: 60,
          maxLoginAttempts: 5,
          twoFactorAuth: false,
          ...(fetchedData?.security || {})
        },
        system: {
          backupFrequency: 'daily',
          logRetentionDays: 30,
          maintenanceMode: false,
          debugMode: false,
          apiRateLimit: 100,
          ...(fetchedData?.system || {})
        }
      };
      
      return settings;
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
      throw error;
    }
  }

  async updateSystemSettings(settings: SystemSettings): Promise<SystemSettings> {
    try {
      const response = await this.makeRequest<ApiResponse>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update system settings');
      }

      // Return the updated settings, either from response or the input settings
      return (response.data as unknown as SystemSettings) || settings;
    } catch (error) {
      console.error('Failed to update system settings:', error);
      throw error;
    }
  }

  async resetSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await this.makeRequest<ApiResponse>('/settings/reset', {
        method: 'POST'
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset system settings');
      }

      // Return the reset settings from response or throw
      if (!response.data) {
        throw new Error('No settings returned after reset');
      }
      return response.data as unknown as SystemSettings;
    } catch (error) {
      console.error('Failed to reset system settings:', error);
      throw error;
    }
  }

  async testDatabaseConnection() {
    try {
      return await this.makeRequest('/settings/test-db');
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }

  async testEmailConnection(config: EmailTestConfig) {
    try {
      return await this.makeRequest('/settings/test-email', {
        method: 'POST',
        body: JSON.stringify(config)
      });
    } catch (error) {
      console.error('Email connection test failed:', error);
      throw error;
    }
  }

  // --------------------
  // Instructors / Users
  // --------------------
  async getInstructors() {
    try {
      // Try dedicated instructors endpoint first
      const res = await this.makeRequest('/instructors');
      console.log('Instructors endpoint response:', res); // Debug log

      if (res?.success && (res.instructors || res.data)) {
        const instructorsData = (res.instructors || res.data || []) as any[];
        console.log('Raw instructors data:', instructorsData); // Debug log
        
        const normalizedInstructors = instructorsData.map((instructor: any) => {
          let name = '';
          if (instructor.userId?.name) name = instructor.userId.name;
          else if (instructor.user?.name) name = instructor.user.name;
          else if (instructor.name) name = instructor.name;
          else if (instructor.fullName) name = instructor.fullName;
          
          return {
            _id: instructor._id || instructor.id,
            name: name || 'Unknown Instructor',
            email: instructor.email || instructor.userId?.email || instructor.user?.email,
            department: instructor.department,
            userId: instructor.userId?._id || instructor.user?._id || instructor._id || instructor.id
          };
        });
        
        console.log('Normalized instructors:', normalizedInstructors); // Debug log
        return normalizedInstructors;
      }

      // Fallback to users with role=instructor
      console.log('Falling back to users endpoint'); // Debug log
      const userRes = await this.makeRequest('/users?role=instructor');
      console.log('Users endpoint response:', userRes); // Debug log

      if (userRes?.success && (userRes.users || userRes.data)) {
        const users = (userRes.users || userRes.data || []) as any[];
        const normalizedUsers = users.map((user: any) => ({
          _id: user._id || user.id,
          name: user.name || user.fullName || 'Unknown Instructor',
          email: user.email,
          department: user.department,
          userId: user._id || user.id
        }));
        
        console.log('Normalized users as instructors:', normalizedUsers); // Debug log
        return normalizedUsers;
      }

      console.log('No instructors found in either endpoint'); // Debug log
      return [];
    } catch (error) {
      console.error('Failed to fetch instructors:', error);
      return [];
    }
  }

  // --------------------
  // Users endpoints
  // --------------------
  async getUsers() {
    return this.makeRequest('/users');
  }

  async getUserById(id: string) {
    return this.makeRequest(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id: string, userData: any) {
    return this.makeRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // alias for existing code that used updateUsers (keeps compatibility)
  async updateUsers(id: string, userData: any) {
    return this.updateUser(id, userData);
  }

  async deleteUser(id: string) {
    return this.makeRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // --------------------
  // Enrollment endpoints
  // --------------------
  async getEnrollments() {
    return this.makeRequest<Enrollment[]>('/enrollments');
  }

  async processEnrollment(enrollmentId: string, action: 'approve' | 'reject', notes?: string) {
    return this.makeRequest<Enrollment>(`/enrollments/${enrollmentId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }

  // --------------------
  // Schedule Request endpoints
  // --------------------
  async getScheduleRequests() {
    return this.makeRequest<ScheduleRequest[]>('/schedule-requests');
  }

  async processScheduleRequest(requestId: string, action: 'approve' | 'reject', notes?: string) {
    return this.makeRequest<ScheduleRequest>(`/schedule-requests/${requestId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }

  // --------------------
  // Schedules endpoints
  // --------------------
  async getSchedules() {
    return this.makeRequest('/schedules');
  }

  async getScheduleById(id: string) {
    return this.makeRequest(`/schedules/${id}`);
  }

  async createSchedule(scheduleData: any) {
    return this.makeRequest('/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
  }

  async updateSchedule(id: string, scheduleData: any) {
    return this.makeRequest(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData)
    });
  }

  async deleteSchedule(id: string) {
    return this.makeRequest(`/schedules/${id}`, {
      method: 'DELETE'
    });
  }
}

export const apiService = new ApiService();
export default apiService;
