import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { mockSchedule, mockCourses, mockInstructors, mockRooms } from '../mockData';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  Calendar, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import apiService from '../services/api';

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface BaseEntity {
  _id: string;
  id?: string;
}

interface Course extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  credits?: number;
  department?: string;
  type?: string;
}

interface Room extends BaseEntity {
  name: string;
  roomName?: string;
  number?: string;
  building: string;
  buildingName?: string;
  capacity?: number;
  type?: string;
}

interface Instructor extends BaseEntity {
  userId?: {
    name: string;
    email: string;
    department: string;
  };
  name?: string;
  email?: string;
  department?: string;
  maxHoursPerWeek?: number;
  specializations?: string[];
  availability?: Record<string, { startTime: string; endTime: string; }[]>;
  status?: string;
}

interface ScheduleResponse {
  success: boolean;
  message: string;
  schedule?: Schedule;
  conflicts?: string[];
}

interface Schedule {
  _id: string;
  id?: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  instructorId: string;
  instructorName: string;
  roomId: string;
  roomName: string;
  building: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  semester: string;
  year: number;
  academicYear: string;
  status: 'draft' | 'published' | 'conflict' | 'canceled';
  conflicts: string[];
  createdAt: string;
}

interface ScheduleFormData {
  courseId: string;
  instructorId: string;
  roomId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  semester: string;
  year: number;
}

interface GenerationSettings {
  semester: string;
  year: number;
  startDate: string;
  endDate: string;
  avoidConflicts: boolean;
  maxHoursPerDay: number;
}

