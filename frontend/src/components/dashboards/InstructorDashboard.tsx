import { useState, useEffect } from 'react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Clock,
  Users,
  Settings,
  Plus,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  CalendarDays,
  Bell,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';

interface Schedule {
  _id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  roomName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  studentsEnrolled: number;
  capacity: number;
}

interface Course {
  _id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  type: string;
  studentsEnrolled: number;
  description?: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  year: number;
  courses: string[];
  attendance?: number;
  performance?: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

interface ScheduleRequest {
  _id: string;
  type: 'room_change' | 'time_change' | 'schedule_conflict';
  courseId: string;
  courseName: string;
  details: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
}

interface Availability {
  Monday: { startTime: string; endTime: string }[];
  Tuesday: { startTime: string; endTime: string }[];
  Wednesday: { startTime: string; endTime: string }[];
  Thursday: { startTime: string; endTime: string }[];
  Friday: { startTime: string; endTime: string }[];
  Saturday: { startTime: string; endTime: string }[];
}

export function InstructorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [availability] = useState<Availability>({
    Monday: [{ startTime: '09:00', endTime: '17:00' }],
    Tuesday: [{ startTime: '09:00', endTime: '17:00' }],
    Wednesday: [{ startTime: '09:00', endTime: '17:00' }],
    Thursday: [{ startTime: '09:00', endTime: '17:00' }],
    Friday: [{ startTime: '09:00', endTime: '15:00' }],
    Saturday: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestForm, setRequestForm] = useState({
    type: '',
    courseId: '',
    details: ''
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
      icon: Users,
      label: 'Students',
      onClick: () => setActiveTab('students'),
      active: activeTab === 'students'
    },
    {
      icon: MessageSquare,
      label: 'Requests',
      onClick: () => setActiveTab('requests'),
      active: activeTab === 'requests'
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => setActiveTab('settings'),
      active: activeTab === 'settings'
    }
  ];

  useEffect(() => {
    loadInstructorData();
  }, []);

  const loadInstructorData = async () => {
    try {
      setLoading(true);
      
      const mockSchedules: Schedule[] = [
        {
          _id: '4',
          courseId: 'cs201',
          courseName: 'Data Structures',
          courseCode: 'CS201',
          roomName: 'Room C-301',
          dayOfWeek: 'Thursday',
          startTime: '10:00',
          endTime: '11:30',
          studentsEnrolled: 38,
          capacity: 40
        }
      ];

      const mockCourses: Course[] = [
        {
          _id: 'cs101',
          code: 'CS101',
          name: 'Introduction to Computer Science',
          department: 'Computer Science',
          credits: 3,
          type: 'lecture',
          studentsEnrolled: 45,
          description: 'Fundamental concepts of computer science including programming basics, algorithms, and data structures.'
        },
        {
          _id: 'cs102',
          code: 'CS102',
          name: 'Programming Fundamentals Lab',
          department: 'Computer Science',
          credits: 1,
          type: 'lab',
          studentsEnrolled: 30,
          description: 'Hands-on programming experience to complement CS101 theory.'
        },
        {
          _id: 'cs201',
          code: 'CS201',
          name: 'Data Structures',
          department: 'Computer Science',
          credits: 4,
          type: 'lecture',
          studentsEnrolled: 38,
          description: 'Advanced data structures and their implementations.'
        }
      ];

      const mockStudents: Student[] = [
        {
          _id: '1',
          name: 'Alex Smith',
          email: 'student@university.edu',
          studentId: 'ST2024001',
          year: 2,
          courses: ['cs101', 'cs102'],
          attendance: 95,
          performance: 'excellent'
        },
        {
          _id: '2',
          name: 'Maria Garcia',
          email: 'student2@university.edu',
          studentId: 'ST2024002',
          year: 3,
          courses: ['cs101', 'cs201'],
          attendance: 88,
          performance: 'good'
        },
        {
          _id: '3',
          name: 'James Wilson',
          email: 'student3@university.edu',
          studentId: 'ST2024003',
          year: 1,
          courses: ['cs101'],
          attendance: 92,
          performance: 'good'
        }
      ];

      const mockRequests: ScheduleRequest[] = [
        {
          _id: '1',
          type: 'room_change',
          courseId: 'cs101',
          courseName: 'Introduction to Computer Science',
          details: 'Request to change room from A-101 to larger auditorium due to increased enrollment',
          status: 'pending',
          createdAt: '2024-12-01T10:00:00Z'
        },
        {
          _id: '2',
          type: 'time_change',
          courseId: 'cs102',
          courseName: 'Programming Fundamentals Lab',
          details: 'Request to move lab session from Tuesday to Friday afternoon',
          status: 'under_review',
          createdAt: '2024-11-28T14:30:00Z'
        }
      ];

      setSchedules(mockSchedules);
      setCourses(mockCourses);
      setStudents(mockStudents);
      setRequests(mockRequests);
    } catch (error) {
      console.error('Failed to load instructor data:', error);
      toast.error('Failed to load your schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newRequest: ScheduleRequest = {
        _id: Date.now().toString(),
        type: requestForm.type as any,
        courseId: requestForm.courseId,
        courseName: courses.find(c => c._id === requestForm.courseId)?.name || '',
        details: requestForm.details,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setRequests(prev => [newRequest, ...prev]);
      toast.success('Request submitted successfully');
      setShowRequestDialog(false);
      setRequestForm({ type: '', courseId: '', details: '' });
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Instructor Dashboard';
      case 'schedule': return 'My Schedule';
      case 'courses': return 'My Courses';
      case 'students': return 'My Students';
      case 'requests': return 'Schedule Requests';
      case 'settings': return 'Settings & Availability';
      default: return 'Instructor Dashboard';
    }
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return schedules.filter(schedule => schedule.dayOfWeek === today);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'needs_improvement': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || student.courses.includes(selectedCourse);
    return matchesSearch && matchesCourse;
  });

  const OverviewContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    const todaySchedule = getTodaySchedule();
    const totalStudents = students.length;
    const totalHours = 7;

  // Compute display name from logged-in user (robust):
  // prefer user.name, user.fullName, user.displayName, first+last, or fallback to localStorage currentUser
  const displayName = (() => {
    const src = user || (() => {
      try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    })();

    if (!src) return 'Instructor';
    // Common name fields
    const nameFields = [src.name, src.fullName, src.displayName, src.firstName ? `${src.firstName} ${src.lastName || ''}` : undefined];
    for (const f of nameFields) {
      if (f && typeof f === 'string' && f.trim()) return f.trim();
    }
    // Derive from email local part
    const email = src.email;
    if (email && typeof email === 'string') {
      const local = email.split('@')[0];
      const parts = local.split(/[._\-]/).filter(Boolean);
      const human = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      if (human) return human;
    }
    return 'Instructor';
  })();

  return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}!</h2>
                <p className="text-gray-600 mt-1">Here's your teaching overview for today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Classes</CardTitle>
              <Calendar className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">4</div>
              <p className="text-xs text-gray-500 mt-1">This semester</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Teaching Hours</CardTitle>
              <Clock className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHours}</div>
              <p className="text-xs text-gray-500 mt-1">Hours per week</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Courses</CardTitle>
              <BookOpen className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{courses.length}</div>
              <p className="text-xs text-gray-500 mt-1">Active courses</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Students</CardTitle>
              <Users className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStudents}</div>
              <p className="text-xs text-gray-500 mt-1">Total enrolled</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map((schedule) => (
                  <div key={schedule._id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                    <div>
                      <p className="font-semibold text-gray-900">{schedule.courseCode} - {schedule.courseName}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {schedule.roomName} • {schedule.startTime} - {schedule.endTime}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {schedule.studentsEnrolled}/{schedule.capacity} students
                      </p>
                    </div>
                    <Badge className="bg-black text-white hover:bg-gray-900">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-gray-500">No classes scheduled for today</p>
                <p className="text-sm text-gray-400">Enjoy your day off!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Recent Requests */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border shadow-sm" onClick={() => setActiveTab('schedule')}>
                <Calendar className="h-4 w-4 mr-3" />
                View Full Schedule
              </Button>
              <Button className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border shadow-sm" onClick={() => setActiveTab('students')}>
                <Users className="h-4 w-4 mr-3" />
                Manage Students
              </Button>
              <Button className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border shadow-sm" onClick={() => setShowRequestDialog(true)}>
                <MessageSquare className="h-4 w-4 mr-3" />
                Submit Request
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.slice(0, 2).map((request) => (
                    <div key={request._id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">{request.courseName}</p>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{request.details}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No pending requests</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const ScheduleContent = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
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
                <div key={day} className="border rounded-lg p-4 bg-white">
                  <h3 className="font-semibold mb-3 text-gray-900">{day}</h3>
                  {daySchedules.length > 0 ? (
                    <div className="space-y-2">
                      {daySchedules.map(schedule => (
                        <div key={schedule._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{schedule.courseCode} - {schedule.courseName}</p>
                            <p className="text-sm text-gray-500">{schedule.roomName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{schedule.startTime} - {schedule.endTime}</p>
                            <p className="text-xs text-gray-500">{schedule.studentsEnrolled} students</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No classes scheduled</p>
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
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Courses
          </CardTitle>
          <CardDescription>Courses you're currently teaching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <Card key={course._id} className="border shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={course.type === 'lecture' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {course.type}
                    </Badge>
                    <span className="text-sm text-gray-500">{course.credits} credits</span>
                  </div>
                  <CardTitle className="text-lg">{course.code}</CardTitle>
                  <CardDescription>{course.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Department:</span>
                      <span className="font-medium">{course.department}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Enrolled:</span>
                      <span className="font-medium">{course.studentsEnrolled} students</span>
                    </div>
                    {course.description && (
                      <p className="text-xs text-gray-500 mt-3 pt-3 border-t">{course.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const StudentsContent = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Students
              </CardTitle>
              <CardDescription>Students enrolled in your courses</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="bg-white">
                <Upload className="h-4 w-4 mr-2" />
                Import Grades
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48 bg-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Student ID</TableHead>
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="font-semibold">Courses</TableHead>
                  <TableHead className="font-semibold">Attendance</TableHead>
                  <TableHead className="font-semibold">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{student.studentId}</TableCell>
                    <TableCell className="text-gray-600">Year {student.year}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {student.courses.map(courseId => {
                          const course = courses.find(c => c._id === courseId);
                          return course ? (
                            <Badge key={courseId} variant="outline" className="text-xs bg-white">
                              {course.code}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">{student.attendance}%</div>
                        {student.attendance && student.attendance >= 90 && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {student.attendance && student.attendance < 75 && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.performance && (
                        <Badge className={getPerformanceColor(student.performance)}>
                          {student.performance.replace('_', ' ')}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No students found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const RequestsContent = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Schedule Requests
              </CardTitle>
              <CardDescription>Submit and track your schedule change requests</CardDescription>
            </div>
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Submit Schedule Request</DialogTitle>
                  <DialogDescription>
                    Request a change to your schedule or report a conflict
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Request Type</Label>
                    <Select value={requestForm.type} onValueChange={(value) => setRequestForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="room_change">Room Change</SelectItem>
                        <SelectItem value="time_change">Time Change</SelectItem>
                        <SelectItem value="schedule_conflict">Schedule Conflict</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseId">Course</Label>
                    <Select value={requestForm.courseId} onValueChange={(value) => setRequestForm(prev => ({ ...prev, courseId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        {courses.map(course => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="details">Details</Label>
                    <Textarea
                      id="details"
                      placeholder="Please provide detailed information about your request..."
                      value={requestForm.details}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, details: e.target.value }))}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowRequestDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white">Submit Request</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request._id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{request.courseName}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {request.type.replace('_', ' ')} request
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{request.details}</p>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-gray-500">No requests submitted yet</p>
                <p className="text-sm text-gray-400">Click "New Request" to submit your first request</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SettingsContent = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Availability Settings
          </CardTitle>
          <CardDescription>Set your available hours for scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(availability).map(([day, slots]) => (
              <div key={day} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-24 font-medium text-gray-900">{day}</div>
                  {slots.length > 0 ? (
                    <div className="flex gap-2">
                      {slots.map((slot: { startTime: string; endTime: string }, index: number) => (
                        <Badge key={index} variant="outline" className="bg-white">
                          {slot.startTime} - {slot.endTime}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Not available</span>
                  )}
                </div>
                <Button variant="outline" size="sm" className="bg-white">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive schedule updates via email</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Schedule Reminders</div>
                <div className="text-sm text-gray-500">Get reminders before classes</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Student Updates</div>
                <div className="text-sm text-gray-500">Notifications about student activities</div>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded" />
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
      {activeTab === 'students' && <StudentsContent />}
      {activeTab === 'requests' && <RequestsContent />}
      {activeTab === 'settings' && <SettingsContent />}
    </DashboardLayout>
  );
}