import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
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
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import apiService from '../services/api';

interface Course {
  _id: string;
  id?: string;
  code: string;
  courseCode?: string;
  name: string;
  courseName?: string;
  description?: string;
  credits?: number;
}

interface Room {
  _id: string;
  id?: string;
  name: string;
  roomName?: string;
  number?: string;
  building: string;
  buildingName?: string;
  capacity?: number;
}

interface Instructor {
  _id: string;
  id: string;
  name: string;
  email: string;
  department: string;
  maxHoursPerWeek?: number;
  specializations?: string[];
  availability?: Record<string, { startTime: string; endTime: string }[]>;
  userId?: {
    _id?: string;
    name: string;
    email?: string;
    department?: string;
  };
  status: string;
}

interface Schedule {
  _id: string;
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
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData>({
    courseId: '',
    instructorId: '',
    roomId: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    semester: 'Fall',
    year: 2024
  });
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    semester: 'Fall',
    year: 2024,
    startDate: '2024-08-26',
    endDate: '2024-12-13',
    avoidConflicts: true,
    maxHoursPerDay: 8
  });
  const [submitting, setSubmitting] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const semesters = ['Spring', 'Summer', 'Fall'];
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
      const [schedulesRes, coursesRes, instructorsRes, roomsRes] = await Promise.all([
        apiService.getSchedules(),
        apiService.getCourses(),
        apiService.getInstructors(),
        apiService.getRooms(),
      ]);

      // Normalize response data with proper error checking
      const schedulesList = Array.isArray(schedulesRes?.data) ? schedulesRes.data 
        : Array.isArray(schedulesRes?.schedules) ? schedulesRes.schedules 
        : Array.isArray(schedulesRes) ? schedulesRes : [];

      const coursesList = Array.isArray(coursesRes?.data) ? coursesRes.data 
        : Array.isArray(coursesRes?.courses) ? coursesRes.courses 
        : Array.isArray(coursesRes) ? coursesRes : [];

      const instructorsList = Array.isArray(instructorsRes?.data) ? instructorsRes.data 
        : Array.isArray(instructorsRes?.instructors) ? instructorsRes.instructors 
        : Array.isArray(instructorsRes) ? instructorsRes : [];

      const roomsList = Array.isArray(roomsRes?.data) ? roomsRes.data 
        : Array.isArray(roomsRes?.rooms) ? roomsRes.rooms 
        : Array.isArray(roomsRes) ? roomsRes : [];

      console.log('Fetched data:', {
        schedules: schedulesList.length,
        courses: coursesList.length,
        instructors: instructorsList.length,
        rooms: roomsList.length
      });

      // Enhanced normalization with proper typing
      const normalizeId = <T extends { _id?: string; id?: string }>(item: T) => ({
        ...item,
        _id: item._id || item.id || '',
        id: item._id || item.id || ''
      });

      const normalizeName = <T extends { name?: string; fullName?: string; userName?: string; userId?: { name: string } | string }>(item: T) => ({
        ...item,
        name: item.name || item.fullName || item.userName || (typeof item.userId === 'object' ? item.userId.name : '') || 'Unknown'
      });

      const coursesN = coursesList.map((course: Partial<Course>) => ({
        ...normalizeId(course),
        code: course.code || course.courseCode || 'N/A',
        name: course.name || course.courseName || 'Unknown Course'
      })) as Course[];

      const roomsN = roomsList.map((room: Partial<Room>) => ({
        ...normalizeId(room),
        name: room.name || room.roomName || room.number || 'Unknown Room',
        building: room.building || room.buildingName || 'Main Building'
      })) as Room[];
      
      // Enhanced instructor normalization with proper typing
      const instructorsN = (instructorsList || []).map((instructor: Partial<Instructor>) => {
        const userId = typeof instructor.userId === 'object' ? instructor.userId : { name: '', email: '', department: '' };
        const normalizedInstructor = {
          _id: instructor._id || instructor.id || '',
          id: instructor._id || instructor.id || '',
          name: userId.name || instructor.name || 'Unknown Instructor',
          email: userId.email || instructor.email || '',
          department: userId.department || instructor.department || '',
          maxHoursPerWeek: instructor.maxHoursPerWeek || 20,
          specializations: instructor.specializations || [],
          availability: instructor.availability || {},
          userId: instructor.userId || null,
          status: instructor.status || 'active'
        };
        
        console.log('Normalized instructor:', normalizedInstructor); // Debug log
        return normalizedInstructor;
      }) as Instructor[];
      
      // Sort instructors by name
      instructorsN.sort((a, b) => a.name.localeCompare(b.name));

      // Normalize schedules: support populated objects or plain ids
      const schedulesNormalized: Schedule[] = (schedulesList || []).map((s: any) => {
        const course = s.courseId;
        const courseId = typeof course === 'string' ? course : (course && (course._id || course.id)) || s.courseId || '';
        const courseCode = (course && (course.code || course.courseCode)) || s.courseCode || '';
        const courseName = (course && (course.name || course.courseName)) || s.courseName || '';

        const instructor = s.instructorId;
        const instructorId = typeof instructor === 'string' ? instructor : (instructor && (instructor._id || instructor.id)) || s.instructorId || '';
        const instructorName = (instructor && (instructor.userId?.name || instructor.name)) || s.instructorName || '';

        const room = s.roomId;
        const roomId = typeof room === 'string' ? room : (room && (room._id || room.id)) || s.roomId || '';
        const roomName = (room && (room.name || room.roomName)) || s.roomName || '';
        const building = (room && room.building) || s.building || '';

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
          conflicts: s.conflicts || [],
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
    setSubmitting(true);
    try {
      // Validate required fields
      if (!formData.courseId || !formData.instructorId || !formData.roomId || 
          !formData.dayOfWeek || !formData.startTime || !formData.endTime) {
        toast.error('All fields are required');
        setSubmitting(false);
        return;
      }

      // Check for conflicts before creating
      const conflicts = detectConflicts(formData);
      if (conflicts.length > 0) {
        toast.error(`Cannot create schedule: ${conflicts.join(', ')}`);
        setSubmitting(false);
        return;
      }

      // Get instructor details for validation
      const selectedInstructor = instructors.find(i => i._id === formData.instructorId || i.id === formData.instructorId);
      if (!selectedInstructor) {
        toast.error('Selected instructor not found');
        setSubmitting(false);
        return;
      }

      // Log selected instructor for debugging
      console.log('Selected instructor:', selectedInstructor);

      const payload = {
        courseId: formData.courseId,
        instructorId: formData.instructorId,
        roomId: formData.roomId,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        semester: formData.semester,
        academicYear: `${formData.year}-${formData.year + 1}`,
      };

      const res = await apiService.createSchedule(payload);
      const created = (res && (res.schedule || res.data || res.created)) ? (res.schedule || res.data || res) : null;

      if (created) {
        toast.success('Schedule created successfully');
        setShowCreateDialog(false);
        resetForm();
        await loadScheduleData();
      } else {
        console.error('Create schedule failed', res);
        toast.error(res?.message || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Create schedule error', error);
      toast.error('Failed to create schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    setSubmitting(true);
    try {
      // Check for conflicts before updating, excluding the current schedule
      const conflicts = detectConflicts(formData, selectedSchedule._id);
      if (conflicts.length > 0) {
        toast.error(`Cannot update schedule: ${conflicts.join(', ')}`);
        return;
      }

      const payload = {
        courseId: formData.courseId,
        instructorId: formData.instructorId,
        roomId: formData.roomId,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        semester: formData.semester,
        academicYear: `${formData.year}-${formData.year + 1}`,
      };

      const res = await apiService.updateSchedule(selectedSchedule._id, payload);
      const updated = (res && (res.schedule || res.data)) ? (res.schedule || res.data) : res;

      if (updated) {
        toast.success('Schedule updated successfully');
        setShowEditDialog(false);
        setSelectedSchedule(null);
        resetForm();
        await loadScheduleData();
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
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const res = await apiService.deleteSchedule(scheduleId);
      const ok = res && (res.success || res.deleted || res.removed);
      if (ok) {
        toast.success('Schedule deleted successfully');
        await loadScheduleData();
      } else {
        console.error('Delete schedule failed', res);
        toast.error(res?.message || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Delete schedule error', error);
      toast.error('Failed to delete schedule');
    }
  };

  const detectConflicts = (scheduleData: ScheduleFormData, excludeId?: string): string[] => {
    const conflicts: string[] = [];
    
    // Helper function to check time overlap
    const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string) => {
      return (start1 >= start2 && start1 < end2) ||
             (end1 > start2 && end1 <= end2) ||
             (start1 <= start2 && end1 >= end2);
    };

    // Check room conflicts
    const roomConflicts = schedules.filter(s => {
      if (s._id === excludeId) return false;
      if (s.roomId !== scheduleData.roomId) return false;
      if (s.dayOfWeek !== scheduleData.dayOfWeek) return false;
      if (s.semester !== scheduleData.semester) return false;
      if (s.year !== scheduleData.year) return false;
      
      return hasTimeOverlap(
        scheduleData.startTime,
        scheduleData.endTime,
        s.startTime,
        s.endTime
      );
    });
    
    if (roomConflicts.length > 0) {
      const conflictDetails = roomConflicts.map(s => 
        `${s.courseCode} (${s.startTime}-${s.endTime})`
      ).join(', ');
      conflicts.push(`Room is already booked during this time: ${conflictDetails}`);
    }
    
    // Check instructor conflicts
    const instructorConflicts = schedules.filter(s => {
      if (s._id === excludeId) return false;
      if (s.instructorId !== scheduleData.instructorId) return false;
      if (s.dayOfWeek !== scheduleData.dayOfWeek) return false;
      if (s.semester !== scheduleData.semester) return false;
      if (s.year !== scheduleData.year) return false;
      
      return hasTimeOverlap(
        scheduleData.startTime,
        scheduleData.endTime,
        s.startTime,
        s.endTime
      );
    });
    
    if (instructorConflicts.length > 0) {
      const conflictDetails = instructorConflicts.map(s => 
        `${s.courseCode} (${s.startTime}-${s.endTime})`
      ).join(', ');
      conflicts.push(`Instructor has another class during this time: ${conflictDetails}`);
    }

    // Check if end time is after start time
    if (scheduleData.endTime <= scheduleData.startTime) {
      conflicts.push('End time must be after start time');
    }
    
    return conflicts;
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      instructorId: '',
      roomId: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      semester: 'Fall',
      year: 2024
    });
  };

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
                      <Button onClick={handleCreateSchedule} disabled={generating} className="bg-gray-900 hover:bg-gray-800 text-white">
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
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white">
                  <DialogHeader>
                    <DialogTitle>Create New Schedule</DialogTitle>
                    <DialogDescription>
                      Add a new class schedule
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSchedule} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Course</Label>
                        <Select value={formData.courseId} onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}>
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
                        <Label>Instructor</Label>
                        <Select value={formData.instructorId} onValueChange={(value) => setFormData(prev => ({ ...prev, instructorId: value }))}>
                          <SelectTrigger>
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
                        <Label>Room</Label>
                        <Select value={formData.roomId} onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}>
                          <SelectTrigger>
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
                        <Label>Day of Week</Label>
                        <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}>
                          <SelectTrigger>
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
                        <Label>Start Time</Label>
                        <Select value={formData.startTime} onValueChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}>
                          <SelectTrigger>
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
                        <Label>End Time</Label>
                        <Select value={formData.endTime} onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}>
                          <SelectTrigger>
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
                        <Label>Semester</Label>
                        <Select value={formData.semester} onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}>
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
                          value={formData.year}
                          onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
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
              <SelectTrigger className="w-48 bg-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="conflict">Conflicts</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
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
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            conflict
                          </Badge>
                          {schedule.conflicts.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
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
        <DialogContent className="max-w-2xl bg-white">
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
        <DialogContent className="bg-white">
          <DialogHeader>
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
    </div>
  );
}