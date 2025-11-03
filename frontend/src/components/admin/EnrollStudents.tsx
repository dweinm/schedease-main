import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { apiService } from './apiService';
import { toast } from 'sonner';

export default function EnrollStudents() {
  const [courses, setCourses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [section, setSection] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
  const cRes = await apiService.getCourses();
  setCourses((cRes?.courses || cRes?.data || []) as any[]);
  const sRes = await apiService.getSchedules();
  setSchedules((sRes?.schedules || sRes?.data || []) as any[]);
  const iRes = await apiService.getInstructors();
  setInstructors((iRes || []) as any[]);
  const stRes = await apiService.getAdminStudents();
  setStudents((stRes?.data || []) as any[]);
      } catch (err) {
        console.error('Failed to load enrollment form data', err);
        toast.error('Failed to load form data');
      }
    })();
  }, []);

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        courseId: selectedCourse,
        scheduleId: selectedSchedule || undefined,
        instructorId: selectedInstructor || undefined,
        yearLevel: yearLevel || undefined,
        section: section || undefined
      };

      if (selectedStudents.length > 0) payload.students = selectedStudents;

      const res = await apiService.createEnrollment(payload);
      console.log('Enrollment response', res);

      if (res.success) {
        toast.success('✅ Student(s) successfully enrolled.');
        // reset form
        setSelectedCourse('');
        setSelectedSchedule('');
        setSelectedInstructor('');
        setYearLevel('');
        setSection('');
        setSelectedStudents([]);
      } else {
        toast.error(res.message || 'Enrollment failed');
      }
    } catch (err: any) {
      console.error('Enrollment error', err);
      const msg = err?.message || (err?.message && typeof err.message === 'string' && err.message) || 'Enrollment failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enroll Students</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Course</Label>
            <Select value={selectedCourse} onValueChange={(v) => setSelectedCourse(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c._id || c.id} value={c._id || c.id}>{c.code} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Schedule (optional)</Label>
            <Select value={selectedSchedule} onValueChange={(v) => setSelectedSchedule(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No schedule</SelectItem>
                {schedules.map(s => (
                  <SelectItem key={s._id || s.id} value={s._id || s.id}>{s.courseName || s.courseCode} - {s.dayOfWeek} {s.startTime}-{s.endTime}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Instructor (optional)</Label>
            <Select value={selectedInstructor} onValueChange={(v) => setSelectedInstructor(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No instructor</SelectItem>
                {instructors.map(i => (
                  <SelectItem key={i._id || i.userId || i.id} value={i._id || i.userId || i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Year Level</Label>
              <Input value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} placeholder="1|2|3|4" />
            </div>
            <div>
              <Label>Section</Label>
              <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="A" />
            </div>
          </div>

          <div>
            <Label>Students (optional — select specific students)</Label>
            <div className="max-h-48 overflow-auto border rounded p-2">
              {students.length === 0 && <div className="text-sm text-muted-foreground">No students found</div>}
              {students.map((s: any) => (
                <label key={s._id || s.id} className="flex items-center gap-2 py-1">
                  <input type="checkbox" checked={selectedStudents.includes(s._id || s.id)} onChange={() => toggleStudent(s._id || s.id)} />
                  <span>{s.name || s.user?.name || s.email} — {s.studentId || s._id}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-gray-900 text-white" disabled={loading}>
              Enroll
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
