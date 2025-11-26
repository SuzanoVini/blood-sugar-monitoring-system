# Blood Sugar Monitoring System

Web-based diabetes management platform enabling patients to track blood sugar readings, receive AI-generated health suggestions and alerts, while allowing specialists to monitor and provide feedback.

## Architecture

### Stack
- **Frontend**: React 19 + TypeScript, Vite (SPA)
- **Backend**: Node.js 14+ + Express
- **Database**: MySQL/MariaDB
- **Real-time**: Socket.IO
- **Email**: SendGrid API

### Components
```
┌─────────────┐      HTTP/WS     ┌──────────────┐      MySQL       ┌──────────┐
│   React     │ <──────────────> │   Express    │ <──────────────> │  MySQL   │
│   (Vite)    │   :3000->:5000    │   REST API   │                  │          │
└─────────────┘                  └──────────────┘                  └──────────┘
                                         │
                                         ├─> SendGrid (email alerts)
                                         └─> Socket.IO (notifications)
```

### Key Dependencies
- **Backend**: `express`, `mysql2`, `jsonwebtoken`, `bcrypt`, `@sendgrid/mail`, `socket.io`, `multer`, `dotenv`
- **Frontend**: `react`, `react-router-dom`, `axios`, `chart.js`, `socket.io-client`

### Data Flow
1. User authenticates -> JWT issued
2. Patient adds reading -> Auto-categorized via threshold API
3. If 4th abnormal in 7 days -> Alert created -> Email sent (patient + specialist) + WebSocket notification
4. AI pattern analyzer -> Correlates food/activity notes -> Generates suggestions
5. Specialist views assigned patients -> Provides feedback

## Design

### Core Entities
```
User (base)
├─ Patient (healthcare_number, optional threshold overrides)
├─ Specialist (specialization, license_number)
├─ Clinic_Staff
└─ Administrator

Sugar_Reading (patient_id, datetime, value, category, food/activity notes)
CategoryThreshold (versioned thresholds: normal/borderline/abnormal ranges)
Alert (patient_id, week_start, abnormal_count, recipients, sent_at)
AI_Suggestion (patient_id, content, based_on_pattern)
Specialist_Patient_Assignment (specialist_id, patient_id)
Feedback (specialist_id, patient_id, content)
```

### API Endpoints

**Auth** (`/api/auth`)
- `POST /register` - Patient registration
- `POST /login` - User login (returns JWT)
- `POST /logout` - Session termination
- `GET /current-user` - Get authenticated user

**Patient** (`/api/patient`) - Requires JWT + Patient/Specialist/Staff/Admin role
- `POST /readings` - Add blood sugar reading
- `GET /readings` - Get reading history (filters: date range, category, pagination)
- `GET /suggestions` - Get AI-generated suggestions
- `GET /alerts` - Get patient alerts
- `GET /stats` - Get patient statistics

**Specialist** (`/api/specialist`) - Requires JWT + Specialist/Admin role
- `GET /patients` - List assigned patients
- `GET /patients/:id` - Get patient details
- `GET /patients/:id/readings` - Get patient reading history
- `POST /feedback` - Provide feedback to patient
- `GET /alerts/undelivered` - Get undelivered alerts
- `PUT /alerts/:id/delivered` - Mark alert as delivered

**Staff** (`/api/staff`) - Requires JWT + Staff/Admin role
- `GET /thresholds` - Get current system thresholds
- `POST /thresholds` - Update thresholds (inserts new version)
- `DELETE /thresholds/:id` - Delete threshold version
- `GET /patients` - View patient records (read-only)

**Admin** (`/api/admin`) - Requires JWT + Admin role
- `POST /users` - Create user (specialist/staff)
- `DELETE /users/:id` - Delete user
- `GET /stats` - System-wide statistics
- `POST /reports` - Generate report (monthly/yearly)
- `GET /reports/:id` - Retrieve report
- `POST /assign-specialist` - Assign specialist to patient

**User Profile** (`/api/user`) - Requires JWT
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `POST /profile/image` - Upload profile image

### Processing Pipeline

**Reading Categorization**
```
Input: value, patient_id
├─ Fetch patient-specific thresholds (if any)
├─ Fetch latest system thresholds
├─ Apply rules:
│  └─ Normal: patient override OR system normal range
│  └─ Borderline/Abnormal: system ranges only
└─ Return: "Normal" | "Borderline" | "Abnormal"
```

**Alert Workflow**
```
Trigger: New abnormal reading added
├─ Count abnormal readings in last 7 days
├─ If count > 3:
│  ├─ Check if alert already sent this week -> Skip if yes
│  ├─ Get assigned specialist
│  ├─ Create Alert record
│  ├─ Send email to patient (with readings table)
│  ├─ Send email to specialist (with patient details)
│  └─ Send WebSocket notification to both
└─ Return status
```

**AI Suggestion Generation**
```
Input: Patient's abnormal readings
├─ Filter: Category = "Abnormal"
├─ Extract: Food_Notes, Activity_Notes
├─ Parse and normalize items
├─ Count occurrences per item
├─ Calculate frequency percentage
├─ Filter: ≥3 occurrences AND ≥40% frequency
└─ Output: Suggestion text with trigger items
```

### Authentication & Authorization
- **Auth**: JWT tokens (1h expiry, configurable)
- **Middleware**: `verifyToken` -> `requireRole(...roles)`
- **Password**: bcrypt (10 rounds)
- **Protected routes**: All except `/api/auth/register` and `/api/auth/login`

### Error Handling
- `401 Unauthorized` - Missing/invalid JWT
- `403 Forbidden` - Insufficient role permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Database/server errors
- Callback pattern: `callback(error, result)` - errors logged, generic messages to client

