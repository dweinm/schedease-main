export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  status: 'pending' | 'approved' | 'rejected';
  semester: string;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentRequest {
  studentId: string;
  courseId: string;
  semester: string;
  academicYear: string;
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