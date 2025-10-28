import { Room } from '../config/database.js';

// Get all rooms
export async function getRooms(req, res) {
  try {
    const rooms = await Room.find().sort({ building: 1, name: 1 });
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  }
}

// Get room by ID
export async function getRoomById(req, res) {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    console.error('Get room by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch room' });
  }
}

// Get available rooms
export async function getAvailableRooms(req, res) {
  try {
    const { type, minCapacity, equipment } = req.query;
    
    let filter = { isAvailable: true };
    
    if (type) {
      filter.type = type;
    }
    
    if (minCapacity) {
      filter.capacity = { $gte: parseInt(minCapacity) };
    }
    
    if (equipment) {
      const equipmentList = Array.isArray(equipment) ? equipment : [equipment];
      filter.equipment = { $in: equipmentList };
    }

    const rooms = await Room.find(filter).sort({ building: 1, name: 1 });
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available rooms' });
  }
}

// Create new room
export async function createRoom(req, res) {
  try {
    const roomData = req.body;
    
    // Check if room name already exists in the same building
    const existingRoom = await Room.findOne({ 
      name: roomData.name, 
      building: roomData.building 
    });
    if (existingRoom) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room with this name already exists in this building' 
      });
    }

    const room = new Room(roomData);
    const savedRoom = await room.save();

    res.status(201).json({ 
      success: true, 
      message: 'Room created successfully',
      room: savedRoom 
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
}

// Update room
export async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if trying to update to an existing room name in the same building
    if (updateData.name && updateData.building) {
      const existingRoom = await Room.findOne({ 
        name: updateData.name, 
        building: updateData.building,
        _id: { $ne: id } 
      });
      if (existingRoom) {
        return res.status(400).json({ 
          success: false, 
          message: 'Room with this name already exists in this building' 
        });
      }
    }

    const room = await Room.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ 
      success: true, 
      message: 'Room updated successfully',
      room 
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ success: false, message: 'Failed to update room' });
  }
}

// Delete room
export async function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    
    const room = await Room.findByIdAndDelete(id);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ 
      success: true, 
      message: 'Room deleted successfully' 
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete room' });
  }
}