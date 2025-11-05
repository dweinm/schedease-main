# schedease - Automated Class & Room Scheduling System

A comprehensive web-based scheduling system for academic institutions with role-based authentication and full-featured dashboards for administrators, instructors, and students.

## Features

### 🔐 Authentication System
- **Login & Registration**: Secure user authentication with JWT tokens
- **Role-based Access**: Three user types with different permissions
  - **Administrator**: Full system control, room/course/faculty management
  - **Instructor**: Schedule viewing, availability setting, request submissions
  - **Student**: Class schedule access and profile management

### 📊 Dashboard Features
- **Admin Dashboard**: Complete scheduling control, analytics, user management
- **Instructor Dashboard**: Personal schedule, course management, availability settings
- **Student Dashboard**: Class schedules, course information, calendar view

### 🏗️ Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + MySQL
- **Authentication**: JWT-based with role verification
- **Database**: MySQL with comprehensive schema

## Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL (v8.0+)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd schedease
```

2. **Setup Backend**
```bash
cd backend
npm install
```

3. **Setup Frontend**
```bash
cd frontend
npm install
```

4. **Configure Environment Variables**

Backend `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=schedease_db

# Security
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000

# Database Setup Options
INITIALIZE_DATABASE=true
SEED_DATABASE=true
ENABLE_REQUEST_LOGGING=true
```

Frontend `.env`:
```env
# API Configuration
REACT_APP_API_URL=/api
REACT_APP_NODE_ENV=development
```

5. **Start the Application**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Default Accounts

For testing purposes, the system comes with pre-seeded demo accounts:

- **Administrator**: admin@university.edu / password
- **Instructor**: instructor@university.edu / password  
- **Student**: student@university.edu / password

## Project Structure

```
schedease/
├── backend/                 # Node.js/Express API server
│   ├── api/                # API route handlers
│   ├── config/             # Database configuration
│   ├── scripts/            # Database setup scripts
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # Utility libraries
│   │   └── styles/        # CSS styles
│   └── public/            # Static assets
└── README.md
```

## Database Schema

The system uses a comprehensive MySQL schema with tables for:
- Users (authentication and profiles)
- Courses (academic course catalog)
- Rooms (classroom inventory)
- Schedules (class scheduling)
- Students/Instructors (role-specific data)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)

### Rooms
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/available` - Get available rooms
- `POST /api/rooms` - Create room (admin only)

### Schedules
- `GET /api/schedules` - List all schedules
- `GET /api/schedules/instructor/:id` - Instructor schedules
- `GET /api/schedules/student/:id` - Student schedules
- `POST /api/schedules` - Create schedule (admin only)

## Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons
- **Radix UI** - Component primitives

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.