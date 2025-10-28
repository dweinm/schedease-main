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
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Eye,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';
import apiService from '../services/api';
import { toast } from 'sonner';

interface Room {
  _id: string;
  name: string;
  type: 'classroom' | 'laboratory' | 'computer_lab' | 'auditorium';
  capacity: number;
  building: string;
  floor: number;
  equipment: string[];
  isAvailable: boolean;
  createdAt: string;
}

interface RoomFormData {
  name: string;
  type: string;
  capacity: number;
  building: string;
  floor: number;
  equipment: string[];
  isAvailable: boolean;
}

export function RoomsManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    type: '',
    capacity: 30,
    building: '',
    floor: 1,
    equipment: [],
    isAvailable: true
  });
  const [submitting, setSubmitting] = useState(false);

  const roomTypes = [
    { value: 'classroom', label: 'Classroom', color: 'bg-blue-100 text-blue-800' },
    { value: 'laboratory', label: 'Laboratory', color: 'bg-purple-100 text-purple-800' },
    { value: 'computer_lab', label: 'Computer Lab', color: 'bg-green-100 text-green-800' },
    { value: 'auditorium', label: 'Auditorium', color: 'bg-orange-100 text-orange-800' }
  ];

  const equipmentOptions = [
    'projector', 'whiteboard', 'audio_system', 'computers', 'programming_software', 
    'network', 'lab_equipment', 'safety_equipment', 'fume_hoods', 'microphone', 
    'lighting', 'air_conditioning', 'wifi'
  ];

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRooms();
      setRooms(response.rooms || []);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Send to backend
      await apiService.createRoom({
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        building: formData.building,
        floor: formData.floor,
        equipment: formData.equipment,
        isAvailable: formData.isAvailable,
      });

      toast.success('Room created successfully');
      setShowCreateDialog(false);
      resetForm();
      // Reload rooms from backend
      loadRooms();
    } catch (error) {
      toast.error('Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setSubmitting(true);

    try {
      // Send update to backend
      await apiService.updateRoom(selectedRoom._id, {
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        building: formData.building,
        floor: formData.floor,
        equipment: formData.equipment,
        isAvailable: formData.isAvailable,
      });

      toast.success('Room updated successfully');
      setShowEditDialog(false);
      setSelectedRoom(null);
      resetForm();
      // Reload rooms from backend
      loadRooms();
    } catch (error) {
      toast.error('Failed to update room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      setRooms(prev => prev.filter(room => room._id !== roomId));
      toast.success('Room deleted successfully');
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const handleToggleAvailability = async (roomId: string) => {
    try {
      // Find the room to toggle
      const room = rooms.find(r => r._id === roomId);
      if (!room) return;

      // Send update to backend
      await apiService.updateRoom(roomId, {
        ...room,
        isAvailable: !room.isAvailable,
      });

      toast.success('Room availability updated');
      loadRooms();
    } catch (error) {
      toast.error('Failed to update room availability');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      capacity: 30,
      building: '',
      floor: 1,
      equipment: [],
      isAvailable: true
    });
  };

  const openEditDialog = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      building: room.building,
      floor: room.floor,
      equipment: room.equipment,
      isAvailable: room.isAvailable
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (room: Room) => {
    setSelectedRoom(room);
    setShowViewDialog(true);
  };

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      equipment: checked 
        ? [...prev.equipment, equipment]
        : prev.equipment.filter(item => item !== equipment)
    }));
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || room.type === filterType;
    const matchesBuilding = filterBuilding === 'all' || room.building === filterBuilding;
    return matchesSearch && matchesType && matchesBuilding;
  });

  const getTypeInfo = (type: string) => {
    return roomTypes.find(t => t.value === type) || { label: type, color: 'bg-gray-100 text-gray-800' };
  };

  const getUniqueBuildings = () => {
    return [...new Set(rooms.map(room => room.building))];
  };

  const exportRooms = () => {
    const csv = [
      ['Name', 'Type', 'Capacity', 'Building', 'Floor', 'Equipment', 'Available'],
      ...rooms.map(room => [
        room.name,
        room.type,
        room.capacity.toString(),
        room.building,
        room.floor.toString(),
        room.equipment.join('; '),
        room.isAvailable ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rooms-export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Rooms exported successfully');
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5" />
                Room Management
              </CardTitle>
              <CardDescription className="mt-1">
                Manage classrooms, laboratories, and other academic spaces ({rooms.length} total rooms)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportRooms} variant="outline" className="bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white">
                  <DialogHeader>
                    <DialogTitle>Create New Room</DialogTitle>
                    <DialogDescription>
                      Add a new room to the system
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Room Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Room A-101"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {roomTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                          min="1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="building">Building</Label>
                        <Input
                          id="building"
                          value={formData.building}
                          onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                          placeholder="e.g., Academic Building A"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="floor">Floor</Label>
                        <Input
                          id="floor"
                          type="number"
                          value={formData.floor}
                          onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) }))}
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Equipment</Label>
                      <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                        {equipmentOptions.map(equipment => (
                          <label key={equipment} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={formData.equipment.includes(equipment)}
                              onChange={(e) => handleEquipmentChange(equipment, e.target.checked)}
                              className="rounded"
                            />
                            <span className="capitalize">{equipment.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="available"
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="available">Room is available for scheduling</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-gray-900 hover:bg-gray-800 text-white">
                        {submitting ? <LoadingSpinner size="sm" /> : 'Create Room'}
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
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 bg-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">All Types</SelectItem>
                {roomTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterBuilding} onValueChange={setFilterBuilding}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="All Buildings" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">All Buildings</SelectItem>
                {getUniqueBuildings().map(building => (
                  <SelectItem key={building} value={building}>
                    {building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rooms Table */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="font-semibold">Room</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Capacity</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold">Equipment</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-semibold">{room.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeInfo(room.type).color}>
                        {getTypeInfo(room.type).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{room.capacity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{room.building}</div>
                        <div className="text-gray-500">Floor {room.floor}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {room.equipment.slice(0, 2).map(item => (
                          <Badge key={item} variant="outline" className="text-xs bg-white">
                            {item.replace('_', ' ')}
                          </Badge>
                        ))}
                        {room.equipment.length > 2 && (
                          <Badge variant="outline" className="text-xs bg-white">
                            +{room.equipment.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {room.isAvailable ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge 
                          className={room.isAvailable ? 'bg-black text-white hover:bg-gray-900' : 'bg-gray-200 text-gray-700'}
                        >
                          {room.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openViewDialog(room)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(room)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleAvailability(room._id)}
                          className="h-8 px-2 text-xs"
                        >
                          {room.isAvailable ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRoom(room._id)}
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

          {filteredRooms.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No rooms found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Room Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update room information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRoom} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Room Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {roomTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-building">Building</Label>
                <Input
                  id="edit-building"
                  value={formData.building}
                  onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-floor">Floor</Label>
                <Input
                  id="edit-floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) }))}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Equipment</Label>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                {equipmentOptions.map(equipment => (
                  <label key={equipment} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.equipment.includes(equipment)}
                      onChange={(e) => handleEquipmentChange(equipment, e.target.checked)}
                      className="rounded"
                    />
                    <span className="capitalize">{equipment.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-available"
                checked={formData.isAvailable}
                onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit-available">Room is available for scheduling</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-gray-900 hover:bg-gray-800 text-white">
                {submitting ? <LoadingSpinner size="sm" /> : 'Update Room'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Room Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Room Details</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedRoom.name}</h3>
                  <Badge className={getTypeInfo(selectedRoom.type).color}>
                    {getTypeInfo(selectedRoom.type).label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>Capacity: {selectedRoom.capacity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{selectedRoom.building}, Floor {selectedRoom.floor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={selectedRoom.isAvailable ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}>
                    {selectedRoom.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-semibold">Equipment:</span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedRoom.equipment.map(item => (
                      <Badge key={item} variant="outline" className="text-xs">
                        {item.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-500 pt-2 border-t">
                  <div>Created: {new Date(selectedRoom.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}