import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CalendarView } from '../calendar/CalendarView';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { 
  BarChart3, 
  Calendar, 
  Bell, 
  Users, 
  BookOpen, 
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Target,
  Award,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Plus
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface QuickStat {
  label: string;
  value: string | number;
  change?: { value: number; isPositive: boolean };
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ActivityItem {
  _id: string;
  type: 'schedule_change' | 'new_enrollment' | 'room_booking' | 'grade_update' | 'system_alert';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  priority: 'low' | 'medium' | 'high';
}

interface UpcomingEvent {
  _id: string;
  title: string;
  type: 'class' | 'meeting' | 'exam' | 'deadline';
  time: string;
  location?: string;
  participants?: number;
}

export function ComprehensiveDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Generate role-specific quick stats
      const stats: QuickStat[] = [];
      
      if (user?.role === 'admin') {
        stats.push(
          { label: 'Total Users', value: '2,847', change: { value: 12.5, isPositive: true }, icon: Users, color: 'text-blue-600' },
          { label: 'Active Courses', value: '156', change: { value: 8.2, isPositive: true }, icon: BookOpen, color: 'text-green-600' },
          { label: 'Room Utilization', value: '87%', change: { value: 5.1, isPositive: true }, icon: MapPin, color: 'text-purple-600' },
          { label: 'System Health', value: '99.2%', change: { value: 0.3, isPositive: true }, icon: Activity, color: 'text-orange-600' }
        );
      } else if (user?.role === 'instructor') {
        stats.push(
          { label: 'My Courses', value: '4', icon: BookOpen, color: 'text-blue-600' },
          { label: 'Total Students', value: '156', icon: Users, color: 'text-green-600' },
          { label: 'This Week Classes', value: '12', icon: Calendar, color: 'text-purple-600' },
          { label: 'Avg. Attendance', value: '92%', change: { value: 3.2, isPositive: true }, icon: Target, color: 'text-orange-600' }
        );
      } else {
        stats.push(
          { label: 'Enrolled Courses', value: '6', icon: BookOpen, color: 'text-blue-600' },
          { label: 'Current GPA', value: '3.85', change: { value: 0.12, isPositive: true }, icon: Award, color: 'text-green-600' },
          { label: 'Attendance Rate', value: '94%', change: { value: 2.1, isPositive: true }, icon: Target, color: 'text-purple-600' },
          { label: 'Next Class', value: '2h 15m', icon: Clock, color: 'text-orange-600' }
        );
      }
      
      setQuickStats(stats);
      
      // Generate recent activity
      const activities: ActivityItem[] = [
        {
          _id: '1',
          type: 'schedule_change',
          title: 'Schedule Updated',
          description: 'CS101 moved to Room B-205 due to capacity requirements',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          user: 'Dr. Sarah Johnson',
          priority: 'medium'
        },
        {
          _id: '2',
          type: 'new_enrollment',
          title: 'New Enrollment',
          description: '15 students enrolled in Advanced Database Systems',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          user: 'System',
          priority: 'low'
        },
        {
          _id: '3',
          type: 'room_booking',
          title: 'Room Reserved',
          description: 'Conference Room A booked for faculty meeting',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: 'Prof. Michael Chen',
          priority: 'low'
        },
        {
          _id: '4',
          type: 'grade_update',
          title: user?.role === 'student' ? 'Grade Posted' : 'Grades Submitted',
          description: user?.role === 'student' 
            ? 'Final grade posted for CS101: A-' 
            : 'Final grades submitted for CS101 (45 students)',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          user: user?.role === 'student' ? 'Prof. Michael Chen' : user?.name,
          priority: 'medium'
        },
        {
          _id: '5',
          type: 'system_alert',
          title: 'Maintenance Scheduled',
          description: 'System maintenance scheduled for tonight 2-4 AM',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user: 'IT Support',
          priority: 'high'
        }
      ];
      
      setRecentActivity(activities);
      
      // Generate upcoming events
      const events: UpcomingEvent[] = [
        {
          _id: '1',
          title: user?.role === 'student' ? 'CS101 - Introduction to Computer Science' : 'Morning Lecture - CS101',
          type: 'class',
          time: '09:00 AM',
          location: 'Room A-101',
          participants: user?.role !== 'student' ? 45 : undefined
        },
        {
          _id: '2',
          title: user?.role === 'admin' ? 'Department Head Meeting' : user?.role === 'instructor' ? 'Faculty Meeting' : 'Study Group',
          type: 'meeting',
          time: '02:00 PM',
          location: user?.role !== 'student' ? 'Conference Room' : 'Library',
          participants: user?.role !== 'student' ? 8 : 5
        },
        {
          _id: '3',
          title: user?.role === 'student' ? 'Midterm Examination - MATH201' : 'Midterm Exam Proctoring',
          type: 'exam',
          time: '10:00 AM Tomorrow',
          location: 'Main Auditorium',
          participants: user?.role !== 'student' ? 120 : undefined
        }
      ];
      
      setUpcomingEvents(events);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'schedule_change': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'new_enrollment': return <Users className="h-4 w-4 text-green-600" />;
      case 'room_booking': return <MapPin className="h-4 w-4 text-purple-600" />;
      case 'grade_update': return <Award className="h-4 w-4 text-orange-600" />;
      case 'system_alert': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-purple-100 text-purple-800';
      case 'exam': return 'bg-red-100 text-red-800';
      case 'deadline': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name}!
              </h2>
              <p className="text-gray-600 mt-1">
                {user?.role === 'admin' && "Here's your system overview and key metrics"}
                {user?.role === 'instructor' && "Ready to manage your classes and students"}
                {user?.role === 'student' && "Your academic dashboard is ready"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      {stat.change && (
                        <Badge className={stat.change.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          <TrendingUp className={`h-3 w-3 mr-1 ${stat.change.isPositive ? '' : 'rotate-180'}`} />
                          {stat.change.isPositive ? '+' : ''}{stat.change.value}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg bg-gray-100`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={loadDashboardData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity._id} className={`p-3 border-l-4 bg-gray-50 rounded-r-lg ${getPriorityColor(activity.priority)}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{activity.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{formatTimeAgo(activity.timestamp)}</span>
                            {activity.user && <span>by {activity.user}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge className={getEventTypeColor(event.type)} variant="outline">
                            {event.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                          {event.participants && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.participants} participants
                            </div>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used features and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {user?.role === 'admin' && (
                  <>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Plus className="h-6 w-6" />
                      Add User
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Calendar className="h-6 w-6" />
                      Generate Schedule
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <MapPin className="h-6 w-6" />
                      Manage Rooms
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <BarChart3 className="h-6 w-6" />
                      View Analytics
                    </Button>
                  </>
                )}
                {user?.role === 'instructor' && (
                  <>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <BookOpen className="h-6 w-6" />
                      My Courses
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Users className="h-6 w-6" />
                      Student Roster
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Award className="h-6 w-6" />
                      Grade Book
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Calendar className="h-6 w-6" />
                      Schedule Request
                    </Button>
                  </>
                )}
                {user?.role === 'student' && (
                  <>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Calendar className="h-6 w-6" />
                      My Schedule
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Award className="h-6 w-6" />
                      View Grades
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <BookOpen className="h-6 w-6" />
                      Course Materials
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Bell className="h-6 w-6" />
                      Announcements
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <CalendarView 
            userRole={user?.role as any} 
            showCreateButton={user?.role === 'admin'} 
            filterByUser={user?.role !== 'admin'} 
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationCenter />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
              <CardDescription>
                {user?.role === 'admin' && 'System-wide performance metrics and insights'}
                {user?.role === 'instructor' && 'Your teaching performance and student analytics'}
                {user?.role === 'student' && 'Your academic progress and performance trends'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">
                      {user?.role === 'admin' && 'System Utilization'}
                      {user?.role === 'instructor' && 'Class Performance'}
                      {user?.role === 'student' && 'Academic Progress'}
                    </h3>
                    <PieChart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {user?.role === 'admin' && '87%'}
                    {user?.role === 'instructor' && '92%'}
                    {user?.role === 'student' && '3.85'}
                  </div>
                  <p className="text-sm text-blue-600">
                    {user?.role === 'admin' && 'Overall system efficiency'}
                    {user?.role === 'instructor' && 'Average class attendance'}
                    {user?.role === 'student' && 'Current GPA'}
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">
                      {user?.role === 'admin' && 'User Engagement'}
                      {user?.role === 'instructor' && 'Student Success Rate'}
                      {user?.role === 'student' && 'Course Completion'}
                    </h3>
                    <LineChart className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {user?.role === 'admin' && '94%'}
                    {user?.role === 'instructor' && '89%'}
                    {user?.role === 'student' && '94%'}
                  </div>
                  <p className="text-sm text-green-600">
                    {user?.role === 'admin' && 'Active user participation'}
                    {user?.role === 'instructor' && 'Students passing with C+ or better'}
                    {user?.role === 'student' && 'On-time assignment submission'}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">
                  {user?.role === 'admin' && 'System Recommendations'}
                  {user?.role === 'instructor' && 'Teaching Insights'}
                  {user?.role === 'student' && 'Study Recommendations'}
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  {user?.role === 'admin' && (
                    <>
                      <li>• Consider adding more lab spaces during peak hours (10-2 PM)</li>
                      <li>• Room utilization in Building C could be optimized</li>
                      <li>• Schedule generation is 15% faster than last semester</li>
                    </>
                  )}
                  {user?.role === 'instructor' && (
                    <>
                      <li>• Your Monday classes have the highest attendance rates</li>
                      <li>• Consider office hours adjustment for better student engagement</li>
                      <li>• Lab sessions show 98% completion rate - excellent!</li>
                    </>
                  )}
                  {user?.role === 'student' && (
                    <>
                      <li>• Your strongest subject is Computer Science (4.0 GPA)</li>
                      <li>• Consider additional study time for Mathematics courses</li>
                      <li>• You're in the top 15% of your class - keep it up!</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}