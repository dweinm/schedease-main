// API utility functions for frontend

// For frontend builds, use the REACT_APP_ prefix to make env vars available
const API_BASE_URL = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' 
      ? 'http://localhost:3001/api' 
      : '/api') // Use relative path in production
  : 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    
    if (data.success && data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Course methods
  async getCourses() {
    return await this.request('/courses');
  }

  async getCourseById(id) {
    return await this.request(`/courses/${id}`);
  }

  async createCourse(courseData) {
    return await this.request('/courses', {
      method: 'POST',
      body: courseData,
    });
  }

  async updateCourse(id, courseData) {
    return await this.request(`/courses/${id}`, {
      method: 'PUT',
      body: courseData,
    });
  }

  async deleteCourse(id) {
    return await this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Room methods
  async getRooms() {
    return await this.request('/rooms');
  }

  async getRoomById(id) {
    return await this.request(`/rooms/${id}`);
  }

  async getAvailableRooms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/rooms/available?${query}`);
  }

  async createRoom(roomData) {
    return await this.request('/rooms', {
      method: 'POST',
      body: roomData,
    });
  }

  async updateRoom(id, roomData) {
    return await this.request(`/rooms/${id}`, {
      method: 'PUT',
      body: roomData,
    });
  }

  async deleteRoom(id) {
    return await this.request(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // Schedule methods
  async getSchedules() {
    return await this.request('/schedules');
  }

  async getInstructorSchedules(instructorId) {
    return await this.request(`/schedules/instructor/${instructorId}`);
  }

  async getStudentSchedules(studentId) {
    return await this.request(`/schedules/student/${studentId}`);
  }

  async createSchedule(scheduleData) {
    return await this.request('/schedules', {
      method: 'POST',
      body: scheduleData,
    });
  }

  async updateSchedule(id, scheduleData) {
    return await this.request(`/schedules/${id}`, {
      method: 'PUT',
      body: scheduleData,
    });
  }

  async deleteSchedule(id) {
    return await this.request(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;