## Setup

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn
- MySQL/MariaDB server (5.7+)
- SendGrid account (for email alerts)

### Environment Variables

Create `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=blood_sugar_monitoring_system
DB_PORT=3306

# Server
PORT=5000
NODE_ENV=development

# Auth
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=http://localhost:3000

# Email (SendGrid)
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_SENDER_EMAIL=noreply@yourdomain.com
```

### Installation

**1. Clone and install backend:**
```bash
cd blood-sugar-monitoring-system/backend
npm install
```

**2. Install frontend:**
```bash
cd ../frontend
npm install
```

**3. Database setup:**
```bash
# Start MySQL server (XAMPP/standalone)
# Import schema
mysql -u root -p < database/blood_sugar_monitoring_system.sql

# Or via MySQL client:
mysql -u root -p
source database/blood_sugar_monitoring_system.sql;
```

**4. Verify database:**
```sql
USE blood_sugar_monitoring_system;
SHOW TABLES;
```

Expected tables: `User`, `Patient`, `Specialist`, `Clinic_Staff`, `Administrator`, `Sugar_Reading`, `CategoryThreshold`, `Alert`, `Specialist_Patient_Assignment`, `Feedback`, `AI_Suggestion`, `AIPatternAnalyzer`, `Report`

## Run

### Development

**Backend** (port 5000):
```bash
cd backend
npm run dev
```

**Frontend** (port 3000):
```bash
cd frontend
npm run dev
```

Access: `http://localhost:3000`

### Production

**Build frontend:**
```bash
cd frontend
npm run build
```

**Start backend:**
```bash
cd backend
NODE_ENV=production npm start
```

### Initial Data

**Create admin user** (manual SQL):
```sql
INSERT INTO User (Name, Email, Password_Hash, Role, Status)
VALUES ('Admin', 'admin@example.com', '$2b$10$hashedpassword', 'Administrator', 'Active');

INSERT INTO Administrator (Admin_ID) VALUES (LAST_INSERT_ID());
```

**Create system thresholds:**
```sql
INSERT INTO CategoryThreshold (Normal_Low, Normal_High, Borderline_Low, Borderline_High, Abnormal_Low, Abnormal_High, Effective_Date)
VALUES (70, 140, 60, 70, 0, 60, NOW()),
       (70, 140, 140, 180, 180, 999, NOW());
```

## Testing

### Backend Unit Tests
```bash
cd backend
npm test
```

**Run alert tests:**
```bash
npm run test:alerts
```

**Watch mode:**
```bash
npm run test:watch
```

### Manual API Testing
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com","password":"password123"}'

# Add reading (requires JWT)
curl -X POST http://localhost:5000/api/patient/readings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"patient_id":1,"dateTime":"2025-11-24 10:30:00","value":120.5}'

# Get readings
curl http://localhost:5000/api/patient/readings?patient_id=1&limit=10 \
  -H "Authorization: Bearer <token>"
```

## Deployment

### Build Commands
```bash
# Frontend production build
cd frontend
npm run build
# Output: frontend/dist/

# Backend (no build required)
cd backend
npm install --production
```

### Configuration
- **Ports**: Backend 5000, Frontend 3000 (dev) or serve `dist/` via backend static middleware
- **Environment**: Set `NODE_ENV=production`, update `CORS_ORIGIN`, use strong `JWT_SECRET`
- **Database**: Remote MySQL instance, update `DB_HOST`, `DB_USER`, `DB_PASSWORD`
- **SSL**: Reverse proxy (nginx/Apache) for HTTPS
- **SendGrid**: Verify sender domain for production email volume

### Serving Frontend via Backend
```javascript
// Add to backend/server.js
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

## Operations

### Logging
- **Console logs**: Request method/path, database connections, alert triggers, email send status
- **Production**: Redirect to file or service (Winston, Bunyan)
```bash
NODE_ENV=production npm start >> app.log 2>&1
```

### Health Check
```bash
curl http://localhost:5000/api/auth/current-user
# Returns 401 without token (server OK) or 200 with valid token
```

### Monitoring
- **Database**: Check connection in logs: `Connected to MySQL database: blood_sugar_monitoring_system`
- **Email**: SendGrid dashboard for delivery stats
- **Socket.IO**: Check `✓ Socket.IO server initialized.` on startup

### Troubleshooting

**Database connection failed:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
-> Start MySQL server (XAMPP/standalone)
-> Verify DB credentials in .env
```

**JWT errors:**
```
Error: JWT_SECRET environment variable is not set
-> Add JWT_SECRET to backend/.env
```

**SendGrid email failures:**
```
Error: SENDGRID_API_KEY environment variable is not set
-> Add API key to .env
-> Verify sender email is authenticated in SendGrid
```

**CORS errors (frontend -> backend):**
```
Access to XMLHttpRequest blocked by CORS policy
-> Check CORS_ORIGIN in backend/.env matches frontend URL
-> Restart backend server after .env changes
```

**Port already in use:**
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process or change PORT in .env
```

**Database schema mismatch:**
```sql
-- Re-import schema
DROP DATABASE blood_sugar_monitoring_system;
CREATE DATABASE blood_sugar_monitoring_system;
USE blood_sugar_monitoring_system;
SOURCE database/blood_sugar_monitoring_system.sql;
```

### Performance Tuning
- **Database**: Index `Sugar_Reading(Patient_ID, DateTime)`, `Alert(Patient_ID, Week_Start)`
- **Queries**: Use `LIMIT` for pagination, avoid `SELECT *`
- **Frontend**: Code splitting, lazy loading routes
- **Static assets**: CDN for uploads folder in production
