# Backend Server

Backend server for the Blood Sugar Monitoring System web application. Built with Node.js, Express, and MySQL.

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (via XAMPP or standalone)
- npm or yarn package manager

## Setup Instructions

### 1. Install Dependencies

Navigate to the backend directory and install required packages:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `/backend` directory with the following content:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=blood_sugar_monitoring_system
DB_PORT=3306
PORT=5000
NODE_ENV=development
```

Adjust these values to match your local MySQL configuration.

### 3. Import Database

Import the database schema from the `/database` folder:
```bash
mysql -u root -p < ../database/blood_sugar_monitoring_system.sql
```

Alternatively, import using phpMyAdmin or MySQL Workbench.

### 4. Start the Server

For development with auto-restart on file changes:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on http://localhost:5000

Expected output:
```
==================================================
Blood Sugar Monitoring System - Backend Server
==================================================
Server running on: http://localhost:5000
Database: blood_sugar_monitoring_system
CORS enabled for: http://localhost:3000
Started at: [timestamp]
==================================================
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new patient account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Patient Operations
- `GET /api/patient/readings` - Get patient blood sugar readings
- `POST /api/patient/readings` - Add new reading
- `PUT /api/patient/readings/:id` - Update existing reading
- `DELETE /api/patient/readings/:id` - Delete reading
- `GET /api/patient/suggestions` - Get AI-generated suggestions
- `GET /api/patient/alerts` - Get patient alerts

### Specialist Operations
- `GET /api/specialist/patients` - Get all assigned patients
- `GET /api/specialist/patients/:id` - Get specific patient details
- `POST /api/specialist/feedback` - Provide feedback to patient
- `GET /api/specialist/feedback/:patient_id` - Get patient feedback history

### Administrator Operations
- `POST /api/admin/users/specialist` - Create new specialist account
- `POST /api/admin/users/staff` - Create new staff account
- `DELETE /api/admin/users/:id` - Delete user account
- `POST /api/admin/reports/generate` - Generate system report
- `GET /api/admin/reports/:id` - Retrieve specific report
- `GET /api/admin/stats` - Get system-wide statistics

### Clinic Staff Operations
- `GET /api/staff/thresholds` - Get current threshold settings
- `PUT /api/staff/thresholds` - Update threshold settings
- `GET /api/staff/patients` - View patient records (read-only)

## Project Structure
```
backend/
├── server.js                    # Main server file
├── package.json                 # Project dependencies
├── .env                        # Environment variables (not in git)
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── /api                        # API function modules
│   ├── userAPI.js
│   ├── bloodSugarAPI.js
│   ├── thresholdAPI.js
│   ├── alertAPI.js
│   └── adminAPI.js
└── /routes                     # Express route handlers
    ├── authRoutes.js
    ├── patientRoutes.js
    ├── specialistRoutes.js
    ├── adminRoutes.js
    └── staffRoutes.js
```

## Troubleshooting

### Database Connection Issues

**Error: Cannot connect to database**
- Verify MySQL server is running in XAMPP
- Check database name exists: `blood_sugar_monitoring_system`
- Confirm credentials in `.env` file are correct
- Ensure MySQL port (default 3306) is not blocked

### Port Already in Use

**Error: Port 5000 already in use**
- Change PORT value in `.env` file to an available port
- Or stop the process currently using port 5000

### Module Installation Issues

**Error: Cannot find module**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Query Errors

**Error: Table doesn't exist**
- Reimport the database schema from `/database` folder
- Verify database name in `.env` matches imported database

### Server Won't Start

**Error: Database connection failed**
- Make sure MySQL is running in XAMPP Control Panel
- Verify `.env` credentials match your MySQL setup
- Default XAMPP MySQL has no password (leave `DB_PASSWORD=` empty)

## Testing

Test endpoints using:
- Postman for all HTTP methods
- curl commands from terminal
- Frontend integration testing

Example curl test:
```bash
curl -X GET http://localhost:5000/api/patient/readings \
  -H "Content-Type: application/json"
```

## License

This project is for academic purposes as part of INFO2413 coursework at Kwantlen Polytechnic University.