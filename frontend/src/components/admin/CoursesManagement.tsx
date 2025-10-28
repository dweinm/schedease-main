import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface Course {
  _id?: string;
  id?: string;
  courseCode: string;
  courseName: string;
  department: string;
  credits: number;
  type: string;
  duration: number;
  instructor?: string;
  capacity?: number;
}

export function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<Course>({
    courseCode: '',
    courseName: '',
    department: '',
    credits: 3,
    type: 'lecture',
    duration: 90,
    capacity: 30
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCourses();
      // Map backend fields to frontend fields
      const mappedCourses = (response.courses || response.data || []).map((course: any) => ({
        ...course,
        courseCode: course.code,
        courseName: course.name,
      }));
      setCourses(mappedCourses);
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        code: formData.courseCode,
        name: formData.courseName,
        department: formData.department,
        credits: formData.credits,
        type: formData.type,
        duration: formData.duration,
        requiredCapacity: formData.capacity,
        instructor: formData.instructor,
      };

      if (editingCourse) {
        await apiService.updateCourse(editingCourse._id || editingCourse.id || '', payload);
        toast.success('Course updated successfully');
      } else {
        await apiService.createCourse(payload);
        toast.success('Course created successfully');
      }
      
      setIsDialogOpen(false);
      setEditingCourse(null);
      resetForm();
      loadCourses();
    } catch (error) {
      console.error('Failed to save course:', error);
      toast.error('Failed to save course');
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      courseCode: course.courseCode || course.courseCode || '',
      courseName: course.courseName || course.courseName || '',
      department: course.department || '',
      credits: course.credits || 3,
      type: course.type || 'lecture',
      duration: course.duration || 90,
      capacity: course.capacity ?? 30,
      instructor: course.instructor || '',
      _id: course._id,
      id: course.id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await apiService.deleteCourse(courseId);
        toast.success('Course deleted successfully');
        loadCourses();
      } catch (error) {
        console.error('Failed to delete course:', error);
        toast.error('Failed to delete course');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      courseCode: '',
      courseName: '',
      department: '',
      credits: 3,
      type: 'lecture',
      duration: 90,
      capacity: 30
    });
  };

  const openCreateDialog = () => {
    setEditingCourse(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredCourses = courses.filter(course =>
    course.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'lab': return 'bg-green-100 text-green-800';
      case 'seminar': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Management</CardTitle>
          <CardDescription>
            Manage academic courses, their details, and scheduling requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white">
                <DialogHeader>
                  <DialogTitle>
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCourse ? 'Update course information' : 'Create a new course'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="courseCode">Course Code</Label>
                      <Input
                        id="courseCode"
                        value={formData.courseCode}
                        onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                        placeholder="CS101"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                        min="1"
                        max="6"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      placeholder="Introduction to Computer Science"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Computer Science"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="lecture">Lecture</SelectItem>
                          <SelectItem value="lab">Laboratory</SelectItem>
                          <SelectItem value="seminar">Seminar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        min="30"
                        max="240"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white">
                      {editingCourse ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course._id || course.id}>
                    <TableCell className="font-medium">{course.courseCode}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell>{course.department}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(course.type)}>
                        {course.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>{course.duration} min</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(course._id || course.id || '')}
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

          {filteredCourses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No courses found matching your search.' : 'No courses available.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}