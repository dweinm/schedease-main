// Common enrollment-related interfaces
export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  instructorId?: string;
  instructorName?: string;
  scheduleId?: string;
  yearLevel: string;
  section: string;
  department: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  semester: string;
  academicYear: string;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface EnrolledStudent {
  id: string;
  studentId: string;
  studentName: string;
  yearLevel: string;
  section: string;
  department: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  scheduleId: string;
  instructorName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  semester: string;
  academicYear: string;
}

export interface ScheduleSummary {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  instructorName: string;
  roomName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  semester: string;
  academicYear: string;
  enrolledCount: number;
}

export interface EnrollmentFilters {
  yearLevel: string;
  section: string;
  department: string;
  search: string;
  semester: string;
}

export interface EnrollmentPayload {
  scheduleId: string;
  courseId: string;
  instructorId: string;
  students: string[];
}

export interface EnrollmentResponse {
  success: boolean;
  message?: string;
  created?: Enrollment[];
  conflicts?: Array<{
    studentId: string;
    reason: string;
  }>;
}

export interface ScheduleRequest {
  id: string;
  instructorId: string;
  instructorName: string;
  courseId: string;
  courseName: string;
  requestType: 'change' | 'cancel' | 'new';
  status: 'pending' | 'approved' | 'rejected';
  currentSchedule?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  requestedSchedule?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleRequestCreate {
  instructorId: string;
  courseId: string;
  requestType: 'change' | 'cancel' | 'new';
  currentSchedule?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  requestedSchedule?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  reason: string;
}