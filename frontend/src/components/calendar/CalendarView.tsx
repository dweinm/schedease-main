import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Plus,
  Eye,
  Edit
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface CalendarEvent {
  _id: string;
  title: string;
  courseCode: string;
  instructor: string;
  room: string;
  building: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'lecture' | 'lab' | 'exam' | 'office_hours' | 'meeting';
  status: 'scheduled' | 'cancelled' | 'moved' | 'completed';
  attendees?: number;
  capacity?: number;
  color: string;
  conflicts?: string[];
}

interface CalendarProps {
  userRole?: 'admin' | 'instructor' | 'student';
  showCreateButton?: boolean;
  filterByUser?: boolean;
}

export function CalendarView({ userRole, showCreateButton = false, filterByUser = false }: CalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate, filterByUser]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Mock calendar events
      const mockEvents: CalendarEvent[] = [];
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Generate events for the month
      for (let day = 1; day <= endOfMonth.getDate(); day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayOfWeek = date.getDay();
        
        // Skip weekends for most events
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        // Add regular class schedules
        if (dayOfWeek === 1 || dayOfWeek === 3) { // Monday, Wednesday
          mockEvents.push({
            _id: `cs101-${day}`,
            title: 'Introduction to Computer Science',
            courseCode: 'CS101',
            instructor: 'Prof. Michael Chen',
            room: 'Room A-101',
            building: 'Academic Building A',
            startTime: '09:00',
            endTime: '10:30',
            date: date.toISOString().split('T')[0],
            type: 'lecture',
            status: 'scheduled',
            attendees: 45,
            capacity: 50,
            color: 'bg-blue-500',
            conflicts: []
          });
        }
        
        if (dayOfWeek === 2) { // Tuesday
          mockEvents.push({
            _id: `cs102-${day}`,
            title: 'Programming Fundamentals Lab',
            courseCode: 'CS102',
            instructor: 'Prof. Michael Chen',
            room: 'Lab B-205',
            building: 'Technology Building B',
            startTime: '14:00',
            endTime: '16:00',
            date: date.toISOString().split('T')[0],
            type: 'lab',
            status: 'scheduled',
            attendees: 30,
            capacity: 35,
            color: 'bg-green-500',
            conflicts: []
          });
        }
        
        if (dayOfWeek === 2 || dayOfWeek === 4) { // Tuesday, Thursday
          mockEvents.push({
            _id: `math201-${day}`,
            title: 'Calculus II',
            courseCode: 'MATH201',
            instructor: 'Dr. Emily Rodriguez',
            room: 'Room C-301',
            building: 'Science Building C',
            startTime: '10:00',
            endTime: '11:30',
            date: date.toISOString().split('T')[0],
            type: 'lecture',
            status: 'scheduled',
            attendees: 38,
            capacity: 40,
            color: 'bg-purple-500',
            conflicts: []
          });
        }
        
        // Add some office hours for instructors
        if (userRole === 'instructor' && (dayOfWeek === 3 || dayOfWeek === 5)) {
          mockEvents.push({
            _id: `office-${day}`,
            title: 'Office Hours',
            courseCode: 'OH',
            instructor: user?.name || 'Instructor',
            room: 'Office 301',
            building: 'Faculty Building',
            startTime: '15:00',
            endTime: '17:00',
            date: date.toISOString().split('T')[0],
            type: 'office_hours',
            status: 'scheduled',
            color: 'bg-orange-500',
            conflicts: []
          });
        }
        
        // Add some random meetings for admins
        if (userRole === 'admin' && Math.random() > 0.8) {
          mockEvents.push({
            _id: `meeting-${day}`,
            title: 'Department Meeting',
            courseCode: 'MEET',
            instructor: 'Various',
            room: 'Conference Room',
            building: 'Administration Building',
            startTime: '13:00',
            endTime: '14:00',
            date: date.toISOString().split('T')[0],
            type: 'meeting',
            status: 'scheduled',
            color: 'bg-red-500',
            conflicts: []
          });
        }
      }
      
      // Add some exams
      const examDates = [15, 22, 29];
      examDates.forEach(day => {
        if (day <= endOfMonth.getDate()) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          mockEvents.push({
            _id: `exam-${day}`,
            title: 'Midterm Examination',
            courseCode: 'CS101',
            instructor: 'Prof. Michael Chen',
            room: 'Main Auditorium',
            building: 'Main Building',
            startTime: '09:00',
            endTime: '11:00',
            date: date.toISOString().split('T')[0],
            type: 'exam',
            status: 'scheduled',
            attendees: 150,
            capacity: 200,
            color: 'bg-red-600',
            conflicts: []
          });
        }
      });
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const days = direction === 'prev' ? -7 : 7;
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const days = direction === 'prev' ? -1 : 1;
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      case 'moved': return 'text-yellow-600';
      case 'completed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Removed unused filteredEvents variable

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(startOfCalendar.getDate() - startOfMonth.getDay());
    
    const days = [];
    const currentCalendarDate = new Date(startOfCalendar);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const dayEvents = getEventsForDate(currentCalendarDate);
      const isCurrentMonth = currentCalendarDate.getMonth() === currentDate.getMonth();
      const isToday = currentCalendarDate.toDateString() === new Date().toDateString();
      
      days.push(
        <div
          key={i}
          className={`min-h-[120px] border border-gray-200 p-2 ${
            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
          } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
        >
          <div className={`text-sm font-medium mb-2 ${
            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          } ${isToday ? 'text-blue-600' : ''}`}>
            {currentCalendarDate.getDate()}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event._id}
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventDialog(true);
                }}
                className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${event.color} text-white truncate`}
              >
                {event.startTime} {event.courseCode}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
      
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }
    
    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-100 p-3 text-center font-medium text-gray-700 border-b border-gray-200">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 bg-gray-100">
          <div className="p-3 text-center font-medium text-gray-700 border-r border-gray-200">Time</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="p-3 text-center font-medium text-gray-700 border-r border-gray-200">
              <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="text-lg">{day.getDate()}</div>
            </div>
          ))}
        </div>
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-t border-gray-200">
            <div className="p-2 text-sm text-gray-600 border-r border-gray-200 bg-gray-50">
              {hour}:00
            </div>
            {weekDays.map(day => {
              const dayEvents = getEventsForDate(day).filter(event => {
                const eventHour = parseInt(event.startTime.split(':')[0]);
                return eventHour === hour;
              });
              
              return (
                <div key={`${day.toISOString()}-${hour}`} className="p-1 border-r border-gray-200 min-h-[60px] relative">
                  {dayEvents.map(event => (
                    <div
                      key={event._id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDialog(true);
                      }}
                      className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${event.color} text-white mb-1`}
                    >
                      <div className="font-medium truncate">{event.courseCode}</div>
                      <div className="truncate">{event.room}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
    
    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(event => (
              <div
                key={event._id}
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventDialog(true);
                }}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge variant="outline">{event.courseCode}</Badge>
                  </div>
                  <Badge className={`${getStatusColor(event.status)} bg-transparent`}>
                    {event.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {event.startTime} - {event.endTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.room}, {event.building}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {event.instructor}
                  </div>
                  {event.attendees && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {event.attendees}/{event.capacity} students
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Schedule Calendar
              </CardTitle>
              <CardDescription>
                {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString()}`}
                {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Events</option>
                <option value="lecture">Lectures</option>
                <option value="lab">Labs</option>
                <option value="exam">Exams</option>
                <option value="office_hours">Office Hours</option>
                <option value="meeting">Meetings</option>
              </select>
              
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              
              {showCreateButton && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navigation */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (viewMode === 'month') navigateMonth('prev');
                  else if (viewMode === 'week') navigateWeek('prev');
                  else navigateDay('prev');
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (viewMode === 'month') navigateMonth('next');
                  else if (viewMode === 'week') navigateWeek('next');
                  else navigateDay('next');
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                onClick={() => setViewMode('month')}
                size="sm"
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                onClick={() => setViewMode('week')}
                size="sm"
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                onClick={() => setViewMode('day')}
                size="sm"
              >
                Day
              </Button>
            </div>
          </div>
          
          {/* Calendar Content */}
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </CardContent>
      </Card>
      
      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${selectedEvent.color}`}></div>
                <div>
                  <h3 className="font-medium">{selectedEvent.title}</h3>
                  <Badge variant="outline">{selectedEvent.courseCode}</Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{selectedEvent.room}, {selectedEvent.building}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span>{selectedEvent.instructor}</span>
                </div>
                
                {selectedEvent.attendees && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{selectedEvent.attendees}/{selectedEvent.capacity} attendees</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <Badge className={`${getStatusColor(selectedEvent.status)} bg-transparent`}>
                    {selectedEvent.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {selectedEvent.type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              {selectedEvent.conflicts && selectedEvent.conflicts.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Conflicts Detected</h4>
                  <ul className="text-sm text-red-600">
                    {selectedEvent.conflicts.map((conflict, index) => (
                      <li key={index}>• {conflict}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(userRole === 'admin' || userRole === 'instructor') && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}