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
    const defaultHeaders: Record<string, string> = {};
    // Attach auth token if available (common keys)
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

    // Only set JSON content-type when we have a body
    if (options.body) defaultHeaders['Content-Type'] = 'application/json';

    options.headers = { ...(options.headers as Record<string, string> || {}), ...defaultHeaders };

    const res = await fetch(url, options);
    const text = await res.text().catch(() => '');

    // debug: lightweight log (won't show token)
    console.debug('[API]', (options.method || 'GET').toUpperCase(), url, 'status:', res.status);

    // Try parse JSON; surface server error payloads
    if (text) {
      try {
        const json = JSON.parse(text);
        if (!res.ok) {
          const err: any = new Error(json.message || res.statusText || 'Request failed');
          err.response = json;
          err.status = res.status;
          throw err;
        }
        return json;
      } catch {
        if (!res.ok) {
          const err: any = new Error(res.statusText || 'Request failed');
          err.status = res.status;
          err.body = text;
          throw err;
        }
        return text;
      }
    } else {
      if (!res.ok) {
        const err: any = new Error(res.statusText || 'Request failed');
        err.status = res.status;
        throw err;
      }
      return {};
    }
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

  async processEnrollment(enrollmentId: string, action: 'approve' | 'reject', notes?: string) {
    return this.makeRequest(`/enrollments/${enrollmentId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }

  // --------------------
  // Schedule Request endpoints
  // --------------------
  async getScheduleRequests() {
    return this.makeRequest('/schedule-requests');
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
