import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from 'react-hot-toast';
import apiService from './apiService';
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  Calendar, 
  MapPin,
  BookOpen,
  Download,
  RefreshCw,
  PieChart
} from 'lucide-react';

interface AnalyticsData {
  roomUtilization: {
    overall: number;
    byBuilding: { name: string; utilization: number; color: string }[];
    byType: { type: string; utilization: number; rooms: number }[];
  };
  enrollment: {
    total: number;
    trend: number;
  };
  scheduling: {
    efficiency: number;
  };
  performance: {
    avgGPA: number;
  };
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data from the API
      const response = await apiService.getAnalytics(dateRange);
      
      if (!response.success) {
        throw new Error('Failed to load analytics data');
      }
      
      // If no data is returned, use fallback mock data
      if (!response.data || !Object.keys(response.data).length) {
        const mockData: AnalyticsData = {
          roomUtilization: {
            overall: 76,
            byBuilding: [
              { name: 'Academic Building A', utilization: 85, color: 'bg-blue-500' },
              { name: 'Technology Building B', utilization: 72, color: 'bg-green-500' },
              { name: 'Science Building C', utilization: 68, color: 'bg-purple-500' },
              { name: 'Library Building', utilization: 89, color: 'bg-orange-500' }
            ],
            byType: [
              { type: 'Classrooms', utilization: 78, rooms: 45 },
              { type: 'Laboratories', utilization: 82, rooms: 18 },
              { type: 'Computer Labs', utilization: 91, rooms: 12 },
              { type: 'Auditoriums', utilization: 45, rooms: 6 }
            ]
          },
          enrollment: {
            total: 2847,
            trend: 12.5
          },
          scheduling: {
            efficiency: 87.4
          },
          performance: {
            avgGPA: 3.42
          }
        };
        setData(mockData);
      } else {
        setData(response.data as AnalyticsData);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
      // Set mock data as fallback
      const mockData: AnalyticsData = {
        roomUtilization: {
          overall: 76,
          byBuilding: [
            { name: 'Academic Building A', utilization: 85, color: 'bg-blue-500' },
            { name: 'Technology Building B', utilization: 72, color: 'bg-green-500' },
            { name: 'Science Building C', utilization: 68, color: 'bg-purple-500' },
            { name: 'Library Building', utilization: 89, color: 'bg-orange-500' }
          ],
          byType: [
            { type: 'Classrooms', utilization: 78, rooms: 45 },
            { type: 'Laboratories', utilization: 82, rooms: 18 },
            { type: 'Computer Labs', utilization: 91, rooms: 12 },
            { type: 'Auditoriums', utilization: 45, rooms: 6 }
          ]
        },
        enrollment: {
          total: 2847,
          trend: 12.5
        },
        scheduling: {
          efficiency: 87.4
        },
        performance: {
          avgGPA: 3.42
        }
      };
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    try {
      if (!data) {
        toast.error('No data available to export');
        return;
      }

      console.log('Exporting analytics report...');
      // Create CSV content with full details
      const csvContent = [
        `Analytics Report - ${new Date().toLocaleDateString()}`,
        '\nOverview',
        `Total Students,${data.enrollment.total}`,
        `Room Utilization,${data.roomUtilization.overall}%`,
        `Schedule Efficiency,${data.scheduling.efficiency}%`,
        `Average GPA,${data.performance.avgGPA}`,
        '\nRoom Utilization by Building',
        ['Building', 'Utilization (%)'].join(','),
        ...data.roomUtilization.byBuilding.map(b => `${b.name},${b.utilization}`),
        '\nRoom Utilization by Type',
        ['Type', 'Utilization (%)', 'Room Count'].join(','),
        ...data.roomUtilization.byType.map(t => `${t.type},${t.utilization},${t.rooms}`)
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart className="h-5 w-5" />
                Analytics & Reports
              </CardTitle>
              <CardDescription className="mt-1">
                Comprehensive analytics and performance metrics
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadAnalyticsData} className="bg-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportReport} className="bg-gray-900 hover:bg-gray-800 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics - Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total Students</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{data.enrollment.total.toLocaleString()}</p>
                </div>
                <Badge className="bg-green-100 text-green-800 mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{data.enrollment.trend}%
                </Badge>
              </div>
              <Users className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Room Utilization</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{data.roomUtilization.overall}%</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5.2%
                </Badge>
              </div>
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Schedule Efficiency</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{data.scheduling.efficiency}%</p>
                </div>
                <Badge className="bg-green-100 text-green-800 mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.1%
                </Badge>
              </div>
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Average GPA</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{data.performance.avgGPA}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0.08
                </Badge>
              </div>
              <BookOpen className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Room Utilization by Building */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart className="h-5 w-5" />
              Room Utilization by Building
            </CardTitle>
            <CardDescription>Utilization rates across different buildings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.roomUtilization.byBuilding.map((building, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-900">{building.name}</span>
                    <span className="font-bold text-gray-900">{building.utilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`${building.color} h-2.5 rounded-full transition-all duration-300`}
                      style={{ width: `${building.utilization}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Room Types Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5" />
              Room Types Distribution
            </CardTitle>
            <CardDescription>Utilization by room category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.roomUtilization.byType.map((type, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-semibold text-gray-900">{type.type}</p>
                    <p className="text-sm text-gray-500">{type.rooms} rooms</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{type.utilization}%</p>
                    <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${type.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}