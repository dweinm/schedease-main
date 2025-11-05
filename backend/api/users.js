import { User } from '../config/database.js';
import { createUser as createUserUtil, getUserById as getUserByIdUtil } from '../utils/auth.js';

// GET /api/users
export async function getUsers(req, res) {
  try {
    const users = await User.find().select('-password');
    return res.json({ success: true, users });
  } catch (err) {
    console.error('getUsers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

// GET /api/users/:id
export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    let user = null;
    if (typeof getUserByIdUtil === 'function') {
      user = await getUserByIdUtil(id);
    } else {
      user = await User.findById(id).select('-password');
    }
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('getUserById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
}

// POST /api/users
export async function createUser(req, res) {
  try {
    if (typeof createUserUtil === 'function') {
      const result = await createUserUtil(req.body);
      if (!result || !result.success) {
        return res.status(400).json(result || { success: false, message: 'Failed to create user' });
      }
      return res.status(201).json(result);
    }

    // Fallback creation if util not present
    const payload = { ...req.body };
    // basic required fields
    if (!payload.email || !payload.password || !payload.name) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }

    // prevent creating duplicate email
    const existing = await User.findOne({ email: payload.email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

    const user = new User(payload);
    await user.save();
    const obj = user.toObject(); delete obj.password;
    return res.status(201).json({ success: true, user: obj });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
}

// PUT /api/users/:id
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // only set password when a non-empty password is provided
    if ('password' in updates && updates.password && String(updates.password).trim() !== '') {
      user.password = updates.password; // assume pre-save hook hashes
    }

    // apply allowed updates safely (ignore unknown keys)
    const allow = ['name', 'email', 'role', 'department', 'status', 'lastLogin'];
    for (const k of allow) {
      if (updates[k] !== undefined) {
        user[k] = updates[k];
      }
    }

    await user.save();
    const obj = user.toObject(); delete obj.password;
    return res.json({ success: true, user: obj });
  } catch (err) {
    console.error('updateUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
}

// DELETE /api/users/:id
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    return res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
}