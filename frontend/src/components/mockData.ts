// Mock data for the scheduling system

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  type: 'lecture' | 'lab' | 'seminar';
  duration: number;
  studentsEnrolled: number;
  requiredCapacity: number;
  specialRequirements?: string[];
}

export interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'laboratory' | 'computer_lab' | 'auditorium';
  capacity: number;
  building: string;
  floor: number;
  equipment: string[];
  isAvailable: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  department: string;
  maxHoursPerWeek: number;
  specializations: string[];
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

export interface ScheduleEntry {
  id: string;
  courseId: string;
  instructorId: string;
  roomId: string;
  timeSlot: {
    day: string;
    startTime: string;
    endTime: string;
  };
  semester: string;
  academicYear: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: number;
  enrolledCourses: string[];
}

// Mock courses
export const mockCourses: Course[] = [
  {
    id: '1',
    code: 'CS101',
    name: 'Introduction to Computer Science',
    department: 'Computer Science',
    credits: 3,
    type: 'lecture',
    duration: 90,
    studentsEnrolled: 120,
    requiredCapacity: 120,
  },
  {
    id: '2',
    code: 'CS102',
    name: 'Programming Fundamentals Lab',
    department: 'Computer Science',
    credits: 1,
    type: 'lab',
    duration: 120,
    studentsEnrolled: 30,
    requiredCapacity: 30,
    specialRequirements: ['computers', 'programming_software']
  },
  {
    id: '3',
    code: 'MATH201',
    name: 'Calculus II',
    department: 'Mathematics',
    credits: 4,
    type: 'lecture',
    duration: 90,
    studentsEnrolled: 80,
    requiredCapacity: 80,
  },
  {
    id: '4',
    code: 'PHYS301',
    name: 'Physics Laboratory',
    department: 'Physics',
    credits: 2,
    type: 'lab',
    duration: 180,
    studentsEnrolled: 25,
    requiredCapacity: 25,
    specialRequirements: ['lab_equipment', 'safety_equipment']
  }
];

// Mock rooms
export const mockRooms: Room[] = [
  {
    id: '1',
    name: 'Room A-101',
    type: 'classroom',
    capacity: 150,
    building: 'Academic Building A',
    floor: 1,
    equipment: ['projector', 'whiteboard', 'audio_system'],
    isAvailable: true
  },
  {
    id: '2',
    name: 'Lab B-205',
    type: 'computer_lab',
    capacity: 35,
    building: 'Technology Building B',
    floor: 2,
    equipment: ['computers', 'projector', 'programming_software', 'network'],
    isAvailable: true
  },
  {
    id: '3',
    name: 'Room C-301',
    type: 'classroom',
    capacity: 100,
    building: 'Science Building C',
    floor: 3,
    equipment: ['projector', 'whiteboard'],
    isAvailable: true
  },
  {
    id: '4',
    name: 'Physics Lab D-101',
    type: 'laboratory',
    capacity: 30,
    building: 'Science Building D',
    floor: 1,
    equipment: ['lab_equipment', 'safety_equipment', 'fume_hoods'],
    isAvailable: true
  },
  {
    id: '5',
    name: 'Main Auditorium',
    type: 'auditorium',
    capacity: 300,
    building: 'Main Building',
    floor: 1,
    equipment: ['projector', 'audio_system', 'microphone', 'lighting'],
    isAvailable: true
  }
];

// Mock instructors
export const mockInstructors: Instructor[] = [
  {
    id: '1',
    name: 'Dr. Emily Rodriguez',
    email: 'e.rodriguez@university.edu',
    department: 'Computer Science',
    maxHoursPerWeek: 20,
    specializations: ['Programming', 'Software Engineering'],
    availability: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '15:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '15:00' }
    ]
  },
  {
    id: '2',
    name: 'Prof. David Wilson',
    email: 'd.wilson@university.edu',
    department: 'Mathematics',
    maxHoursPerWeek: 18,
    specializations: ['Calculus', 'Linear Algebra'],
    availability: [
      { day: 'Monday', startTime: '08:00', endTime: '16:00' },
      { day: 'Tuesday', startTime: '08:00', endTime: '16:00' },
      { day: 'Wednesday', startTime: '08:00', endTime: '16:00' },
      { day: 'Thursday', startTime: '08:00', endTime: '16:00' },
      { day: 'Friday', startTime: '08:00', endTime: '14:00' }
    ]
  },
  {
    id: '3',
    name: 'Dr. Lisa Chang',
    email: 'l.chang@university.edu',
    department: 'Physics',
    maxHoursPerWeek: 16,
    specializations: ['Experimental Physics', 'Laboratory Methods'],
    availability: [
      { day: 'Tuesday', startTime: '10:00', endTime: '18:00' },
      { day: 'Wednesday', startTime: '10:00', endTime: '18:00' },
      { day: 'Thursday', startTime: '10:00', endTime: '18:00' },
      { day: 'Friday', startTime: '10:00', endTime: '16:00' }
    ]
  }
];

// Mock schedule entries
export const mockSchedule: ScheduleEntry[] = [
  {
    id: '1',
    courseId: '1',
    instructorId: '1',
    roomId: '1',
    timeSlot: { day: 'Monday', startTime: '09:00', endTime: '10:30' },
    semester: 'Fall',
    academicYear: '2024-2025'
  },
  {
    id: '2',
    courseId: '2',
    instructorId: '1',
    roomId: '2',
    timeSlot: { day: 'Tuesday', startTime: '14:00', endTime: '16:00' },
    semester: 'Fall',
    academicYear: '2024-2025'
  },
  {
    id: '3',
    courseId: '3',
    instructorId: '2',
    roomId: '3',
    timeSlot: { day: 'Wednesday', startTime: '10:00', endTime: '11:30' },
    semester: 'Fall',
    academicYear: '2024-2025'
  },
  {
    id: '4',
    courseId: '4',
    instructorId: '3',
    roomId: '4',
    timeSlot: { day: 'Thursday', startTime: '14:00', endTime: '17:00' },
    semester: 'Fall',
    academicYear: '2024-2025'
  }
];

// Mock students
export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Alex Smith',
    email: 'alex.smith@student.university.edu',
    studentId: 'ST2024001',
    department: 'Computer Science',
    year: 2,
    enrolledCourses: ['1', '2', '3']
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria.garcia@student.university.edu',
    studentId: 'ST2024002',
    department: 'Computer Science',
    year: 1,
    enrolledCourses: ['1', '2']
  },
  {
    id: '3',
    name: 'James Brown',
    email: 'james.brown@student.university.edu',
    studentId: 'ST2024003',
    department: 'Physics',
    year: 3,
    enrolledCourses: ['3', '4']
  }
];