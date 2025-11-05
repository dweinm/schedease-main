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

export interface Schedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleRequest {
  id: string;
  instructorId: string;
  instructorName?: string;
  courseId: string;
  courseName?: string;
  requestType: 'change' | 'cancel' | 'new';
  currentSchedule?: Schedule;
  requestedSchedule?: Schedule;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// api response wrapper is not required in this lightweight client; responses are typed per-call

class ApiService {
  public baseUrl = API_BASE_URL;

  private async makeRequest(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;

    // Default headers
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    // Attach auth token if available (common keys)
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

    // Merge defaultHeaders with any provided headers and add to options
    options.headers = {
      ...defaultHeaders,
      ...(options.headers || {})
    };

    // Only set JSON content-type when we have a body
    if (options.body) defaultHeaders['Content-Type'] = 'application/json';

    options.headers = { ...(options.headers as Record<string, string> || {}), ...defaultHeaders };

    const res = await fetch(url, options);
    // First try to get the response text
      const text = await res.text();

      // Debug log (won't show sensitive data)
      console.debug('[API]', (options.method || 'GET').toUpperCase(), url, 'status:', res.status);
      console.debug('Response text:', text);

      // Try to parse JSON response
      let json;
      try {
        json = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        // If response is not OK and we couldn't parse JSON, throw error with status text
        if (!res.ok) {
          throw new Error(`${res.statusText || 'Request failed'} (${res.status})`);
        }
        return text;
      }

      // If we have JSON but response is not OK, format a proper error
      if (!res.ok) {
        const errorMessage = json.message || res.statusText || 'Request failed';
        const error: any = new Error(errorMessage);
        error.response = json;
        error.status = res.status;
        console.error('API Error:', {
          status: res.status,
          message: errorMessage,
          response: json
        });
        throw error;
      }

      return json;
  }

  // convenience wrapper for GET with query params (not used presently)

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
  // Enrollment endpoints
  // --------------------
  async getEnrollments() {
    return this.makeRequest('/enrollments');
  }

  async getInstructorEnrollments(instructorId: string) {
    return this.makeRequest(`/enrollments/instructor/${instructorId}`);
  }

  async getScheduleEnrollments(scheduleId: string) {
    return this.makeRequest(`/enrollments/schedule/${scheduleId}`);
  }

  async processEnrollment(enrollmentId: string, action: 'approve' | 'reject', notes?: string) {
    return this.makeRequest(`/enrollments/${enrollmentId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }

  // --------------------
  // Schedule Request endpoints
  // --------------------
  async createScheduleRequest(data: any) {
    return this.makeRequest('/schedule-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getScheduleRequests() {
    return this.makeRequest('/schedule-requests');
  }

  async getInstructorScheduleRequests(instructorId: string) {
    return this.makeRequest(`/schedule-requests/instructor/${instructorId}`);
  }

  async processScheduleRequest(requestId: string, action: 'approve' | 'reject', notes?: string) {
    return this.makeRequest(`/schedule-requests/${requestId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }

  // --------------------
  // Courses endpoints
  // --------------------
  async getCourses() {
    return this.makeRequest('/courses');
  }

  async getInstructorCourses(instructorId: string) {
    return this.makeRequest(`/courses/instructor/${instructorId}`);
  }

  async getCourseById(id: string) {
    return this.makeRequest(`/courses/${id}`);
  }

  async createCourse(courseData: any) {
    try {
      console.log('Creating course with data:', courseData);
      const response = await this.makeRequest('/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
      });
      console.log('Create course response:', response);
      return response;
    } catch (error) {
      console.error('Create course error:', error);
      throw error;
    }
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
  // Instructors / Users
  // --------------------
  async getInstructors() {
    // try dedicated endpoint, fallback to users?role=instructor if the first fails
    try {
      const res = await this.makeRequest('/instructors');
      return res;
    } catch (err) {
      console.warn('/instructors endpoint failed, falling back to /users?role=instructor', err);
      try {
        return await this.makeRequest('/users?role=instructor');
      } catch (err2) {
        console.error('Fallback instructors fetch failed', err2);
        return [];
      }
    }
  }

  // --------------------
  // Users endpoints
  // --------------------
  async getUsers() {
    try {
      return await this.makeRequest('/users');
    } catch (err) {
      console.warn('getUsers failed', err);
      return [];
    }
  }

  // Admin students endpoint
  async getAdminStudents() {
    return this.makeRequest('/admin/students');
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
  // Schedules endpoints
  // --------------------
  async getSchedules() {
    return this.makeRequest('/schedules');
  }

  async getScheduleById(id: string) {
    return this.makeRequest(`/schedules/${id}`);
  }

  async getInstructorSchedules(instructorId: string) {
    return this.makeRequest(`/schedules/instructor/${instructorId}`);
  }

  async createSchedule(scheduleData: any) {
    try {
      console.log('Creating schedule with data:', scheduleData); // Debug log
      
      const response = await this.makeRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData)
      });

      console.log('Create schedule response:', response); // Debug log

      // Response is already parsed by makeRequest
      if (!response.success) {
        // If there are conflicts, return them for UI handling
        if (response.conflicts) {
          return {
            success: false,
            message: response.message || 'Schedule conflicts detected',
            conflicts: response.conflicts
          };
        }
        // Other error cases
        return {
          success: false,
          message: response.message || 'Failed to create schedule'
        };
      }

      // Success case
      return {
        success: true,
        message: 'Schedule created successfully',
        schedule: response.schedule
      };
    } catch (error: any) {
      console.error('Create schedule error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create schedule'
      };
    }
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

  // --------------------
  // Auto-generate schedules
  // --------------------
  async autoGenerateSchedules(params: {
    semester: string;
    year: number;
    start_date: string; // MM/DD/YYYY
    end_date: string;   // MM/DD/YYYY
    max_hours_per_day: number;
    avoid_conflicts: boolean;
  }) {
    return this.makeRequest('/schedules/auto-generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // --------------------
  // System Settings endpoints
  // --------------------
  async getSystemSettings() {
    return this.makeRequest('/settings');
  }

  async updateSystemSettings(settingsData: any) {
    return this.makeRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  }

  async testDatabaseConnection() {
    return this.makeRequest('/settings/test-db-connection');
  }

  async testEmailConnection(emailConfig: { emailServer: string; emailPort: number; adminEmail: string }) {
    return this.makeRequest('/settings/test-email-connection', {
      method: 'POST',
      body: JSON.stringify(emailConfig)
    });
  }

  async resetSystemSettings() {
    return this.makeRequest('/settings/reset', {
      method: 'POST'
    });
  }
}

export const apiService = new ApiService();
export default apiService;
