const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  role?: string;
  userId?: string;
  createdAt: string;
  read: boolean;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...options.headers,
    } as HeadersInit;

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(response.status, data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error');
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{
      success: boolean;
      user: any;
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success) {
      this.setToken(response.token);
    }

    return response;
  }

  async getCurrentUser() {
    return this.request<{ success: boolean; user: any }>('/auth/me');
  }

  async register(userData: any) {
    return this.request<{ success: boolean; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  logout() {
    this.setToken(null);
  }

    // Admin methods
  async getAdminStudents() {
    return this.request<{ success: boolean; students: any[] }>('/admin/students');
  }

  // --------------------
  // Course methods
  // --------------------
  async getCourses() {
    return this.request<{ success: boolean; courses: any[] }>('/courses');
  }

  async getCourse(id: string) {
    return this.request<{ success: boolean; course: any }>(`/courses/${id}`);
  }

  async createCourse(courseData: any) {
    return this.request<{ success: boolean; message: string; courseId: string }>('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(id: string, courseData: any) {
    return this.request<{ success: boolean; message: string }>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id: string) {
    return this.request<{ success: boolean; message: string }>(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Room methods
  async getRooms() {
    return this.request<{ success: boolean; rooms: any[] }>('/rooms');
  }

  async getRoom(id: string) {
    return this.request<{ success: boolean; room: any }>(`/rooms/${id}`);
  }

  async getAvailableRooms(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ success: boolean; rooms: any[] }>(`/rooms/available${queryString}`);
  }

  async createRoom(roomData: any) {
    return this.request<{ success: boolean; message: string; roomId: string }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(id: string, roomData: any) {
    return this.request<{ success: boolean; message: string }>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteRoom(id: string) {
    return this.request<{ success: boolean; message: string }>(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // Schedule methods
  async getSchedules() {
    return this.request<{ success: boolean; schedules: any[] }>('/schedules');
  }

  async getInstructorSchedules(instructorId: string) {
    return this.request<{ success: boolean; schedules: any[] }>(`/schedules/instructor/${instructorId}`);
  }

  async getStudentSchedules(studentId: string) {
    return this.request<{ success: boolean; schedules: any[] }>(`/schedules/student/${studentId}`);
  }

  async createSchedule(scheduleData: any) {
    return this.request<{ success: boolean; message: string; scheduleId: string }>('/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateSchedule(id: string, scheduleData: any) {
    return this.request<{ success: boolean; message: string }>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
  }

  async deleteSchedule(id: string) {
    return this.request<{ success: boolean; message: string }>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // Enrollment methods
  async getEnrollments() {
    return this.request<{ success: boolean; enrollments: any[] }>('/enrollments');
  }

  async getMyEnrollments() {
    return this.request<{ success: boolean; enrollments: any[] }>('/enrollments/me');
  }

  async getInstructorEnrollments(instructorId: string) {
    return this.request<{ success: boolean; enrollments: any[] }>(`/enrollments/instructor/${instructorId}`);
  }

  async createEnrollment(enrollmentData: any) {
    return this.request<{ success: boolean; message?: string; created?: any[] }>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(enrollmentData)
    });
  }

  async deleteEnrollment(id: string) {
    return this.request<{ success: boolean; message?: string }>(`/enrollments/${id}`, {
      method: 'DELETE'
    });
  }

  // Notification methods
  async getNotifications() {
    return this.request<Notification[]>('/notifications');
  }

  async createNotification(data: {
    title: string;
    message: string;
    role?: string;
    userId?: string;
  }) {
    return this.request<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markNotificationAsRead(id: string) {
    return this.request<Notification>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<void>('/notifications/mark-all-read', {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export { ApiError };