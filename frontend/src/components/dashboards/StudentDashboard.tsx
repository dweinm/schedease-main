import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  GraduationCap,
  User,
  Settings,
  Clock,
  MapPin,
  TrendingUp,
  Award,
  Bell,
  Download,
  Search,
  Eye,
  CalendarDays,
  BookOpenCheck,
  Target,
  Star,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Mail,
  Phone,
  Edit
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';

interface Schedule {
  _id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  roomName: string;
  building: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Course {
  _id: string;
  code: string;
  name: string;
  instructor: string;
  credits: number;
  type: string;
  description?: string;
  syllabus?: string;
  currentGrade?: string;
  attendance?: number;
}

interface Grade {
  _id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  assignments: {
    name: string;
    type: 'assignment' | 'quiz' | 'exam' | 'project';
    score: number;
    maxScore: number;
    weight: number;
    date: string;
  }[];
  currentGrade: number;
  letterGrade: string;
}

interface Announcement {
  _id: string;
  courseId: string;
  courseCode: string;
  title: string;
  content: string;
  instructor: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    emergencyContact: '',
    address: ''
  });

  const sidebarItems = [
    {
      icon: LayoutDashboard,
      label: 'Overview',
      onClick: () => setActiveTab('overview'),
      active: activeTab === 'overview'
    },
    {
      icon: Calendar,
      label: 'My Schedule',
      onClick: () => setActiveTab('schedule'),
      active: activeTab === 'schedule'
    },
    {
      icon: BookOpen,
      label: 'My Courses',
      onClick: () => setActiveTab('courses'),
      active: activeTab === 'courses'
    },
    {
      icon: GraduationCap,
      label: 'Grades',
      onClick: () => setActiveTab('grades'),
      active: activeTab === 'grades'
    },
    {
      icon: Bell,
      label: 'Announcements',
      onClick: () => setActiveTab('announcements'),
      active: activeTab === 'announcements'
    },
    {
      icon: User,
      label: 'Profile',
      onClick: () => setActiveTab('profile'),
      active: activeTab === 'profile'
    }
  ];

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      // Try fetching real enrollments and build courses/schedules from them
      try {
        const res = await (await import('../../lib/api')).apiClient.getMyEnrollments();
        if (res?.enrollments && Array.isArray(res.enrollments) && res.enrollments.length > 0) {
          const enrollments = res.enrollments;
          // Build courses and schedules arrays from enrollments
          const coursesFromEnroll = enrollments.map((e: any) => ({
            _id: e.courseId?._id || e.courseId,
            code: e.courseId?.code || e.courseCode || '',
            name: e.courseId?.name || e.courseName || '',
            instructor: e.instructorId?.userId?.name || e.instructorId?.name || e.instructorName || '',
            credits: e.courseId?.credits || 3,
            type: e.courseId?.type || 'lecture',
            description: e.courseId?.description || ''
          }));

          const schedulesFromEnroll: Schedule[] = enrollments.map((e: any) => ({
            _id: e.scheduleId?._id || e._id,
            courseId: e.courseId?._id || e.courseId,
            courseName: e.courseId?.name || e.courseName || '',
            courseCode: e.courseId?.code || e.courseCode || '',
            instructor: e.instructorId?.userId?.name || e.instructorId?.name || e.instructorName || '',
            roomName: e.scheduleId?.roomName || e.roomName || '',
            building: e.scheduleId?.building || e.building || '',
            dayOfWeek: e.scheduleId?.dayOfWeek || e.dayOfWeek || '',
            startTime: e.scheduleId?.startTime || e.startTime || '',
            endTime: e.scheduleId?.endTime || e.endTime || ''
          }));

          setCourses(coursesFromEnroll);
          setSchedules(schedulesFromEnroll);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to load enrollments, falling back to mock data', err);
      }

      // Mock data - fallback when API is unavailable
      const mockSchedules: Schedule[] = [
        {
          _id: '1',
          courseId: 'cs101',
          courseName: 'Introduction to Computer Science',
          courseCode: 'CS101',
          instructor: 'Prof. Michael Chen',
          roomName: 'Room A-101',
          building: 'Academic Building A',
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '10:30'
        },
        {
          _id: '2',
          courseId: 'cs101',
          courseName: 'Introduction to Computer Science',
          courseCode: 'CS101',
          instructor: 'Prof. Michael Chen',
          roomName: 'Room A-101',
          building: 'Academic Building A',
          dayOfWeek: 'Wednesday',
          startTime: '09:00',
          endTime: '10:30'
        },
        {
          _id: '3',
          courseId: 'cs102',
          courseName: 'Programming Fundamentals Lab',
          courseCode: 'CS102',
          instructor: 'Prof. Michael Chen',
          roomName: 'Lab B-205',
          building: 'Technology Building B',
          dayOfWeek: 'Tuesday',
          startTime: '14:00',
          endTime: '16:00'
        },
        {
          _id: '4',
          courseId: 'math201',
          courseName: 'Calculus II',
          courseCode: 'MATH201',
          instructor: 'Dr. Emily Rodriguez',
          roomName: 'Room C-301',
          building: 'Science Building C',
          dayOfWeek: 'Tuesday',
          startTime: '10:00',
          endTime: '11:30'
        },
        {
          _id: '5',
          courseId: 'math201',
          courseName: 'Calculus II',
          courseCode: 'MATH201',
          instructor: 'Dr. Emily Rodriguez',
          roomName: 'Room C-301',
          building: 'Science Building C',
          dayOfWeek: 'Thursday',
          startTime: '10:00',
          endTime: '11:30'
        }
      ];

      const mockCourses: Course[] = [
        {
          _id: 'cs101',
          code: 'CS101',
          name: 'Introduction to Computer Science',
          instructor: 'Prof. Michael Chen',
          credits: 3,
          type: 'lecture',
          description: 'Fundamental concepts of computer science including programming basics, algorithms, and data structures.',
          currentGrade: 'A-',
          attendance: 95
        },
        {
          _id: 'cs102',
          code: 'CS102',
          name: 'Programming Fundamentals Lab',
          instructor: 'Prof. Michael Chen',
          credits: 1,
          type: 'lab',
          description: 'Hands-on programming experience to complement CS101 theory.',
          currentGrade: 'A',
          attendance: 92
        },
        {
          _id: 'math201',
          code: 'MATH201',
          name: 'Calculus II',
          instructor: 'Dr. Emily Rodriguez',
          credits: 4,
          type: 'lecture',
          description: 'Advanced calculus concepts including integration techniques and series.',
          currentGrade: 'B+',
          attendance: 88
        }
      ];

      const mockGrades: Grade[] = [
        {
          _id: '1',
          courseId: 'cs101',
          courseCode: 'CS101',
          courseName: 'Introduction to Computer Science',
          assignments: [
            { name: 'Assignment 1', type: 'assignment', score: 95, maxScore: 100, weight: 0.15, date: '2024-09-15' },
            { name: 'Quiz 1', type: 'quiz', score: 88, maxScore: 100, weight: 0.10, date: '2024-09-22' },
            { name: 'Midterm Exam', type: 'exam', score: 92, maxScore: 100, weight: 0.25, date: '2024-10-15' },
            { name: 'Assignment 2', type: 'assignment', score: 90, maxScore: 100, weight: 0.15, date: '2024-10-30' }
          ],
          currentGrade: 91.2,
          letterGrade: 'A-'
        },
        {
          _id: '2',
          courseId: 'cs102',
          courseCode: 'CS102',
          courseName: 'Programming Fundamentals Lab',
          assignments: [
            { name: 'Lab 1', type: 'assignment', score: 98, maxScore: 100, weight: 0.20, date: '2024-09-20' },
            { name: 'Lab 2', type: 'assignment', score: 95, maxScore: 100, weight: 0.20, date: '2024-10-05' },
            { name: 'Project 1', type: 'project', score: 93, maxScore: 100, weight: 0.30, date: '2024-10-25' }
          ],
          currentGrade: 94.8,
          letterGrade: 'A'
        },
        {
          _id: '3',
          courseId: 'math201',
          courseCode: 'MATH201',
          courseName: 'Calculus II',
          assignments: [
            { name: 'Homework 1', type: 'assignment', score: 85, maxScore: 100, weight: 0.10, date: '2024-09-18' },
            { name: 'Quiz 1', type: 'quiz', score: 82, maxScore: 100, weight: 0.15, date: '2024-09-25' },
            { name: 'Midterm', type: 'exam', score: 87, maxScore: 100, weight: 0.30, date: '2024-10-20' }
          ],
          currentGrade: 85.1,
          letterGrade: 'B+'
        }
      ];

      const mockAnnouncements: Announcement[] = [
        {
          _id: '1',
          courseId: 'cs101',
          courseCode: 'CS101',
          title: 'Assignment 3 Due Date Extended',
          content: 'Due to the midterm week, Assignment 3 deadline has been extended to Friday, November 15th at 11:59 PM.',
          instructor: 'Prof. Michael Chen',
          date: '2024-12-01T10:00:00Z',
          priority: 'medium'
        },
        {
          _id: '2',
          courseId: 'math201',
          courseCode: 'MATH201',
          title: 'Midterm Results Available',
          content: 'Midterm exam results are now available in your grade portal. Please review and contact me during office hours if you have any questions.',
          instructor: 'Dr. Emily Rodriguez',
          date: '2024-11-30T14:30:00Z',
          priority: 'high'
        },
        {
          _id: '3',
          courseId: 'cs102',
          courseCode: 'CS102',
          title: 'Lab Session Moved',
          content: 'This week\'s lab session on Thursday will be moved to Friday 2-4 PM in the same room.',
          instructor: 'Prof. Michael Chen',
          date: '2024-11-29T08:15:00Z',
          priority: 'high'
        }
      ];

      setSchedules(mockSchedules);
      setCourses(mockCourses);
      setGrades(mockGrades);
      setAnnouncements(mockAnnouncements);
    } catch (error) {
      console.error('Failed to load student data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Student Dashboard';
      case 'schedule': return 'My Schedule';
      case 'courses': return 'My Courses';
      case 'grades': return 'My Grades';
      case 'announcements': return 'Announcements';
      case 'profile': return 'My Profile';
      default: return 'Student Dashboard';
    }
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return schedules.filter(schedule => schedule.dayOfWeek === today);
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    const totalPoints = grades.reduce((acc, grade) => {
      const course = courses.find(c => c._id === grade.courseId);
      const credits = course?.credits || 1;
      return acc + (getGradePoints(grade.letterGrade) * credits);
    }, 0);
    const totalCredits = grades.reduce((acc, grade) => {
      const course = courses.find(c => c._id === grade.courseId);
      return acc + (course?.credits || 1);
    }, 0);
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const getGradePoints = (letterGrade: string): number => {
    const gradeMap: { [key: string]: number } = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    return gradeMap[letterGrade] || 0;
  };

  const getGradeColor = (letterGrade: string) => {
    if (['A+', 'A', 'A-'].includes(letterGrade)) return 'bg-green-100 text-green-800';
    if (['B+', 'B', 'B-'].includes(letterGrade)) return 'bg-blue-100 text-blue-800';
    if (['C+', 'C', 'C-'].includes(letterGrade)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const openCourseDialog = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseDialog(true);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In real app, this would be an API call
      toast.success('Profile updated successfully');
      setShowProfileDialog(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const OverviewContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    const todaySchedule = getTodaySchedule();
    const totalCredits = courses.reduce((acc, course) => acc + course.credits, 0);
    const currentGPA = calculateGPA();
    const recentAnnouncements = announcements.slice(0, 3);

    const displayName = (() => {
      const src = user || (() => {
        try {
          const raw = localStorage.getItem('currentUser');
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      })();
      if (!src) return 'Student';
      const nameFields = [src.name, src.fullName, src.displayName, src.firstName ? `${src.firstName} ${src.lastName || ''}` : undefined];
      for (const f of nameFields) {
        if (f && typeof f === 'string' && f.trim()) return f.trim();
      }
      const email = src.email;
      if (email && typeof email === 'string') {
        const local = email.split('@')[0];
        const parts = local.split(/[._\-]/).filter(Boolean);
        const human = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        if (human) return human;
      }
      return 'Student';
    })();

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}!</h2>
                <p className="text-gray-600 mt-1">Here's your academic overview</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Semester</p>
                <p className="text-lg font-semibold">Fall 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground">This semester</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCredits}</div>
              <p className="text-xs text-muted-foreground">Credit hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentGPA.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Out of 4.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Class</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaySchedule.length > 0 ? '1h' : 'None'}
              </div>
              <p className="text-xs text-muted-foreground">
                {todaySchedule.length > 0 ? `${todaySchedule[0].courseCode} today` : 'No classes today'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Today's Classes
            </CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map((schedule) => (
                  <div key={schedule._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{schedule.courseCode} - {schedule.courseName}</p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.instructor} • {schedule.roomName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="default">
                        {new Date().getHours() >= parseInt(schedule.startTime.split(':')[0]) ? 'In Progress' : 'Upcoming'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{schedule.building}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No classes scheduled for today</p>
                <p className="text-sm">Enjoy your day off!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access & Announcements */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('schedule')}>
                <Calendar className="h-4 w-4 mr-2" />
                View Full Schedule
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('grades')}>
                <GraduationCap className="h-4 w-4 mr-2" />
                Check Grades
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('courses')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Course Materials
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAnnouncements.length > 0 ? (
                <div className="space-y-3">
                  {recentAnnouncements.map((announcement) => (
                    <div key={announcement._id} className={`p-3 border rounded-lg ${getPriorityColor(announcement.priority)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{announcement.courseCode}</p>
                        <Badge variant="outline" className="text-xs">
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{announcement.title}</p>
                      <p className="text-xs mt-1">{new Date(announcement.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                  <Button variant="link" className="w-full" onClick={() => setActiveTab('announcements')}>
                    View all announcements
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No recent announcements</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const ScheduleContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>Your complete class schedule for this semester</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
              const daySchedules = schedules.filter(s => s.dayOfWeek === day);
              return (
                <div key={day} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">{day}</h3>
                  {daySchedules.length > 0 ? (
                    <div className="space-y-2">
                      {daySchedules.map(schedule => (
                        <div key={schedule._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{schedule.courseCode} - {schedule.courseName}</p>
                            <p className="text-sm text-muted-foreground">{schedule.instructor}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{schedule.startTime} - {schedule.endTime}</p>
                            <p className="text-xs text-muted-foreground">{schedule.roomName}</p>
                            <p className="text-xs text-muted-foreground">{schedule.building}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No classes scheduled</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CoursesContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Courses
              </CardTitle>
              <CardDescription>Courses you're currently enrolled in</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <Card key={course._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openCourseDialog(course)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={course.type === 'lecture' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {course.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                  </div>
                  <CardTitle className="text-lg">{course.code}</CardTitle>
                  <CardDescription>{course.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Instructor:</span>
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Current Grade:</span>
                      <Badge className={getGradeColor(course.currentGrade || 'N/A')}>
                        {course.currentGrade || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Attendance:</span>
                      <span className={`${(course.attendance || 0) >= 90 ? 'text-green-600' : (course.attendance || 0) >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {course.attendance || 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Details Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCourse?.code} - {selectedCourse?.name}</DialogTitle>
            <DialogDescription>Course information and materials</DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Instructor</Label>
                  <p className="text-sm">{selectedCourse.instructor}</p>
                </div>
                <div>
                  <Label>Credits</Label>
                  <p className="text-sm">{selectedCourse.credits}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <Badge className={selectedCourse.type === 'lecture' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {selectedCourse.type}
                  </Badge>
                </div>
                <div>
                  <Label>Current Grade</Label>
                  <Badge className={getGradeColor(selectedCourse.currentGrade || 'N/A')}>
                    {selectedCourse.currentGrade || 'N/A'}
                  </Badge>
                </div>
              </div>
              {selectedCourse.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Syllabus
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Materials
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  const GradesContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Academic Performance
          </CardTitle>
          <CardDescription>Your grades and academic progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Current Semester GPA</h3>
                <p className="text-2xl font-bold text-blue-600">{calculateGPA().toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-lg font-semibold">{courses.reduce((acc, c) => acc + c.credits, 0)}</p>
              </div>
            </div>
          </div>

          {grades.map(grade => (
            <Card key={grade._id} className="mb-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{grade.courseCode} - {grade.courseName}</CardTitle>
                    <CardDescription>
                      Current Grade: <Badge className={getGradeColor(grade.letterGrade)}>{grade.letterGrade}</Badge>
                      <span className="ml-2">({grade.currentGrade.toFixed(1)}%)</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grade.assignments.map((assignment, index) => (
                        <TableRow key={index}>
                          <TableCell>{assignment.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {assignment.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={assignment.score >= 90 ? 'text-green-600' : assignment.score >= 80 ? 'text-blue-600' : assignment.score >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                              {assignment.score}/{assignment.maxScore}
                            </span>
                          </TableCell>
                          <TableCell>{(assignment.weight * 100).toFixed(0)}%</TableCell>
                          <TableCell>{new Date(assignment.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const AnnouncementsContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Course Announcements
          </CardTitle>
          <CardDescription>Latest updates from your instructors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.map(announcement => (
              <div key={announcement._id} className={`p-4 border rounded-lg ${getPriorityColor(announcement.priority)}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{announcement.courseCode}</Badge>
                      <Badge variant="outline" className="capitalize">
                        {announcement.priority} priority
                      </Badge>
                    </div>
                    <h3 className="font-medium">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground">by {announcement.instructor}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(announcement.date).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm">{announcement.content}</p>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No announcements yet</p>
                <p className="text-sm">Check back later for updates from your instructors</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ProfileContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Profile
              </CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </div>
            <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>Update your personal information</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency">Emergency Contact</Label>
                    <Input
                      id="emergency"
                      value={profileForm.emergencyContact}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowProfileDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Profile Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user?.name}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
                <Badge variant="outline">{user?.role}</Badge>
              </div>
            </div>

            {/* Academic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Academic Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Student ID:</span>
                    <span className="text-sm">ST2024001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Department:</span>
                    <span className="text-sm">{user?.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Year:</span>
                    <span className="text-sm">2nd Year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Enrollment Status:</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Campus Housing, Dorm A-123</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Progress */}
            <div className="space-y-4">
              <h4 className="font-medium">Academic Progress</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{calculateGPA().toFixed(2)}</div>
                      <p className="text-sm text-muted-foreground">Current GPA</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{courses.reduce((acc, c) => acc + c.credits, 0)}</div>
                      <p className="text-sm text-muted-foreground">Credits Enrolled</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">92%</div>
                      <p className="text-sm text-muted-foreground">Avg. Attendance</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout sidebarItems={sidebarItems} currentPage={getPageTitle()}>
      {activeTab === 'overview' && <OverviewContent />}
      {activeTab === 'schedule' && <ScheduleContent />}
      {activeTab === 'courses' && <CoursesContent />}
      {activeTab === 'grades' && <GradesContent />}
      {activeTab === 'announcements' && <AnnouncementsContent />}
      {activeTab === 'profile' && <ProfileContent />}
    </DashboardLayout>
  );
}