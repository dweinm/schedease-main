import { useState, useEffect } from 'react';
import apiService from '../services/api';
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

interface Room {
  _id: string;
  name: string;
  building: string;
  capacity: number;
  equipment?: string[];
  type?: string;
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

interface InstructorUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'instructor';
  department?: string;
}

interface InstructorProfile {
  _id: string;
  userId: string | InstructorUser;
  maxHoursPerWeek: number;
  specializations: string[];
  availability: Record<string, { startTime: string; endTime: string }[]>;
}

interface RoomAvailability {
  available: boolean;
  conflicts: Array<{
    roomId?: string;
    startTime: string;
    endTime: string;
    courseName?: string;
    instructorName?: string;
  }>;
}

interface RoomFilters {
  minCapacity: number;
  equipment: string[];
  building: string;
}

export function InstructorDashboard() {
  const { user } = useAuth() as { user: InstructorUser };
  const [activeTab, setActiveTab] = useState('overview');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [instructorProfileId, setInstructorProfileId] = useState<string | null>(null);
  const [availability] = useState<Availability>({
    Monday: [{ startTime: '09:00', endTime: '17:00' }],
    Tuesday: [{ startTime: '09:00', endTime: '17:00' }],
    Wednesday: [{ startTime: '09:00', endTime: '17:00' }],
    Thursday: [{ startTime: '09:00', endTime: '17:00' }],
    Friday: [{ startTime: '09:00', endTime: '15:00' }],
    Saturday: []
  });
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [roomFilters, setRoomFilters] = useState({
    minCapacity: 0,
    equipment: [] as string[],
    building: ''
  });
  const [favoriteRooms, setFavoriteRooms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favoriteRooms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [roomAvailability, setRoomAvailability] = useState<Record<string, RoomAvailability>>({});
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<string | null>(null);
  const [roomSchedule, setRoomSchedule] = useState<{
    date: string;
    schedules: Array<{
      startTime: string;
      endTime: string;
      courseName?: string;
      instructorName?: string;
    }>;
  } | null>(null);
  interface RequestFormData {
    courseId: string;
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    notes: string;
    type?: 'lecture' | 'lab' | 'seminar';
  }

  const [requestForm, setRequestForm] = useState<RequestFormData>({
    courseId: '',
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    notes: '',
    type: 'lecture'
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

      // First resolve the instructor profile for the logged-in user
      if (user) {
        try {
          const instRes = await apiService.getInstructors();
          // Normalize possible response shapes
          let instructorsList: any[] = [];
          if (instRes?.instructors) instructorsList = instRes.instructors;
          else if (instRes?.data) instructorsList = instRes.data;
          else if (Array.isArray(instRes)) instructorsList = instRes;

          // Find instructor profile matching the logged-in user
          const match = instructorsList.find((it: any) => {
            const uid = it.userId?._id || it.userId;
            return String(uid) === String(user._id || user.id);
          });

          if (match) {
            const instructorId = match._id || match.id;
            setInstructorProfileId(instructorId);

            // Fetch instructor's courses
            const coursesRes = await apiService.getCourses();
            const allCourses = coursesRes?.courses || [];
            
            // Filter courses for this instructor
            const instructorCourses = allCourses.filter((course: any) => 
              course.instructorId === instructorId || course.instructor?._id === instructorId
            );
            setCourses(instructorCourses);

            // Fetch instructor's schedules 
            const res = await apiService.getSchedules();
            const allSchedules = res?.schedules || [];
            
            // Filter schedules for this instructor and populate with course/room info
            const instructorSchedules = allSchedules
              .filter((schedule: any) => {
                const sid = schedule.instructorId?._id || schedule.instructorId;
                return String(sid) === String(instructorId);
              })
              .map((schedule: any) => ({
                _id: schedule._id,
                courseId: schedule.courseId?._id || schedule.courseId,
                courseName: schedule.courseId?.name || schedule.courseName || '',
                courseCode: schedule.courseId?.code || schedule.courseCode || '',
                roomName: schedule.roomId?.name || schedule.roomName || '',
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                semester: schedule.semester,
                year: schedule.year,
                studentsEnrolled: schedule.courseId?.studentsEnrolled || 0,
                capacity: schedule.roomId?.capacity || 0
              }));

            setSchedules(instructorSchedules);

            // Fetch instructor's schedule requests
            const reqsRes = await apiService.getInstructorScheduleRequests(instructorId);
            const fetchedRequests = reqsRes.data || [];
            setRequests(fetchedRequests.map(normalizeScheduleRequest));
          } else {
            console.warn('No instructor profile found for user', user);
            toast.error('Could not find your instructor profile');
          }
        } catch (err) {
          console.error('Failed to load instructor data:', err);
          toast.error('Failed to load your schedule');
        }
      }

      // Load rooms for schedule requests
      try {
        setLoadingRooms(true);
        const roomsRes = await apiService.getRooms();
        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }
      } catch (err) {
        console.warn('Failed to fetch rooms:', err);
        toast.error('Failed to load available rooms');
      } finally {
        setLoadingRooms(false);
      }

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
      // Basic validation
      const { courseId, roomId, date, startTime, endTime, purpose } = requestForm;
      if (!courseId || !roomId || !date || !startTime || !endTime || !purpose) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate time range
      if (startTime >= endTime) {
        toast.error('Start time must be before end time');
        return;
      }

      const requestData = {
        ...requestForm,
        // Always use the instructor profile ID for scheduling
        instructorId: instructorProfileId,
        // Backend expects requestType and details fields for schedule requests
        requestType: 'room_change',
        details: requestForm.purpose || requestForm.notes || '',
        // Include semester info based on the date
        semester: getSemesterFromDate(date),
        year: new Date(date).getFullYear()
      };

      const response = await apiService.createScheduleRequest(requestData);

      if (response.success) {
        if (response.data) {
          // Normalize API response to the UI shape and add to list
          setRequests(prev => [normalizeScheduleRequest(response.data), ...prev]);
        } else {
          // Otherwise refresh the full list and normalize
          if (user?.id) {
            const updatedRequests = await apiService.getInstructorScheduleRequests(user.id);
            setRequests((updatedRequests.data || []).map(normalizeScheduleRequest));
          }
        }
        
        toast.success('Schedule request submitted successfully');
        setShowRequestDialog(false);
        // Reset form with all fields (default to lecture)
        setRequestForm({
          courseId: '',
          roomId: '',
          date: '',
          startTime: '',
          endTime: '',
          purpose: '',
          notes: '',
          type: 'lecture'
        });

        // If there are conflicts, show a warning
        if (response.data?.conflict_flag) {
          toast.warning('Request submitted but potential conflicts detected. Admin review required.');
        }
      } else {
        toast.error(response.message || 'Failed to submit request');
      }
    } catch (error: any) {
      console.error('Failed to submit schedule request:', error);
      toast.error(error.message || 'Failed to submit request');
    }
  };

  // Normalizes schedule request objects returned by the backend so the UI
  // can rely on stable fields like `courseName`, `details`, and `type`.
  const getSemesterFromDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = date.getMonth(); // 0-11
    
    // Define semester ranges (adjust these based on your academic calendar)
    if (month >= 8 && month <= 11) return 'First Term';  // Sep-Dec
    if (month >= 0 && month <= 3) return 'Second Term';  // Jan-Apr
    return 'Third Term';  // May-Aug
  };

  const normalizeScheduleRequest = (r: any) => {
    return {
      _id: r._id || r.id || r._id,
      courseId: r.courseId?._id || r.courseId || r.courseId,
      courseName: r.courseId?.name || r.courseName || r.courseCode || '',
      // UI expects `details` while backend uses `purpose` or `reason`.
      details: r.purpose || r.details || r.reason || '',
      // Keep a `type` field for display; fallback to requestType or a sensible default
      type: r.type || r.requestType || 'room_change',
      status: r.status || 'pending',
      createdAt: r.createdAt || r.created_at || new Date().toISOString(),
      // keep original for any further needs
      __raw: r
    } as ScheduleRequest;
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

  const toggleFavoriteRoom = (roomId: string) => {
    setFavoriteRooms(prev => {
      const newFavorites = prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId];
      localStorage.setItem('favoriteRooms', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const fetchRoomSchedule = async (roomId: string, date: string) => {
    try {
      // Get instructor's schedules and filter for room
      // Ensure we have a valid instructor ID before making the API call
      const instructorId = instructorProfileId || user?._id || user?.id;
      if (!instructorId) {
        throw new Error('No valid instructor ID found');
      }
      const instRes = await apiService.getInstructorSchedules(instructorId);
      const allSchedules = instRes?.schedules || [];
      const weekday = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long' }) : null;

      const roomSchedules = allSchedules
        .filter((s: any) => {
          const sid = s.roomId?._id || s.roomId || s.room || s.roomId;
          const matchesRoom = String(sid) === String(roomId);
          const matchesDay = weekday ? s.dayOfWeek === weekday : true;
          return matchesRoom && matchesDay;
        })
        .map((s: any) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          courseName: s.courseName || s.courseId?.name || s.courseCode || '',
          instructorName: s.instructorName || s.instructorId?.userId?.name || ''
        }));

      setRoomSchedule({ date, schedules: roomSchedules });
    } catch (error) {
      console.error('Failed to fetch room schedule:', error);
      toast.error('Could not load room schedule');
    }
  };

  const checkRoomAvailability = async (roomId: string, date: string, startTime: string, endTime: string) => {
    try {
      // Get instructor schedules and filter for room conflicts
      const instRes = await apiService.getSchedules(); // Use getSchedules since we want to check ALL schedules
      const allSchedules = instRes?.schedules || [];
      const weekday = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long' }) : null;

      type ApiRoomConflict = {
        roomId?: any;
        startTime: string;
        endTime: string;
        courseName?: string;
        instructorName?: string;
      };

      const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
        return aStart < bEnd && bStart < aEnd; // simple overlap check assuming HH:MM strings
      };

      // Find any schedule that overlaps the requested time slot
      const roomConflicts: ApiRoomConflict[] = allSchedules.filter((s: any) => {
        const sid = s.roomId?._id || s.roomId || s.room || s.roomId;
        const matchesRoom = String(sid) === String(roomId);
        const matchesDay = weekday ? s.dayOfWeek === weekday : true;
        if (!matchesRoom || !matchesDay) return false;
        if (!startTime || !endTime) return true; // if times not provided, consider it a conflict
        return overlaps(startTime, endTime, s.startTime, s.endTime);
      }).map((s: any) => ({
        roomId: s.roomId?._id || s.roomId,
        startTime: s.startTime,
        endTime: s.endTime,
        courseName: s.courseName || s.courseCode || s.courseId?.name || '',
        instructorName: s.instructorName || s.instructorId?.userId?.name || ''
      }));

      setRoomAvailability(prev => ({
        ...prev,
        [roomId]: {
          available: roomConflicts.length === 0,
          conflicts: roomConflicts
        }
      }));

      // If this is the selected room, fetch its schedule for display
      if (requestForm.roomId === roomId) {
        await fetchRoomSchedule(roomId, date);
      }
    } catch (error) {
      console.error('Failed to check room availability:', error);
      toast.error('Could not check room availability');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || student.courses.includes(selectedCourse);
    return matchesSearch && matchesCourse;
  });

  const filteredRooms = rooms.filter(room => {
    const meetsCapacity = room.capacity >= roomFilters.minCapacity;
    const hasRequiredEquipment = roomFilters.equipment.length === 0 || 
      (room.equipment && roomFilters.equipment.every(eq => room.equipment?.includes(eq)));
    const matchesBuilding = !roomFilters.building || 
      room.building.toLowerCase().includes(roomFilters.building.toLowerCase());
    return meetsCapacity && hasRequiredEquipment && matchesBuilding;
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
    // Just use the name property since that's what's defined in InstructorUser
    const nameFields = [src.name];
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

  const ScheduleContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    // Group schedules by semester/year for organization
    const schedulesBySemester = schedules.reduce((acc: any, schedule: any) => {
      const key = `${schedule.semester} ${schedule.year}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(schedule);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(schedulesBySemester).map(([term, termSchedules]: [string, any]) => (
          <Card key={term} className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {term}
              </CardTitle>
              <CardDescription>Your weekly schedule for {term}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                  const daySchedules = termSchedules.filter((s: any) => s.dayOfWeek === day);
                  return (
                    <div key={day} className="border rounded-lg p-4 bg-white">
                      <h3 className="font-semibold mb-3 text-gray-900">{day}</h3>
                      {daySchedules.length > 0 ? (
                        <div className="space-y-2">
                          {daySchedules
                            .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
                            .map((schedule: any) => (
                              <div key={schedule._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {schedule.courseCode} - {schedule.courseName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {schedule.roomName}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {schedule.startTime} - {schedule.endTime}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {schedule.studentsEnrolled} / {schedule.capacity} students
                                  </p>
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
        ))}
        
        {!Object.keys(schedulesBySemester).length && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-500">No schedules found</p>
            <p className="text-sm text-gray-400">
              You don't have any classes scheduled yet.
            </p>
          </div>
        )}
      </div>
    );
  };

  const CoursesContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    // Group courses by semester for display
    const coursesBySemester = courses.reduce((acc: any, course: any) => {
      const key = `${course.semester || 'Current'} ${course.year || new Date().getFullYear()}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(course);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(coursesBySemester).map(([term, termCourses]: [string, any]) => (
          <Card key={term} className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {term}
              </CardTitle>
              <CardDescription>Courses you're teaching this term</CardDescription>
         S </CardHeader>
     s      <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {termCourses.map((course: any) => (
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
      HHHd d d              <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Department:</span>
                          <span className="font-medium">{course.department}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Schedule:</span>
                          <span className="font-medium">
                            {schedules
                              .filter(s => s.courseId === course._id)
                              .map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`)
                              .join(', ') || 'Not scheduled'}
                          </span>
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
        ))}

        {!Object.keys(coursesBySemester).length && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-500">No courses found</p>
            <p className="text<-sm >ext-gray-400">
              Y ollu haven't been assigned to any courses yet.
            </p>
          </div>
        )}
      </div>
    );
  };

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
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minCapacity">Minimum Capacity</Label>
                        <Input
                          type="number"
                          id="minCapacity"
                          min="0"
                          value={roomFilters.minCapacity}
                          onChange={(e) => setRoomFilters(prev => ({
                            ...prev,
                            minCapacity: parseInt(e.target.value) || 0
                          }))}
                          placeholder="Min. seats"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="building">Building</Label>
                        <Input
                          type="text"
                          id="building"
                          value={roomFilters.building}
                          onChange={(e) => setRoomFilters(prev => ({
                            ...prev,
                            building: e.target.value
                          }))}
                          placeholder="Search building..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="equipment">Required Equipment</Label>
                      <Select
                        value={roomFilters.equipment.join(',')}
                        onValueChange={(value) => setRoomFilters(prev => ({
                          ...prev,
                          equipment: value ? value.split(',') : []
                        }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="projector">Projector</SelectItem>
                          <SelectItem value="whiteboard">Whiteboard</SelectItem>
                          <SelectItem value="computers">Computers</SelectItem>
                          <SelectItem value="audio">Audio System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roomId">Select Room</Label>
                      <Select value={requestForm.roomId} onValueChange={(value) => setRequestForm(prev => ({ ...prev, roomId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-[300px] overflow-y-auto">
                          {loadingRooms ? (
                            <div className="p-4 text-center">
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">Loading rooms...</span>
                            </div>
                          ) : (
                            <>
                              {/* Room List with Details Button */}
                              {filteredRooms.map(room => (
                                <div key={room._id} className="relative">
                                  <div 
                                    className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg border-b"
                                    onClick={() => setSelectedRoomForDetails(room._id)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-grow">
                                        <div className="font-medium flex items-center gap-2">
                                          {room.name} - {room.building}
                                          {favoriteRooms.includes(room._id) && (
                                            <span className="text-yellow-500">★</span>
                                          )}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                          <span className="inline-flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            Capacity: {room.capacity}
                                          </span>
                                        </div>
                                        {room.equipment && room.equipment.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {room.equipment.map(eq => (
                                              <Badge key={eq} variant="outline" className="text-xs">
                                                {eq}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        {roomAvailability[room._id] && (
                                          <Badge className={
                                            roomAvailability[room._id].available 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }>
                                            {roomAvailability[room._id].available ? 'Available' : 'Conflicts'}
                                            {roomAvailability[room._id].conflicts.length > 0 && 
                                              ` (${roomAvailability[room._id].conflicts.length})`
                                            }
                                          </Badge>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleFavoriteRoom(room._id);
                                          }}
                                          className={`ml-2 hover:scale-110 transition-transform ${
                                            favoriteRooms.includes(room._id)
                                              ? 'text-yellow-500'
                                              : 'text-gray-400 hover:text-yellow-500'
                                          }`}
                                        >
                                          {favoriteRooms.includes(room._id) ? '★' : '☆'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Room Details Dialog */}
                              {selectedRoomForDetails && (
                                <Dialog 
                                  open={!!selectedRoomForDetails} 
                                  onOpenChange={() => setSelectedRoomForDetails(null)}
                                >
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>
                                        {rooms.find(r => r._id === selectedRoomForDetails)?.name}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Room details and schedule for {requestForm.date}
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                      {/* Room Info */}
                                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div>
                                          <h4 className="font-medium text-gray-700">Location</h4>
                                          <p className="text-gray-600">
                                            {rooms.find(r => r._id === selectedRoomForDetails)?.building}
                                          </p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium text-gray-700">Capacity</h4>
                                          <p className="text-gray-600">
                                            {rooms.find(r => r._id === selectedRoomForDetails)?.capacity} seats
                                          </p>
                                        </div>
                                      </div>

                                      {/* Equipment List */}
                                      <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-medium text-gray-700 mb-2">Equipment</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {rooms.find(r => r._id === selectedRoomForDetails)?.equipment?.map(eq => (
                                            <Badge key={eq} className="bg-white">
                                              {eq}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Schedule Timeline */}
                                      <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-medium text-gray-700 mb-2">Today's Schedule</h4>
                                        <div className="space-y-2">
                                          {roomSchedule?.schedules.length === 0 ? (
                                            <p className="text-gray-500">No classes scheduled for today</p>
                                          ) : (
                                            roomSchedule?.schedules.map((schedule, idx) => (
                                              <div 
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-white rounded border"
                                              >
                                                <div>
                                                  <p className="font-medium">
                                                    {schedule.courseName || 'Booked'}
                                                  </p>
                                                  <p className="text-sm text-gray-500">
                                                    {schedule.instructorName || 'Reserved'}
                                                  </p>
                                                </div>
                                                <div className="text-right text-sm text-gray-600">
                                                  {schedule.startTime} - {schedule.endTime}
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>

                                      {/* Conflicts Section */}
                                      {roomAvailability[selectedRoomForDetails]?.conflicts.length > 0 && (
                                        <div className="p-4 bg-red-50 rounded-lg">
                                          <h4 className="font-medium text-red-700 mb-2">
                                            Scheduling Conflicts
                                          </h4>
                                          <div className="space-y-2">
                                            {roomAvailability[selectedRoomForDetails].conflicts.map((conflict, idx) => (
                                              <div 
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-white rounded border border-red-100"
                                              >
                                                <div>
                                                  <p className="font-medium text-red-600">
                                                    {conflict.courseName || 'Booked Session'}
                                                  </p>
                                                  <p className="text-sm text-red-500">
                                                    {conflict.instructorName || 'Reserved'}
                                                  </p>
                                                </div>
                                                <div className="text-right text-sm text-red-600">
                                                  {conflict.startTime} - {conflict.endTime}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => setSelectedRoomForDetails(null)}>
                                        Close
                                      </Button>
                                      <Button 
                                        onClick={() => {
                                          setRequestForm(prev => ({ ...prev, roomId: selectedRoomForDetails }));
                                          setSelectedRoomForDetails(null);
                                        }}
                                        disabled={!!roomAvailability[selectedRoomForDetails]?.conflicts.length}
                                      >
                                        Select Room
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {filteredRooms.length === 0 && (
                                <SelectItem value="" disabled>
                                  No rooms match your criteria
                                </SelectItem>
                              )}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {filteredRooms.length} room(s) available
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      id="date"
                      value={requestForm.date}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          type="time"
                          id="startTime"
                          value={requestForm.startTime}
                          onChange={(e) => {
                            const newStartTime = e.target.value;
                            setRequestForm(prev => ({ ...prev, startTime: newStartTime }));
                            if (requestForm.date && newStartTime && requestForm.endTime) {
                              filteredRooms.forEach(room => {
                                checkRoomAvailability(room._id, requestForm.date, newStartTime, requestForm.endTime);
                              });
                            }
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          type="time"
                          id="endTime"
                          value={requestForm.endTime}
                          onChange={(e) => {
                            const newEndTime = e.target.value;
                            setRequestForm(prev => ({ ...prev, endTime: newEndTime }));
                            if (requestForm.date && requestForm.startTime && newEndTime) {
                              filteredRooms.forEach(room => {
                                checkRoomAvailability(room._id, requestForm.date, requestForm.startTime, newEndTime);
                              });
                            }
                          }}
                          required
                        />
                      </div>
                    </div>                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose</Label>
                    <Textarea
                      id="purpose"
                      placeholder="Explain the purpose of your room request..."
                      value={requestForm.purpose}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, purpose: e.target.value }))}
                      rows={2}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information or special requirements..."
                      value={requestForm.notes}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
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