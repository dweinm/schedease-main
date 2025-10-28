import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Download, FileEdit, Search } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Label } from '../ui/label';

interface Student {
  _id: string;
  userId: {
    name: string;
    email: string;
    department: string;
  };
  year: string;
  section: string;
  studentId: string;
}

const yearNames = {
  '1': 'First Year',
  '2': 'Second Year',
  '3': 'Third Year',
  '4': 'Fourth Year'
};

const terms = ['First Term', 'Second Term', 'Third Term'];

const sections = {
  '1': ['1A', '1B'],
  '2': ['2A', '2B'],
  '3': ['3A', '3B'],
  '4': ['4A', '4B']
};

export function StudentsManagement() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTerm, setActiveTerm] = useState(terms[0]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  // Fetch students from the backend
  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      } else {
        toast.error(data.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch current academic year
  const fetchAcademicYear = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/academic-year', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch academic year');

      const data = await response.json();
      if (data.success) {
        setCurrentAcademicYear(data.academicYear);
      }
    } catch (error) {
      console.error('Error fetching academic year:', error);
    }
  };

  // Function to handle student data export
  const exportToExcel = () => {
    // Prepare data for export
    const exportData = students.map(student => ({
      'Student ID': student.studentId,
      'Name': student.userId.name,
      'Email': student.userId.email,
      'Department': student.userId.department,
      'Year': yearNames[student.year as keyof typeof yearNames],
      'Section': student.section
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Save file
    XLSX.writeFile(wb, `students_${currentAcademicYear}.xlsx`);
  };

  // Function to handle student updates
  const handleUpdateStudent = async (updatedData: Partial<Student>) => {
    if (!editingStudent) return;

    try {
      const response = await fetch(`http://localhost:3001/api/admin/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error('Failed to update student');

      const data = await response.json();
      if (data.success) {
        toast.success('Student updated successfully');
        fetchStudents(); // Refresh the list
        setIsEditDialogOpen(false);
        setEditingStudent(null);
      } else {
        toast.error(data.message || 'Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    }
  };

  // Filter and search functionality
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery.toLowerCase() === '' ||
      student.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.userId.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = filterYear === 'all' || student.year === filterYear;
    const matchesSection = filterSection === 'all' || student.section === filterSection;
    const matchesDepartment = filterDepartment === 'all' || 
      student.userId.department.toLowerCase() === filterDepartment.toLowerCase();

    return matchesSearch && matchesYear && matchesSection && matchesDepartment;
  });

  useEffect(() => {
    fetchStudents();
    fetchAcademicYear();

    // Extract unique departments from students
    const uniqueDepartments = [...new Set(students.map(s => s.userId.department))];
    setDepartments(uniqueDepartments);
  }, []);

  // Group students by year
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const year = student.year;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  // Further group students by section within each year
  const getStudentsBySection = (yearStudents: Student[], section: string) => {
    return yearStudents?.filter(student => student.section === section) || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Students Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Academic Year: {currentAcademicYear}
          </div>
          <Button
            onClick={exportToExcel}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {Object.entries(yearNames).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'].map((section) => (
              <SelectItem key={section} value={section}>Section {section}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue={terms[0]} className="w-full">
        <TabsList>
          {terms.map((term) => (
            <TabsTrigger
              key={term}
              value={term}
              onClick={() => setActiveTerm(term)}
            >
              {term}
            </TabsTrigger>
          ))}
        </TabsList>

        {terms.map((term) => (
          <TabsContent key={term} value={term}>
            <div className="grid gap-6">
              {Object.keys(yearNames).map((year) => (
                <Card key={year}>
                  <CardHeader>
                    <CardTitle>{yearNames[year as keyof typeof yearNames]}</CardTitle>
                    <CardDescription>
                      Students enrolled in {yearNames[year as keyof typeof yearNames]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {sections[year as keyof typeof sections].map((section) => (
                        <Card key={section}>
                          <CardHeader>
                            <CardTitle className="text-lg">Section {section}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Student ID</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Department</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getStudentsBySection(groupedStudents[year] || [], section).map((student) => (
                                  <TableRow key={student._id}>
                                    <TableCell>{student.studentId}</TableCell>
                                    <TableCell>{student.userId.name}</TableCell>
                                    <TableCell>{student.userId.department}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingStudent(student);
                                          setIsEditDialogOpen(true);
                                        }}
                                      >
                                        <FileEdit className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {getStudentsBySection(groupedStudents[year] || [], section).length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                      No students in this section
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student Details</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-year">Year</Label>
                <Select
                  value={editingStudent.year}
                  onValueChange={(value) => setEditingStudent({
                    ...editingStudent,
                    year: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(yearNames).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-section">Section</Label>
                <Select
                  value={editingStudent.section}
                  onValueChange={(value) => setEditingStudent({
                    ...editingStudent,
                    section: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections[editingStudent.year as keyof typeof sections].map((section) => (
                      <SelectItem key={section} value={section}>Section {section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={editingStudent.userId.department}
                  onChange={(e) => setEditingStudent({
                    ...editingStudent,
                    userId: {
                      ...editingStudent.userId,
                      department: e.target.value
                    }
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleUpdateStudent(editingStudent!)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}