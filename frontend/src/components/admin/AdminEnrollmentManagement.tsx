import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { FileDown, Search } from 'lucide-react';
import { apiClient } from '../../lib/api';
import type { EnrolledStudent, ScheduleSummary, EnrollmentFilters } from '../../types/enrollment';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import Papa from 'papaparse';

export function AdminEnrollmentManagement() {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EnrollmentFilters>({
    yearLevel: 'all',
    section: 'all',
    department: 'all',
    search: '',
    semester: 'all'
  });
  const [scheduleSummaries, setScheduleSummaries] = useState<ScheduleSummary[]>([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);

  // --- New enrollment UI state ---
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  interface Student {
    docId: string;
    userId: string | null;
    name: string;
    year: string;
    yearLevel?: string;
    section: string;
    department: string;
    email: string;
  }
  
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [filterYearLevel, setFilterYearLevel] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [loadingEnrollPanel, setLoadingEnrollPanel] = useState(false);

  useEffect(() => {
    loadEnrolledStudents();
  }, [filters]);

  // load schedules and students for enrollment panel on mount
  useEffect(() => {
    loadEnrollmentLookups();
  }, []);

  const loadEnrolledStudents = async () => {
    try {
      setLoading(true);
      
      // Load enrolled students and schedules in parallel
      const [enrolled, schedules] = await Promise.all([
        apiClient.getEnrollments(),
        apiClient.getSchedules()
      ]);
      
      console.debug('Raw enrollments response:', enrolled);
      console.debug('Raw schedules response:', schedules);

      // Extract enrollments and build schedule enrollment counts map
      const enrollmentsList = enrolled?.enrollments || [];
      const enrollmentsBySchedule = new Map();
      
      // Map to normalized structure and build schedule counts
      const normalizedEnrolledStudents: EnrolledStudent[] = enrollmentsList.map((e: any) => {
        // Extract all relevant objects
        const student = e.studentId || e.student || {};
        const studentUser = student.userId || student.user || {};
        const course = e.courseId || e.course || {};
        const schedule = e.scheduleId || e.schedule || {};
        const instructor = e.instructorId || schedule.instructor || {};
        const instructorUser = instructor.userId || instructor.user || {};
        
        // Track enrollments per schedule
        const scheduleId = schedule._id || schedule.id || e.scheduleId;
        if (scheduleId) {
          const currentCount = enrollmentsBySchedule.get(scheduleId) || 0;
          enrollmentsBySchedule.set(scheduleId, currentCount + 1);
        }

        const normalized = {
          id: e._id || e.id || '',
          studentId: student._id || student.id || e.studentId || '',
          studentName: studentUser.name || student.name || e.studentName || 'Unknown Student',
          yearLevel: student.yearLevel || student.year || studentUser.yearLevel || e.yearLevel || '1',
          section: student.section || studentUser.section || e.section || '',
          department: studentUser.department || student.department || e.department || '',
          courseId: course._id || course.id || e.courseId || '',
          courseCode: course.code || course.courseCode || e.courseCode || '',
          courseName: course.name || course.courseName || e.courseName || '',
          scheduleId: scheduleId || '',
          instructorName: instructorUser.name || instructor.name || e.instructorName || '',
          dayOfWeek: schedule.dayOfWeek || e.dayOfWeek || '',
          startTime: schedule.startTime || e.startTime || '',
          endTime: schedule.endTime || e.endTime || '',
          semester: schedule.semester || e.semester || '',
          academicYear: schedule.academicYear || schedule.year || e.academicYear || ''
        };

        console.debug('Normalized enrollment:', normalized);
        return normalized;
      });

      // Process schedules with accurate enrollment counts
      const schedulesList = schedules?.schedules || [];
      console.debug('Processing schedules:', schedulesList);

      const normalizedSummaries: ScheduleSummary[] = schedulesList.map((s: any) => {
        const scheduleId = s._id || s.id;
        const course = s.courseId || s.course || {};
        const instructor = s.instructorId || s.instructor || {};
        const instructorUser = instructor.userId || instructor.user || {};
        const room = s.roomId || s.room || {};

        const normalized = {
          id: scheduleId,
          courseId: course._id || course.id || s.courseId || '',
          courseCode: course.code || s.courseCode || '',
          courseName: course.name || s.courseName || '',
          instructorName: instructorUser.name || instructor.name || s.instructorName || '',
          roomName: room.name || s.roomName || '',
          dayOfWeek: s.dayOfWeek || s.day || '',
          startTime: s.startTime || s.start || '',
          endTime: s.endTime || s.end || '',
          semester: s.semester || '',
          academicYear: s.academicYear || s.year || '',
          // Use our tracked count or fallback to API-provided count
          enrolledCount: enrollmentsBySchedule.get(scheduleId) || s.enrolledCount || 0
        };

        console.debug('Normalized schedule with count:', {
          scheduleId,
          count: normalized.enrolledCount,
          trackedCount: enrollmentsBySchedule.get(scheduleId),
          apiCount: s.enrolledCount
        });
        
        return normalized;
      });

      setEnrolledStudents(normalizedEnrolledStudents);
      setScheduleSummaries(normalizedSummaries);
    } catch (error) {
      console.error('Failed to load enrollment data:', error);
      toast.error('Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    try {
      const csvData = Papa.unparse(enrolledStudents.map(student => ({
        'Student Name': student.studentName,
        'Year Level': student.yearLevel,
        'Section': student.section,
        'Department': student.department,
        'Course Code': student.courseCode,
        'Course Name': student.courseName,
        'Instructor': student.instructorName,
        'Day': student.dayOfWeek,
        'Time': `${student.startTime}-${student.endTime}`,
        'Semester': student.semester,
        'Academic Year': student.academicYear
      })));

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `enrolled-students-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  useEffect(() => {
    // apply filters locally to the admin students list
    const result = (allStudents || []).filter((s: any) => {
      // For year level, check both the year field and if it matches the first digit of section
      const studentYear = String(s.year || s.yearLevel || '');
      const sectionYear = (s.section || '').charAt(0);
      const yearMatches = filterYearLevel === 'all' || 
                         studentYear === String(filterYearLevel) ||
                         sectionYear === String(filterYearLevel);

      // For section, check exact match with new format (e.g., "1A", "2B")
      const matchesSection = filterSection === 'all' || 
                           (s.section || '').trim() === filterSection;

      // For department, normalize case and trim
      const studentDept = (s.department || '').trim();
      const matchesDept = filterDepartment === 'all' || 
                         studentDept.toLowerCase() === filterDepartment.toLowerCase();

      return yearMatches && matchesSection && matchesDept;
    });
    setFilteredStudents(result);
    // reset selected ids if they are not in filtered set
    setSelectedStudentIds(prev => {
      const next = new Set(Array.from(prev).filter(id => result.some((r: any) => (r._id === id || r.id === id))));
      return next;
    });
  }, [allStudents, filterYearLevel, filterSection, filterDepartment]);

  // loadEnrollments is now replaced by loadEnrolledStudents

  const loadEnrollmentLookups = async () => {
    setLoadingEnrollPanel(true);
    try {
      // Load schedules and students in parallel
      const [schedulesResponse, studentsResponse] = await Promise.all([
        apiClient.getSchedules().catch((err: Error) => {
          console.error('Failed to load schedules:', err);
          return null;
        }),
        apiClient.getAdminStudents().catch((err: Error) => {
          console.error('Failed to load students:', err);
          return null;
        })
      ]);

      console.debug('Raw schedules response:', schedulesResponse);
      console.debug('Raw students response:', studentsResponse);

      // Process schedules
      if (schedulesResponse?.success) {
        const schedulesList = schedulesResponse.schedules || [];
        console.debug('Processing schedules:', schedulesList);

        const normalized = schedulesList.map((s: any) => {
          // Extract nested objects
          const course = s.course || {};
          const instructor = s.instructor || {};
          const instructorUser = instructor.user || instructor.userId || {};
          const room = s.room || {};

          const scheduleId = s._id || s.id;
          return {
            _id: scheduleId,
            courseId: course._id || course.id || s.courseId || '',
            courseCode: course.code || s.courseCode || '',
            courseName: course.name || s.courseName || '',
            instructorId: instructor._id || instructor.id || s.instructorId || '',
            instructorName: instructorUser.name || instructor.name || s.instructorName || '',
            roomName: room.name || s.roomName || '',
            dayOfWeek: s.dayOfWeek || s.day || '',
            startTime: s.startTime || s.start || '',
            endTime: s.endTime || s.end || '',
            semester: s.semester || s.academicTerm || '',
            year: s.year || s.academicYear || '',
            active: s.status !== 'canceled'
          };
        });

        console.debug('Normalized schedules:', normalized);
        setSchedules(normalized);
      } else {
        toast.error('Failed to load schedules. Please try again.');
        setSchedules([]);
      }

      // Process students
      if (studentsResponse?.success && studentsResponse.students) {
        const studentsList = studentsResponse.students;
        console.debug('Processing students:', studentsList);

        const normalizedStudents = studentsList.map((st: any) => {
          // Extract user info
          const user = st.user || st.userId || {};

          return {
            docId: st._id || st.id || '',
            userId: user._id || user.id || st.userId || null,
            name: user.name || st.name || '',
            year: st.year || st.yearLevel || user.year || user.yearLevel || '',
            section: st.section || user.section || '',
            department: user.department || st.department || '',
            email: user.email || st.email || ''
          };
        });

        console.debug('Normalized students:', normalizedStudents);
        
        // Filter out incomplete student records
        const validStudents = normalizedStudents.filter((s: { docId: string; name: string }) => s.docId && s.name);
        if (validStudents.length === 0) {
          console.warn('No valid student records found after normalization');
          toast.error('No valid student records found. Please check the data.');
        }
        
        setAllStudents(validStudents);
      } else {
        toast.error('Failed to load students. Please try again.');
        setAllStudents([]);
      }

    } catch (error) {
      console.error('loadEnrollmentLookups error:', error);
      toast.error('Failed to load enrollment data. Please check your connection and try again.');
    } finally {
      setLoadingEnrollPanel(false);
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedStudentIds(new Set(filteredStudents.map(s => s.docId)));
  };

  const clearSelected = () => setSelectedStudentIds(new Set());
  const [enrolling, setEnrolling] = useState(false);

  const handleEnrollSelected = async () => {
    setEnrolling(true);
    if (!selectedSchedule) {
      toast.error('Please select a schedule to enroll students into');
      setEnrolling(false);
      return;
    }
    if (selectedStudentIds.size === 0) {
      toast.error('No students selected for enrollment');
      setEnrolling(false);
      return;
    }

    try {
      const studentIds = Array.from(selectedStudentIds);
      const payload = {
        scheduleId: selectedSchedule._id,
        courseId: selectedSchedule.courseId,
        instructorId: selectedSchedule.instructorId,
        students: studentIds
      };

      console.debug('Enrollment payload:', payload);

      // Use POST /schedules endpoint for enrollment
      const res = await apiClient.createEnrollment(payload) as any;
      
      console.debug('Enrollment response:', res);

      const created = res.created || [];
      const conflicts = res.conflicts || [];
      const createdCount = created.length;
      const conflictCount = conflicts.length;

      if (res && res.success === false) {
        const message = res.message || 'Enrollment failed';
        console.warn('Enrollment API returned failure:', res);
        toast.error(message);
      } else {
        if (createdCount > 0) {
          if (conflictCount > 0) {
            toast.success(
              `Successfully enrolled ${createdCount} student(s). ${conflictCount} conflict(s) detected.`,
              { duration: 5000 }
            );
          } else {
            toast.success(`Successfully enrolled ${createdCount} student(s)`);
          }
          // refresh data immediately
          await loadEnrolledStudents();
        } else if (conflictCount > 0) {
          toast.error(`Failed to enroll students: ${conflictCount} conflict(s) detected.`);
        } else {
          toast.error('No students were enrolled. Please try again.');
        }
      }

      // refresh lookups after showing feedback
      await loadEnrollmentLookups();
      clearSelected();
    } catch (error: any) {
      console.error('Enrollment failed:', error);
      const msg = error?.response?.message || error?.message || 'Failed to enroll students';
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  // Utility function to sort enrolled students
  const sortEnrolledStudents = (a: EnrolledStudent, b: EnrolledStudent) => {
    if (a.yearLevel !== b.yearLevel) return a.yearLevel.localeCompare(b.yearLevel);
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return a.studentName.localeCompare(b.studentName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>View and manage enrolled students across courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Select
              value={filters.yearLevel}
              onValueChange={(value) => setFilters(prev => ({ ...prev, yearLevel: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Year Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1">First Year</SelectItem>
                <SelectItem value="2">Second Year</SelectItem>
                <SelectItem value="3">Third Year</SelectItem>
                <SelectItem value="4">Fourth Year</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.section}
              onValueChange={(value) => setFilters(prev => ({ ...prev, section: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="A">Section A</SelectItem>
                <SelectItem value="B">Section B</SelectItem>
                <SelectItem value="C">Section C</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.department}
              onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="BSIT">BSIT</SelectItem>
                <SelectItem value="BSBA">BSBA</SelectItem>
                <SelectItem value="BSHM">BSHM</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.semester}
              onValueChange={(value) => setFilters(prev => ({ ...prev, semester: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                <SelectItem value="Spring 2026">Spring 2026</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1 min-w-[200px] relative">
              <Input
                placeholder="Search by name or course..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-9"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <Button variant="outline" onClick={handleExportData}>
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Schedule Summary Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Schedule Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduleSummaries.map((schedule) => (
                <Card 
                  key={schedule.id} 
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedSummaryId === schedule.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedSummaryId(schedule.id === selectedSummaryId ? null : schedule.id)}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{schedule.courseCode}</h4>
                        <p className="text-sm text-gray-500">{schedule.courseName}</p>
                      </div>
                      <Badge>{`${schedule.enrolledCount} enrolled`}</Badge>
                    </div>
                    <p className="text-sm">{schedule.instructorName}</p>
                    <p className="text-sm">{`${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}`}</p>
                    <p className="text-sm text-gray-500">{`${schedule.semester} ${schedule.academicYear}`}</p>
                  </div>
                  
                  {selectedSummaryId === schedule.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="font-medium mb-2">Enrolled Students</h5>
                      <div className="max-h-[200px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Year</TableHead>
                              <TableHead>Section</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {enrolledStudents
                              .filter(student => {
                                // Add debug logging to see the IDs being compared
                                console.debug('Comparing schedule IDs:', {
                                  studentScheduleId: student.scheduleId,
                                  scheduleId: schedule.id,
                                  student: student
                                });
                                // Normalize IDs for comparison
                                const normalizedStudentScheduleId = String(student.scheduleId).replace(/[^0-9a-fA-F]/g, '');
                                const normalizedScheduleId = String(schedule.id).replace(/[^0-9a-fA-F]/g, '');
                                return normalizedStudentScheduleId === normalizedScheduleId;
                              })
                              .sort((a, b) => {
                                if (a.yearLevel !== b.yearLevel) return a.yearLevel.localeCompare(b.yearLevel);
                                if (a.section !== b.section) return a.section.localeCompare(b.section);
                                return a.studentName.localeCompare(b.studentName);
                              })
                              .map(student => (
                                <TableRow key={student.id}>
                                  <TableCell className="py-2">{student.studentName}</TableCell>
                                  <TableCell className="py-2">{student.yearLevel}</TableCell>
                                  <TableCell className="py-2">{student.section}</TableCell>
                                </TableRow>
                              ))}
                            {enrolledStudents.filter(student => {
                                const normalizedStudentScheduleId = String(student.scheduleId).replace(/[^0-9a-fA-F]/g, '');
                                const normalizedScheduleId = String(schedule.id).replace(/[^0-9a-fA-F]/g, '');
                                return normalizedStudentScheduleId === normalizedScheduleId;
                              }).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-2 text-gray-500">
                                  No students enrolled
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Enrolled Students Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Semester</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...enrolledStudents].sort(sortEnrolledStudents).map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.studentName}</TableCell>
                  <TableCell>{student.yearLevel}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.courseCode}</div>
                      <div className="text-sm text-gray-500">{student.courseName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{`${student.dayOfWeek} ${student.startTime}-${student.endTime}`}</TableCell>
                  <TableCell>{student.instructorName}</TableCell>
                  <TableCell>{`${student.semester} ${student.academicYear}`}</TableCell>
                </TableRow>
              ))}
              {enrolledStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {loading ? 'Loading...' : 'No enrolled students found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Enroll Students Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Enroll Students</CardTitle>
          <CardDescription>Enroll students into a selected schedule by Year / Section / Department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Select Schedule</label>
              <Select
                value={selectedSchedule?._id || ''}
                onValueChange={(val) => setSelectedSchedule(schedules.find(s => s._id === val) || null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose schedule" />
                </SelectTrigger>
                <SelectContent>
                  {schedules
                    .filter(s => s.active !== false) // Only show active schedules
                    .sort((a, b) => {
                      // Sort by course code, then day of week
                      if (a.courseCode !== b.courseCode) return a.courseCode.localeCompare(b.courseCode);
                      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
                    })
                    .map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {`${s.courseCode} - ${s.courseName} (${s.dayOfWeek} ${s.startTime}-${s.endTime})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Year Level</label>
              <Select value={filterYearLevel} onValueChange={setFilterYearLevel}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {Array.from(new Set(allStudents.map(s => String(s.year || s.yearLevel || '')))).filter(Boolean).map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Section</label>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'].map(sec => (
                    <SelectItem key={sec} value={sec}>{`Section ${sec}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(allStudents
                    .map(s => (s.department || '').trim())
                    .filter(Boolean) // Remove empty values
                    .sort() // Sort alphabetically
                  )).map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={selectAllFiltered}>Select All</Button>
              <Button variant="ghost" onClick={clearSelected}>Clear</Button>
            </div>

            <div className="text-right">
              <Button onClick={handleEnrollSelected} disabled={enrolling || !selectedSchedule || selectedStudentIds.size === 0}>
                {enrolling ? 'Enrolling...' : `Enroll (${selectedStudentIds.size})`}
              </Button>
            </div>
          </div>

          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sel</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Department</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => {
                  const id = s.docId;
                  const checked = selectedStudentIds.has(id);
                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <Checkbox checked={checked} onCheckedChange={() => toggleSelectStudent(id)} />
                      </TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.year}</TableCell>
                      <TableCell>{s.section}</TableCell>
                      <TableCell>{s.department}</TableCell>
                    </TableRow>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">{loadingEnrollPanel ? 'Loading students...' : 'No students found for selected filters'}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}