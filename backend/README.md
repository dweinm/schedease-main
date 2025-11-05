# schedease Backend - MongoDB Edition

This is the backend API server for schedease, now configured to use MongoDB as the database.

## Prerequisites

Before running the backend, make sure you have:

1. **Node.js** (v16 or higher)
2. **MongoDB** installed and running locally, or access to a MongoDB Atlas cluster
3. **npm** or **yarn** package manager

## MongoDB Installation

### Option 1: Local MongoDB Installation

#### macOS (using Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### Windows
Download and install MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in your `.env` file

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   
   Or create a `.env` file with the following content:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/schedease_db

   # JWT Configuration
   JWT_SECRET=your-abcdefghijkl
   TOKEN_EXPIRATION_HOURS=24

   # CORS Configuration
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173

   # Logging
   ENABLE_REQUEST_LOGGING=true
   ```

3. **Initialize Database**
   ```bash
   npm run setup-db
   ```
   
   This will:
   - Connect to MongoDB
   - Create the database collections
   - Seed initial data including default users

4. **Start the Server**
   
   **Development mode (with auto-restart):**
   ```bash
   npm run dev
   ```
   
   **Production mode:**
   ```bash
   npm start
   ```

## Default User Accounts

After running the setup, these default accounts will be available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | password |
| Instructor | instructor@university.edu | password |
| Student | student@university.edu | password |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create new course (Admin only)
- `PUT /api/courses/:id` - Update course (Admin only)
- `DELETE /api/courses/:id` - Delete course (Admin only)

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `GET /api/rooms/available` - Get available rooms
- `POST /api/rooms` - Create new room (Admin only)
- `PUT /api/rooms/:id` - Update room (Admin only)
- `DELETE /api/rooms/:id` - Delete room (Admin only)

### Schedules
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/instructor/:instructorId` - Get instructor schedules
- `GET /api/schedules/student/:studentId` - Get student schedules
- `POST /api/schedules` - Create new schedule (Admin only)
- `PUT /api/schedules/:id` - Update schedule (Admin only)
- `DELETE /api/schedules/:id` - Delete schedule (Admin only)

## Database Schema

### Collections

#### Users
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: 'admin', 'instructor', 'student'),
  department: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Departments
```javascript
{
  name: String,
  code: String (unique),
  createdAt: Date
}
```

#### Rooms
```javascript
{
  name: String,
  type: String (enum: 'classroom', 'laboratory', 'computer_lab', 'auditorium'),
  capacity: Number,
  building: String,
  floor: Number,
  equipment: [String],
  isAvailable: Boolean,
  createdAt: Date
}
```

#### Courses
```javascript
{
  code: String (unique),
  name: String,
  department: String,
  credits: Number,
  type: String (enum: 'lecture', 'lab', 'seminar'),
  duration: Number,
  studentsEnrolled: Number,
  requiredCapacity: Number,
  specialRequirements: [String],
  createdAt: Date
}
```

#### Schedules
```javascript
{
  courseId: ObjectId (ref: Course),
  instructorId: ObjectId (ref: Instructor),
  roomId: ObjectId (ref: Room),
  dayOfWeek: String,
  startTime: String,
  endTime: String,
  semester: String,
  academicYear: String,
  createdAt: Date
}
```

## Development Scripts

- `npm run dev` - Start development server with auto-restart
- `npm run setup-db` - Initialize and seed database
- `npm start` - Start production server
- `npm run dev:watch` - Alternative development mode

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running: `brew services start mongodb-community` (macOS)
   - Check connection string in `.env` file
   - Verify MongoDB port (default: 27017)

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process: `lsof -ti:3001 | xargs kill`

3. **Authentication Errors**
   - Verify JWT_SECRET is set in `.env`
   - Check token expiration settings

### Database Management

**View database contents:**
```bash
mongosh
use schedease_db
show collections
db.users.find()
```

**Reset database:**
```bash
mongosh
use schedease_db
db.dropDatabase()
```
Then run `npm run setup-db` again.

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use a strong JWT_SECRET
3. Configure MongoDB Atlas or secured MongoDB instance
4. Set appropriate CORS_ORIGINS
5. Enable MongoDB authentication
6. Use HTTPS in production

## Security Notes

- Change default JWT_SECRET in production
- Use environment variables for sensitive data
- Enable MongoDB authentication in production
- Implement rate limiting for API endpoints
- Use HTTPS in production environment
- Regularly update dependencies

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include appropriate logging
4. Test endpoints before submitting
5. Update documentation for new features