export function SchedulesManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<string[]>([]);
  const [formData, setFormData] = useState<ScheduleFormData>({
    courseId: '',
    instructorId: '',
    roomId: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    semester: 'First Term',
    year: 2024
  });
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    semester: 'First Term',
    year: 2024,
    startDate: '2024-08-26',
    endDate: '2024-12-13',
    avoidConflicts: true,
    maxHoursPerDay: 8
  });
  const [generating, setGenerating] = useState(false);

  const handleGenerateSchedules = async () => {
    try {
      setGenerating(true);
      // TODO: Implement the actual schedule generation logic
      // For now just simulating a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Schedules generated successfully');
      setShowGenerateDialog(false);
    } catch (error) {
      console.error('Error generating schedules:', error);
      toast.error('Failed to generate schedules');
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      instructorId: '',
      roomId: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      semester: 'First Term',
      year: 2024
    });
  };


  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const semesters = ['First Term', 'Second Term', 'Third Term'];
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  useEffect(() => {
    loadScheduleData();
  }, []);

  // Debug effect for instructors
  useEffect(() => {
    console.log('Current instructors:', instructors);
  }, [instructors]);

  const loadScheduleData = async () => {
    setLoading(true);
    try {
      // Always start with mock data as base
      let schedulesList = [...mockSchedule];
      let coursesList = [...mockCourses];
      let instructorsList = [...mockInstructors];
      let roomsList = [...mockRooms];
      
      try {
        const [schedulesRes, coursesRes, instructorsRes, roomsRes] = await Promise.all([
          apiService.getSchedules(),
          apiService.getCourses(),
          apiService.getInstructors(),
          apiService.getRooms()
        ]);

        // Always use API data if available, fallback to mock data
        schedulesList = schedulesRes?.schedules?.length > 0 ? schedulesRes.schedules : mockSchedule;
        coursesList = coursesRes?.courses?.length > 0 ? coursesRes.courses : mockCourses;
        instructorsList = instructorsRes?.instructors?.length > 0 ? instructorsRes.instructors : mockInstructors;
        roomsList = roomsRes?.rooms?.length > 0 ? roomsRes.rooms : mockRooms;

        console.log('Loaded data:', {
          schedules: schedulesList,
          courses: coursesList,
          instructors: instructorsList,
          rooms: roomsList
        });
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
      }

      console.log('Fetched data:', {
        schedules: schedulesList.length,
        courses: coursesList.length,
        instructors: instructorsList.length,
        rooms: roomsList.length
      });

      const coursesN = coursesList.map((rawCourse: any) => {
        // Ensure we have a valid MongoDB ID
        const _id = rawCourse._id || rawCourse.id;
        console.log('Processing course:', { raw: rawCourse, _id });
        
        const course: Course = {
          _id: _id,
          code: rawCourse.code || rawCourse.courseCode || 'N/A',
          name: rawCourse.name || rawCourse.courseName || 'Unknown Course',
          description: rawCourse.description,
          credits: rawCourse.credits,
          department: rawCourse.department,
          type: rawCourse.type
        };
        return course;
      });

      const roomsN = roomsList.map((room: Partial<Room>) => {
        const _id = room._id || room.id;
        console.log('Processing room:', { raw: room, _id });
        
        const roomName = room.name || room.roomName || room.number || 'Unknown Room';
        return {
          _id: _id,
          name: roomName,
          roomName: roomName,
          number: room.number,
          building: room.building || room.buildingName || 'Main Building',
          buildingName: room.building || room.buildingName || 'Main Building',
          capacity: room.capacity,
          type: room.type
        } as Room;
      });
      
      // Enhanced instructor normalization with proper typing
      const instructorsN = (instructorsList || []).map((instructor: any) => {
        const _id = instructor._id || instructor.id;
        console.log('Processing instructor:', { raw: instructor, _id });
        
        const userId = typeof instructor.userId === 'object' ? instructor.userId : { name: '', email: '', department: '' };
        
        // Transform availability from array to record/object
        const availabilityRecord: Record<string, { startTime: string; endTime: string; }[]> = {};
        if (Array.isArray(instructor.availability)) {
          instructor.availability.forEach((slot: { day: string; startTime: string; endTime: string; }) => {
            if (!availabilityRecord[slot.day]) {
              availabilityRecord[slot.day] = [];
            }
            availabilityRecord[slot.day].push({
              startTime: slot.startTime,
              endTime: slot.endTime
            });
          });
        }

        // Get the instructor name from all possible sources
        const instructorName = instructor.name || 
                             (instructor.userId && typeof instructor.userId === 'object' ? instructor.userId.name : null) ||
                             userId.name ||
                             (instructor.user && typeof instructor.user === 'object' ? instructor.user.name : null);
        
        console.log('Processing instructor name:', { raw: instructor, userId, derived: instructorName });

        const normalizedInstructor: Instructor = {
          _id: instructor._id || instructor.id || generateId(),
          userId: {
            name: instructorName || 'Unknown Instructor',
            email: userId.email || instructor.email || '',
            department: userId.department || instructor.department || ''
          },
          name: instructorName || 'Unknown Instructor',
          email: userId.email || instructor.email || '',
          department: userId.department || instructor.department || '',
          maxHoursPerWeek: instructor.maxHoursPerWeek || 20,
          specializations: instructor.specializations || [],
          availability: availabilityRecord,
          status: instructor.status || 'active'
        };
        
        console.log('Normalized instructor:', normalizedInstructor); // Debug log
        return normalizedInstructor;
      }) as Instructor[];
      
      // Sort instructors by name
      instructorsN.sort((a, b) => {
        const nameA = a.name || a.userId?.name || '';
        const nameB = b.name || b.userId?.name || '';
        return nameA.localeCompare(nameB);
      });

      // Normalize schedules: support populated objects or plain ids
      // Use the normalized lists (coursesN, instructorsN, roomsN) so UI names match what we display elsewhere
      const schedulesNormalized: Schedule[] = (schedulesList || []).map((s: any) => {
        // Find related data from the normalized lists by id
        const courseObj = coursesN.find((c: any) => c._id === s.courseId || c.id === s.courseId);
        const instructorObj = instructorsN.find((i: any) => i._id === s.instructorId || i.id === s.instructorId);
        const roomObj = roomsN.find((r: any) => r._id === s.roomId || r.id === s.roomId);

        // Course normalization with safe fallbacks
        const courseId = s.courseId || '';
        const courseCode = courseObj ? courseObj.code : (s.courseCode || 'Unknown Course');
        const courseName = courseObj ? courseObj.name : (s.courseName || 'Unknown Course');

        // Instructor normalization with safe fallbacks
        const instructorId = s.instructorId || '';
        const instructorName = instructorObj ? (instructorObj.userId?.name || instructorObj.name || 'Unknown Instructor') : (s.instructorName || 'Unknown Instructor');

        // Room normalization with safe fallbacks
        const roomId = s.roomId || '';
        const roomName = roomObj ? (roomObj.name || 'Unknown Room') : (s.roomName || 'Unknown Room');
        const building = roomObj ? (roomObj.building || '') : (s.building || '');

        const year = s.year || (s.academicYear ? parseInt(String(s.academicYear).split('-')[0]) : undefined) || 2024;

        return {
          ...s,
          _id: s._id || s.id,
          courseId,
          courseCode,
          courseName,
          instructorId,
          instructorName,
          roomId,
          roomName,
          building,
          year,
          semester: s.semester || 'First Term',
          status: s.conflicts?.length > 0 ? 'conflict' : (s.status || 'published'),
          conflicts: s.conflicts || [],
          createdAt: s.createdAt || new Date().toISOString()
        } as Schedule;
      });

      setCourses(coursesN);
      setInstructors(instructorsN);
      setRooms(roomsN);
      setSchedules(schedulesNormalized);
    } catch (error: any) {
      console.error('Failed to load schedule data:', error);
      toast.error(error?.response?.message || error?.message || 'Failed to load schedule data');
      setSchedules([]);
      setCourses([]);
      setInstructors([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleCreateSchedule called with formData:', JSON.stringify(formData, null, 2)); // Detailed debug log
    setSubmitting(true);
    try {
      // Validate required fields
      if (!formData.courseId || !formData.instructorId || !formData.roomId || 
          !formData.dayOfWeek || !formData.startTime || !formData.endTime ||
          !formData.semester || !formData.year) {
        console.log('Missing required fields:', formData); // Debug log
        toast.error('All fields are required');
        setSubmitting(false);
        return;
      }

      // End time must be after start time
      if (formData.endTime <= formData.startTime) {
        toast.error('End time must be after start time');
        setSubmitting(false);
        return;
      }

      // Get entity details for validation
      const selectedInstructor = instructors.find(i => i._id === formData.instructorId || i.id === formData.instructorId);
      const selectedCourse = courses.find(c => c._id === formData.courseId || c.id === formData.courseId);
      const selectedRoom = rooms.find(r => r._id === formData.roomId || r.id === formData.roomId);

      if (!selectedInstructor || !selectedCourse || !selectedRoom) {
        toast.error('Selected instructor, course, or room not found');
        console.log('Selected entities:', { selectedInstructor, selectedCourse, selectedRoom });
        setSubmitting(false);
        return;
      }

      // Debug log selected entities
      console.log('Selected entities:', {
        course: selectedCourse,
        instructor: selectedInstructor,
        room: selectedRoom
      });

      // Create schedule with validated entity IDs
      const newSchedule = {
        courseId: selectedCourse._id || selectedCourse.id,
        instructorId: selectedInstructor._id || selectedInstructor.id,
        roomId: selectedRoom._id || selectedRoom.id,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        semester: formData.semester,
        year: Number(formData.year),
        academicYear: `${formData.year}-${Number(formData.year) + 1}`,
        status: 'published',
        forceCreate: false,
      };

      // Debug log the schedule data being sent
      console.log('Sending schedule data:', newSchedule);
      
      console.log('Attempting to create schedule:', newSchedule); // Debug log

      // Try to create schedule using API
      const response: ScheduleResponse = await apiService.createSchedule(newSchedule);
      console.log('Create schedule response:', response);

      // Handle conflicts
      if (response.conflicts && response.conflicts.length > 0) {
        console.log('Conflicts detected:', response.conflicts);
        setConflictDetails(response.conflicts);
        setShowConflictDialog(true);
        // Store the schedule data temporarily for the conflict dialog
        setFormData(prev => ({
          ...prev,
          conflicts: response.conflicts
        }));
        
        // Show a warning toast but still allow creation
        toast.warning('Schedule created with conflicts detected');
        setShowCreateDialog(false);
        resetForm();
        await loadScheduleData(); // Refresh schedule data to show the new conflicted schedule
        return;
      }

      // Handle other errors
      if (!response.success) {
        throw new Error(response.message || 'Failed to create schedule');
      }

      // Success case
      toast.success('Schedule created successfully');
      setShowCreateDialog(false);
      resetForm();
      try {
        await loadScheduleData(); // Refresh schedule data from server
      } catch (loadError) {
        console.error('Failed to reload schedules:', loadError);
        // Even if reload fails, we still created the schedule successfully
      }
    } catch (error: any) {
      console.error('Create schedule error:', error);
      toast.error(error.message || 'Failed to create schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    setSubmitting(true);
    try {
      // Validate required fields
      if (!formData.courseId || !formData.instructorId || !formData.roomId || 
          !formData.dayOfWeek || !formData.startTime || !formData.endTime ||
          !formData.semester || !formData.year) {
        toast.error('All fields are required');
        setSubmitting(false);
        return;
      }

      // End time must be after start time
      if (formData.endTime <= formData.startTime) {
        toast.error('End time must be after start time');
        setSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        year: Number(formData.year),
        academicYear: `${formData.year}-${formData.year + 1}`
      };

      const res = await apiService.updateSchedule(selectedSchedule._id, payload);
      console.log('Update schedule response:', res); // Debug log

      if (!res?.success) {
        toast.error(res?.message || 'Failed to update schedule');
        return;
      }

      const updated = res.schedule;
      // Also check conflicts in the response object itself
      const conflicts = res.conflicts || updated?.conflicts || [];

      if (updated) {
        if ((updated.status === 'conflict' || conflicts.length > 0)) {
          setConflictDetails(conflicts);
          setShowConflictDialog(true);
          // Keep the edit dialog open until user makes a decision about the conflicts
        } else {
          toast.success('Schedule updated successfully');
          setShowEditDialog(false);
          setSelectedSchedule(null);
          resetForm();
          await loadScheduleData();
        }
      } else {
        console.error('Update schedule failed', res);
        toast.error(res?.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Update schedule error', error);
      toast.error('Failed to update schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const result = await new Promise<boolean>((resolve) => {
        if (window.confirm('Are you sure you want to delete this schedule?')) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      if (!result) return;

      const res = await apiService.deleteSchedule(scheduleId);
      if (res?.success) {
        toast.success('Schedule deleted successfully');
        await loadScheduleData();
      } else {
        console.error('Delete schedule failed', res);
        toast.error(res?.message || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Delete schedule error:', error);
      toast.error('Failed to delete schedule');
    }
  };

  // Note: Conflict detection is now handled by the backend
  const openEditDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      courseId: schedule.courseId,
      instructorId: schedule.instructorId,
      roomId: schedule.roomId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      semester: schedule.semester,
      year: schedule.year
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowViewDialog(true);
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.instructorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus;
    const matchesSemester = filterSemester === 'all' || schedule.semester === filterSemester;
    return matchesSearch && matchesStatus && matchesSemester;
  });

  const exportSchedules = () => {
    const csv = [
      ['Course Code', 'Course Name', 'Instructor', 'Room', 'Day', 'Start Time', 'End Time', 'Status'],
      ...filteredSchedules.map(schedule => [
        schedule.courseCode,
        schedule.courseName,
        schedule.instructorName,
        schedule.roomName,
        schedule.dayOfWeek,
        schedule.startTime,
        schedule.endTime,
        schedule.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schedules-export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Schedules exported successfully');
  };

  const getScheduleStats = () => {
    const total = schedules.length;
    const published = schedules.filter(s => s.status === 'published').length;
    const conflicts = schedules.filter(s => s.status === 'conflict').length;
    const drafts = schedules.filter(s => s.status === 'draft').length;
    
    return { total, published, conflicts, drafts };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = getScheduleStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Schedules</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.published}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Conflicts</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.conflicts}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.drafts}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-5 w-5" />
                Schedule Management
              </CardTitle>
              <CardDescription className="mt-1">
                Generate and manage class schedules with automated conflict detection
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportSchedules} variant="outline" className="bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Auto Generate
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>Generate Schedules</DialogTitle>
                    <DialogDescription>
                      Automatically generate schedules for the semester
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Semester</Label>
                        <Select value={generationSettings.semester} onValueChange={(value) => setGenerationSettings(prev => ({ ...prev, semester: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {semesters.map(semester => (
                              <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          type="number"
                          value={generationSettings.year}
                          onChange={(e) => setGenerationSettings(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={generationSettings.startDate}
                          onChange={(e) => setGenerationSettings(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={generationSettings.endDate}
                          onChange={(e) => setGenerationSettings(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Hours Per Day</Label>
                      <Input
                        type="number"
                        value={generationSettings.maxHoursPerDay}
                        onChange={(e) => setGenerationSettings(prev => ({ ...prev, maxHoursPerDay: parseInt(e.target.value) }))}
                        min="1"
                        max="12"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="avoidConflicts"
                        checked={generationSettings.avoidConflicts}
                        onChange={(e) => setGenerationSettings(prev => ({ ...prev, avoidConflicts: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="avoidConflicts">Avoid scheduling conflicts</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowGenerateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleGenerateSchedules} disabled={generating} className="bg-gray-900 hover:bg-gray-800 text-white">
                        {generating ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Generating...</span>
                          </>
                        ) : (
                          'Generate Schedules'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl bg-white z-50 rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-semibold">Create New Schedule</DialogTitle>
                    <DialogDescription className="text-gray-600 mt-1">
                      Add a new class schedule
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSchedule} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="course-select">Course</Label>
                        <Select value={formData.courseId} onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}>
                          <SelectTrigger id="course-select" className="w-full bg-white border border-gray-200 h-10" aria-label="Select course">
                            <SelectValue placeholder="Select course" className="text-gray-500" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden max-h-[200px] z-50"
                            position="popper"
                            sideOffset={5}>
                            {courses.map(course => (
                              <SelectItem 
                                key={course._id} 
                                value={course._id}
                                className="py-2 px-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                {course.code} - {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instructor-select">Instructor</Label>
                        <Select value={formData.instructorId} onValueChange={(value) => setFormData(prev => ({ ...prev, instructorId: value }))}>
                          <SelectTrigger id="instructor-select" aria-label="Select instructor">
                            <SelectValue placeholder="Select instructor" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {instructors.length === 0 ? (
                              <SelectItem value="no-instructors" disabled>No instructors available</SelectItem>
                            ) : (
                              instructors.map(instructor => (
                                <SelectItem key={instructor._id} value={instructor._id}>
                                  {instructor.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="room-select">Room</Label>
                        <Select value={formData.roomId} onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}>
                          <SelectTrigger id="room-select" aria-label="Select room">
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {rooms.map(room => (
                              <SelectItem key={room._id} value={room._id}>
                                {room.name} - {room.building}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="day-select">Day of Week</Label>
                        <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}>
                          <SelectTrigger id="day-select" aria-label="Select day of week">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {daysOfWeek.map(day => (
                              <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-time-select">Start Time</Label>
                        <Select value={formData.startTime} onValueChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}>
                          <SelectTrigger id="start-time-select" aria-label="Select start time">
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {timeSlots.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time-select">End Time</Label>
                        <Select value={formData.endTime} onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}>
                          <SelectTrigger id="end-time-select" aria-label="Select end time">
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {timeSlots.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="semester-select">Semester</Label>
                        <Select value={formData.semester} onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}>
                          <SelectTrigger id="semester-select" aria-label="Select semester">
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {semesters.map(semester => (
                              <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year-input">Year</Label>
                        <Input
                          id="year-input"
                          type="number"
                          value={formData.year}
                          onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                          aria-label="Enter year"
                          min={2023}
                          max={2050}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-gray-900 hover:bg-gray-800 text-white">
                        {submitting ? <LoadingSpinner size="sm" /> : 'Create Schedule'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search schedules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent 
                className="bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden animate-in fade-in-0 zoom-in-95"
                position="popper"
                sideOffset={5}
              >
                <div className="p-1">
                  <SelectItem value="all" className="rounded-sm hover:bg-gray-100 cursor-pointer transition-colors">All Status</SelectItem>
                  <SelectItem value="published" className="rounded-sm hover:bg-gray-100 cursor-pointer transition-colors">Published</SelectItem>
                  <SelectItem value="draft" className="rounded-sm hover:bg-gray-100 cursor-pointer transition-colors">Draft</SelectItem>
                  <SelectItem value="conflict" className="rounded-sm hover:bg-gray-100 cursor-pointer transition-colors">Conflicts</SelectItem>
                  <SelectItem value="canceled" className="rounded-sm hover:bg-gray-100 cursor-pointer transition-colors">Canceled</SelectItem>
                </div>
              </SelectContent>
            </Select>
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map(semester => (
                  <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedules Table */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="font-semibold">Course</TableHead>
                  <TableHead className="font-semibold">Instructor</TableHead>
                  <TableHead className="font-semibold">Room</TableHead>
                  <TableHead className="font-semibold">Schedule</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((schedule) => (
                  <TableRow key={schedule._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-semibold text-gray-900">{schedule.courseCode}</div>
                        <div className="text-sm text-gray-500">{schedule.courseName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700">{schedule.instructorName}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{schedule.roomName}</div>
                        <div className="text-xs text-gray-500">{schedule.building}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{schedule.dayOfWeek}</div>
                        <div className="text-xs text-gray-500">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.status === 'published' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          published
                        </Badge>
                      )}
                      {schedule.status === 'draft' && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          draft
                        </Badge>
                      )}
                      {schedule.status === 'conflict' && (
                        <div>
                          <Badge className="bg-red-100 text-red-800 cursor-pointer" onClick={() => {
                            setSelectedSchedule(schedule);
                            setConflictDetails(schedule.conflicts || []);
                            setShowConflictDialog(true);
                          }}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            conflict
                          </Badge>
                          {schedule.conflicts?.length > 0 && (
                            <div className="text-xs text-red-600 mt-1 cursor-pointer hover:underline" onClick={() => {
                              setSelectedSchedule(schedule);
                              setConflictDetails(schedule.conflicts || []);
                              setShowConflictDialog(true);
                            }}>
                              {schedule.conflicts.length} conflict(s)
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openViewDialog(schedule)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(schedule)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSchedule(schedule._id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSchedules.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No schedules found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Schedule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        {showEditDialog && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />}
        <DialogContent className="relative max-w-2xl bg-white z-50">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>Update schedule information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSchedule} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Instructor</Label>
                <Select value={formData.instructorId} onValueChange={(value) => setFormData(prev => ({ ...prev, instructorId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {instructors.length === 0 ? (
                      <SelectItem value="no-instructors" disabled>No instructors available</SelectItem>
                    ) : (
                      instructors.map(instructor => (
                        <SelectItem key={instructor._id} value={instructor._id}>
                          {instructor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room</Label>
                <Select value={formData.roomId} onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {rooms.map(room => (
                      <SelectItem key={room._id} value={room._id}>
                        {room.name} - {room.building}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {daysOfWeek.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={formData.startTime} onValueChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select value={formData.endTime} onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-gray-900 hover:bg-gray-800 text-white">
                {submitting ? <LoadingSpinner size="sm" /> : 'Update Schedule'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Schedule Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        {showViewDialog && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />}
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader className="pb-2">
            <DialogTitle>Schedule Details</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Course</Label>
                  <p className="text-sm font-medium mt-1">{selectedSchedule.courseCode} - {selectedSchedule.courseName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Instructor</Label>
                  <p className="text-sm mt-1">{selectedSchedule.instructorName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Room</Label>
                  <p className="text-sm mt-1">{selectedSchedule.roomName} - {selectedSchedule.building}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Schedule</Label>
                  <p className="text-sm mt-1">{selectedSchedule.dayOfWeek}, {selectedSchedule.startTime} - {selectedSchedule.endTime}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Semester</Label>
                  <p className="text-sm mt-1">{selectedSchedule.semester} {selectedSchedule.year}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="mt-1">
                    {selectedSchedule.status === 'published' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        published
                      </Badge>
                    )}
                    {selectedSchedule.status === 'draft' && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        draft
                      </Badge>
                    )}
                    {selectedSchedule.status === 'conflict' && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        conflict
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {selectedSchedule.conflicts.length > 0 && (
                <div>
                  <Label className="text-gray-500">Conflicts</Label>
                  <div className="mt-2 space-y-2">
                    {selectedSchedule.conflicts.map((conflict, index) => (
                      <div key={index} className="text-sm text-red-600 flex items-center gap-2 p-2 bg-red-50 rounded">
                        <AlertTriangle className="h-4 w-4" />
                        {conflict}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Conflict Alert Dialog */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        {showConflictDialog && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />}
        <AlertDialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-xl z-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Schedule Conflicts Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2">
              <div className="text-gray-600 mb-4">
                The following conflicts were found with existing schedules:
              </div>
              <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                {selectedSchedule && (
                  <div className="p-4 bg-white border border-gray-200 rounded-md mb-4 sticky top-0 z-10 shadow-sm">
                    <h3 className="font-medium text-gray-900 mb-2">Current Schedule</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Course:</span>
                        <div className="font-medium">{selectedSchedule.courseName} ({selectedSchedule.courseCode})</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Instructor:</span>
                        <div className="font-medium">{selectedSchedule.instructorName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Room:</span>
                        <div className="font-medium">{selectedSchedule.roomName} ({selectedSchedule.building})</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <div className="font-medium">{selectedSchedule.dayOfWeek}, {selectedSchedule.startTime} - {selectedSchedule.endTime}</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2 overflow-y-auto">
                  {conflictDetails.map((conflict, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-red-700">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Conflict {index + 1}</div>
                        <div className="text-sm mt-1">{conflict}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2 text-amber-700">
                  <Info className="h-5 w-5" />
                  <span className="font-medium">Suggestion</span>
                </div>
                <p className="mt-2 text-sm text-amber-700">
                  Consider choosing a different time slot or checking the instructor's availability.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setShowConflictDialog(false);
              if (showEditDialog) setShowEditDialog(false);
              if (showCreateDialog) setShowCreateDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={async () => {
                setShowConflictDialog(false);
                // If we're editing, force save with conflicts
                if (showEditDialog && selectedSchedule) {
                  const payload = {
                    ...formData,
                    year: Number(formData.year),
                    academicYear: `${formData.year}-${formData.year + 1}`,
                    forceUpdate: true,
                    status: 'conflict'
                  };
                  try {
                    const res = await apiService.updateSchedule(selectedSchedule._id, payload);
                    if (res?.success) {
                      toast.success('Schedule updated with conflicts');
                      setShowEditDialog(false);
                      setSelectedSchedule(null);
                      resetForm();
                      await loadScheduleData();
                    }
                  } catch (error) {
                    console.error('Force update error:', error);
                    toast.error('Failed to update schedule');
                  }
                } else if (showCreateDialog) {
                  // Create new schedule with conflicts
                  try {
                    const newSchedule = {
                      ...formData,
                      year: Number(formData.year),
                      academicYear: `${formData.year}-${formData.year + 1}`,
                      forceCreate: true,
                      status: 'conflict'
                    };
                    const res = await apiService.createSchedule(newSchedule);
                    if (res?.success) {
                      toast.success('Schedule created with conflicts');
                      setShowCreateDialog(false);
                      resetForm();
                      await loadScheduleData();
                    }
                  } catch (error) {
                    console.error('Force create error:', error);
                    toast.error('Failed to create schedule');
                  }
                }
              }}
            >
              Save with Conflicts
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}