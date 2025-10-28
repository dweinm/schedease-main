import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
// Tabs import removed (not used in this file)
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CoursesManagement } from '../admin/CoursesManagement';
import { RoomsManagement } from '../admin/RoomsManagement';
import { SchedulesManagement } from '../admin/SchedulesManagement';
import { UsersManagement } from '../admin/UsersManagement';
import { SystemSettings } from '../admin/SystemSettings';
import { Analytics } from '../admin/Analytics';
import { AdminEnrollmentManagement } from '../admin/AdminEnrollmentManagement';
import { AdminScheduleRequests } from '../admin/AdminScheduleRequests';
import { StudentsManagement } from '../admin/StudentsManagement';
import { 
  LayoutDashboard, 
  BookOpen, 
  MapPin, 
  Calendar, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  BarChart,
  GraduationCap
} from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface DashboardStats {
  totalCourses: number;
  totalRooms: number;
  totalSchedules: number;
  totalUsers: number;
  activeSchedules: number;
  conflictCount: number;
  utilizationRate: number;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const sidebarItems = [
    {
      icon: LayoutDashboard,
      label: 'Overview',
      onClick: () => setActiveTab('overview'),
      active: activeTab === 'overview'
    },
    {
      icon: Users,
      label: 'Enrollments',
      onClick: () => setActiveTab('enrollments'),
      active: activeTab === 'enrollments'
    },
    {
      icon: Clock,
      label: 'Schedule Requests',
      onClick: () => setActiveTab('schedule-requests'),
      active: activeTab === 'schedule-requests'
    },
    {
      icon: BookOpen,
      label: 'Courses',
      onClick: () => setActiveTab('courses'),
      active: activeTab === 'courses'
    },
    {
      icon: MapPin,
      label: 'Rooms',
      onClick: () => setActiveTab('rooms'),
      active: activeTab === 'rooms'
    },
    {
      icon: Calendar,
      label: 'Schedules',
      onClick: () => setActiveTab('schedules'),
      active: activeTab === 'schedules'
    },
    {
      icon: Users,
      label: 'Users',
      onClick: () => setActiveTab('users'),
      active: activeTab === 'users'
    },
    {
      icon: GraduationCap,
      label: 'Students',
      onClick: () => setActiveTab('students'),
      active: activeTab === 'students'
    },
    {
      icon: BarChart,
      label: 'Analytics',
      onClick: () => setActiveTab('analytics'),
      active: activeTab === 'analytics'
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => setActiveTab('settings'),
      active: activeTab === 'settings'
    }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load data from multiple endpoints
      const [coursesRes, roomsRes, schedulesRes] = await Promise.all([
        apiService.getCourses(),
        apiService.getRooms(),
        apiService.getSchedules()
      ]);

      const courses = coursesRes.courses || coursesRes.data || [];
      const rooms = roomsRes.rooms || roomsRes.data || [];
      const schedules = schedulesRes.schedules || schedulesRes.data || [];

      // Calculate stats
      const dashboardStats: DashboardStats = {
        totalCourses: courses.length,
        totalRooms: rooms.length,
        totalSchedules: schedules.length,
        totalUsers: 0, // This would come from a users endpoint
        activeSchedules: schedules.filter((s: any) => s.status === 'active').length,
        conflictCount: schedules.filter((s: any) => s.hasConflict).length,
        utilizationRate: rooms.length > 0 ? Math.round((schedules.length / rooms.length) * 100) : 0
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Dashboard Overview';
      case 'enrollments': return 'Enrollment Management';
      case 'schedule-requests': return 'Schedule Requests';
      case 'courses': return 'Course Management';
      case 'rooms': return 'Room Management';
      case 'schedules': return 'Schedule Management';
      case 'users': return 'User Management';
      case 'analytics': return 'Analytics & Reports';
      case 'settings': return 'System Settings';
      case 'students': return 'Student Management';
      default: return 'Admin Dashboard';
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { value: number; isPositive: boolean };
    color?: 'blue' | 'green' | 'orange' | 'red';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const OverviewContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (!stats) {
      return (
        <div className="text-center text-muted-foreground">
          No data available
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Courses"
            value={stats.totalCourses}
            description="Active courses this semester"
            icon={BookOpen}
            trend={{ value: 12, isPositive: true }}
            color="blue"
          />
          <StatCard
            title="Total Rooms"
            value={stats.totalRooms}
            description="Available rooms"
            icon={MapPin}
            trend={{ value: 3, isPositive: true }}
            color="green"
          />
          <StatCard
            title="Scheduled Classes"
            value={stats.totalSchedules}
            description="Classes scheduled"
            icon={Calendar}
            trend={{ value: 8, isPositive: true }}
            color="orange"
          />
          <StatCard
            title="Conflicts"
            value={stats.conflictCount}
            description="Scheduling conflicts"
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* System Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Database</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Scheduling Engine</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Conflict Detection</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Running</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>• New course CS301 added</div>
                <div>• Room A101 updated</div>
                <div>• 3 schedules modified</div>
                <div>• Conflict resolved in Building B</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('courses')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Add New Course
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('schedules')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Generate Schedule
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('rooms')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Manage Rooms
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Room Utilization Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Room Utilization Analytics</CardTitle>
            <CardDescription>
              Current utilization rate: {stats.utilizationRate}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Utilization Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Utilization</span>
                  <span>{stats.utilizationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(stats.utilizationRate, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Building Breakdown */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">By Building</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Academic Building A</span>
                      <span className="text-green-600">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tech Building B</span>
                      <span className="text-blue-600">72%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Science Building C</span>
                      <span className="text-yellow-600">64%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">By Room Type</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Classrooms</span>
                      <span className="text-green-600">78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labs</span>
                      <span className="text-blue-600">82%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auditoriums</span>
                      <span className="text-purple-600">45%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Peak Hours */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Peak Usage Hours</h4>
                <div className="grid grid-cols-7 gap-1">
                  {['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM'].map((hour, index) => {
                    const usage = [85, 92, 88, 65, 78, 90, 82][index];
                    return (
                      <div key={hour} className="text-center">
                        <div className="text-xs text-gray-500 mb-1">{hour}</div>
                        <div className="h-8 bg-gray-200 rounded flex items-end">
                          <div 
                            className="w-full bg-blue-500 rounded transition-all duration-300"
                            style={{ height: `${usage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs mt-1">{usage}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} currentPage={getPageTitle()}>
      {activeTab === 'overview' && <OverviewContent />}
      {activeTab === 'enrollments' && <AdminEnrollmentManagement />}
      {activeTab === 'schedule-requests' && <AdminScheduleRequests />}
      {activeTab === 'courses' && <CoursesManagement />}
      {activeTab === 'rooms' && <RoomsManagement />}
      {activeTab === 'schedules' && <SchedulesManagement />}
      {activeTab === 'users' && <UsersManagement />}
      {activeTab === 'students' && <StudentsManagement />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'settings' && <SystemSettings />}
    </DashboardLayout>
  );
}