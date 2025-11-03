import { useEffect, useMemo, useState } from 'react';
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
import { Input } from '../ui/input';
import { toast } from 'sonner';
import apiService from '../services/api';

interface EnrolledRow {
  _id?: string;
  studentId?: string;
  studentName?: string;
  yearLevel?: string;
  section?: string;
  department?: string;
  courseId?: string;
  courseCode?: string;
  courseName?: string;
  instructorId?: string;
  instructorName?: string;
  scheduleId?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  semester?: string;
}

export default function AdminEnrollments() {
  const [rows, setRows] = useState<EnrolledRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const res: any = await apiService.getEnrollments();
      // backend: { success: true, enrollments: [...] }
      const data = res?.enrollments || res?.data || res?.enrolls || res || [];

      // Normalize to EnrolledRow
      const normalized: EnrolledRow[] = (data || []).map((e: any) => ({
        _id: e._id || e.id,
        studentId: e.studentId?._id || e.studentId || e.student?._id || e.student?.id,
        studentName: e.studentId?.userId?.name || e.studentId?.name || e.student?.userId?.name || e.student?.name || e.studentName || e.student_name,
        yearLevel: e.yearLevel || e.year || e.studentId?.year || e.student?.year,
        section: e.section || e.studentId?.section || e.student?.section,
        department: e.studentId?.userId?.department || e.student?.department || e.studentId?.department,
        courseId: e.courseId?._id || e.courseId || e.course?._id || e.course?.id,
        courseCode: e.courseId?.code || e.course?.code || e.courseCode || e.course_code,
        courseName: e.courseId?.name || e.course?.name || e.courseName || e.course_name,
        instructorId: e.instructorId?._id || e.instructorId || e.instructor?._id || e.instructor?.id,
        instructorName: e.instructorId?.userId?.name || e.instructor?.name || e.instructorName || e.instructor?.user?.name,
        scheduleId: e.scheduleId?._id || e.scheduleId || e.schedule?._id || e.schedule?.id,
        dayOfWeek: e.scheduleId?.dayOfWeek || e.schedule?.dayOfWeek || e.dayOfWeek || e.schedule?.day || e.scheduleDay,
        startTime: e.scheduleId?.startTime || e.schedule?.startTime || e.startTime,
        endTime: e.scheduleId?.endTime || e.schedule?.endTime || e.endTime,
        semester: e.scheduleId?.semester || e.schedule?.semester || e.semester,
      }));

      setRows(normalized);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
      toast.error('Failed to load enrollments');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const years = useMemo(() => {
    const items = rows.map(r => r.yearLevel).filter((v): v is string => !!v);
    const s = new Set<string>(items);
    return ['all', ...Array.from(s)];
  }, [rows]);

  const sections = useMemo(() => {
    const s = new Set(rows.map(r => (r.section || '').toString()).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [rows]);

  const departments = useMemo(() => {
    const s = new Set(rows.map(r => (r.department || '').toString()).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter(r => (filterYear === 'all' || !filterYear || String(r.yearLevel) === String(filterYear)))
      .filter(r => (filterSection === 'all' || !filterSection || String(r.section) === String(filterSection)))
      .filter(r => (filterDepartment === 'all' || !filterDepartment || String((r.department || '').toUpperCase()) === String((filterDepartment || '').toUpperCase())))
      .filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          String(r.studentName || '').toLowerCase().includes(q) ||
          String(r.courseCode || '').toLowerCase().includes(q) ||
          String(r.courseName || '').toLowerCase().includes(q) ||
          String(r.instructorName || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // sort by year -> section -> studentName
        if (a.yearLevel !== b.yearLevel) return (a.yearLevel || '').localeCompare(b.yearLevel || '');
        if (a.section !== b.section) return (a.section || '').localeCompare(b.section || '');
        return (a.studentName || '').localeCompare(b.studentName || '');
      });
  }, [rows, filterYear, filterSection, filterDepartment, search]);

  const scheduleSummary = useMemo(() => {
    // group by scheduleId and return unique schedules with small summary
    const map = new Map<string, any>();
    for (const r of filtered) {
      const key = r.scheduleId || `${r.courseId}_${r.instructorId}`;
      if (!map.has(key)) {
        map.set(key, {
          scheduleId: r.scheduleId,
          courseCode: r.courseCode,
          courseName: r.courseName,
          instructorName: r.instructorName,
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
          semester: r.semester,
          count: 1
        });
      } else {
        (map.get(key).count)++;
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const exportCSV = () => {
    const headers = ['Student Name','Year','Section','Department','Course Code','Course Name','Instructor','Day','Start','End','Semester'];
    const lines = [headers.join(',')];
    for (const r of filtered) {
      const row = [
        `"${(r.studentName||'').replace(/"/g,'""')}"`,
        r.yearLevel || '',
        r.section || '',
        `"${(r.department||'').replace(/"/g,'""')}"`,
        r.courseCode || '',
        `"${(r.courseName||'').replace(/"/g,'""')}"`,
        `"${(r.instructorName||'').replace(/"/g,'""')}"`,
        r.dayOfWeek || '',
        r.startTime || '',
        r.endTime || '',
        r.semester || ''
      ];
      lines.push(row.join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollments_export_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Enrollments</CardTitle>
              <CardDescription>View enrolled students and their schedules</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Search by student or course..." value={search} onChange={(e:any) => setSearch(e.target.value)} />
              <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
              <Button onClick={loadEnrollments}>Refresh</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Year</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All years" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y === 'all' ? 'All Years' : y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Section</label>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s} value={s}>{s === 'all' ? 'All Sections' : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All departments" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d} value={d}>{d === 'all' ? 'All Departments' : d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => { setFilterYear('all'); setFilterSection('all'); setFilterDepartment('all'); setSearch(''); }}>Clear Filters</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Semester</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-6">Loading...</TableCell>
                      </TableRow>
                    )}
                    {!loading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-6">No enrollments found</TableCell>
                      </TableRow>
                    )}
                    {filtered.map(r => (
                      <TableRow key={r._id || `${r.studentId}_${r.scheduleId}_${r.courseId}`}>
                        <TableCell>{r.studentName}</TableCell>
                        <TableCell>{r.yearLevel}</TableCell>
                        <TableCell>{r.section}</TableCell>
                        <TableCell>{r.department}</TableCell>
                        <TableCell>{r.courseCode}</TableCell>
                        <TableCell>{r.courseName}</TableCell>
                        <TableCell>{r.instructorName}</TableCell>
                        <TableCell>{r.dayOfWeek}</TableCell>
                        <TableCell>{r.startTime}</TableCell>
                        <TableCell>{r.endTime}</TableCell>
                        <TableCell>{r.semester}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Summary</CardTitle>
                  <CardDescription>Summary of schedules in current view</CardDescription>
                </CardHeader>
                <CardContent>
                  {scheduleSummary.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground">No schedules</div>
                  )}
                  {scheduleSummary.map((s: any, i: number) => (
                    <div key={i} className="mb-3 p-2 border rounded">
                      <div className="font-medium">{s.courseCode || s.courseName}</div>
                      <div className="text-sm text-muted-foreground">{s.courseName}</div>
                      <div className="text-sm mt-1">{s.instructorName}</div>
                      <div className="text-sm">{s.dayOfWeek} {s.startTime}-{s.endTime}</div>
                      <div className="text-sm text-muted-foreground">{s.semester}</div>
                      <div className="text-xs text-muted-foreground mt-1">Students: {s.count}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
