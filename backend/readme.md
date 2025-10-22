# Backend Server

Backend server for the Blood Sugar Monitoring System web application. Built with Node.js, Express, and MySQL.

## Prerequisites

- Node.js 
- MySQL Server 
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

Ensure you have imported the database schema from the `/database` folder:
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

### 5. Verify Installation

Test the server by visiting these endpoints in your browser:

- http://localhost:5000 - API information
- http://localhost:5000/api/health - Database connection status
- http://localhost:5000/api/test - User count query
- http://localhost:5000/api/test/users - List all users
- http://localhost:5000/api/test/readings - Sample readings with Event field

## API Endpoints

### Current Test Endpoints

- **GET /** - API information and available endpoints
- **GET /api/health** - Health check and database connection status
- **GET /api/test** - Test database query (count users)
- **GET /api/test/users** - Retrieve all users (debug only)
- **GET /api/test/readings** - Retrieve sample readings with Event field

### Planned Production Endpoints

#### Authentication (Sukhraj)
- POST /api/auth/register - Register new patient account
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout
- GET /api/auth/profile - Get current user profile

#### Patient Operations (Vinicius)
- GET /api/patient/readings - Get patient blood sugar readings
- POST /api/patient/readings - Add new reading
- PUT /api/patient/readings/:id - Update existing reading
- DELETE /api/patient/readings/:id - Delete reading
- GET /api/patient/suggestions - Get AI-generated suggestions
- GET /api/patient/alerts - Get patient alerts

#### Specialist Operations (Vinicius)
- GET /api/specialist/patients - Get all assigned patients
- GET /api/specialist/patients/:id - Get specific patient details
- POST /api/specialist/feedback - Provide feedback to patient
- GET /api/specialist/feedback/:patient_id - Get patient feedback history

#### Administrator Operations (Krish)
- POST /api/admin/users/specialist - Create new specialist account
- POST /api/admin/users/staff - Create new staff account
- DELETE /api/admin/users/:id - Delete user account
- POST /api/admin/reports/generate - Generate system report
- GET /api/admin/reports/:id - Retrieve specific report
- GET /api/admin/stats - Get system-wide statistics

#### Clinic Staff Operations
- GET /api/staff/thresholds - Get current threshold settings
- PUT /api/staff/thresholds - Update threshold settings
- GET /api/staff/patients - View patient records (read-only)

## Project Structure
```
backend/
├── server.js                    # Main server file
├── package.json                 # Project dependencies
├── .env                        # Environment variables (not in git)
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── /api                        # API function modules
│   ├── userAPI.js              # User management (Manan)
│   ├── bloodSugarAPI.js        # Blood sugar operations (Shivam)
│   ├── thresholdAPI.js         # Threshold management (Krish)
│   ├── alertAPI.js             # Alert system (Krish)
│   └── adminAPI.js             # Admin operations (Krish)
└── /routes                     # Express route handlers
    ├── authRoutes.js           # Authentication routes (Sukhraj)
    ├── patientRoutes.js        # Patient routes (Vinicius)
    ├── specialistRoutes.js     # Specialist routes (Vinicius)
    ├── adminRoutes.js          # Admin routes (Krish)
    └── staffRoutes.js          # Staff routes
```

## Troubleshooting

### Database Connection Issues

**Error: Cannot connect to database**
- Verify MySQL server is running
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
- Reimport the database schema
- Verify database name in `.env` matches imported database

## Development Guidelines

### Adding New Routes

1. Create route handler in `/routes` directory
2. Import and register in `server.js`
3. Update this README with new endpoints

### Adding New API Functions

1. Create API module in `/api` directory
2. Export functions for use in route handlers
3. Include error handling in all database queries

### Error Handling

All database queries should include error handling:
```javascript
db.query(sql, params, (err, results) => {
  if (err) {
    return res.status(500).json({
      success: false,
      message: 'Query failed',
      error: err.message
    });
  }
  // Process results
});
```

## Testing

Test endpoints using:
- Browser for GET requests
- Postman for all HTTP methods
- curl commands from terminal

Example curl test:
```bash
curl http://localhost:5000/api/health
```

## Team Responsibilities

- **Vinicius**: Server setup, patient routes, specialist routes, AI algorithms
- **Sukhraj**: Authentication system, API service layer
- **Krish**: Database, admin routes, threshold/alert/admin APIs
- **Manan**: User management API
- **Shivam**: Blood sugar data API

## License

This project is for academic purposes as part of INFO2413 coursework at Kwantlen Polytechnic University.