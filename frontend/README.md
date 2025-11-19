# Blood Sugar Monitoring System - Frontend

React-based web application for diabetes management, providing role-based dashboards for patients, specialists, clinic staff, and administrators.

## Tech Stack

- **Framework:** React 18.2 + TypeScript 5.9
- **Build Tool:** Vite 7.1
- **Routing:** React Router DOM 7.9
- **HTTP Client:** Axios 1.13
- **Real-time Communication:** Socket.IO Client 4.8
- **Data Visualization:** Chart.js 4.5 + React Chart.js 2
- **Code Quality:** ESLint 9.36 + TypeScript ESLint

## Project Structure

```
frontend/
├── src/
│   ├── assets/          # Static assets (images, fonts)
│   ├── components/      # Reusable React components
│   │   ├── AISuggestions.tsx
│   │   ├── AlertNotification.tsx
│   │   ├── BloodSugarForm.tsx
│   │   ├── FeedbackForm.tsx
│   │   ├── Navigation.tsx
│   │   ├── PatientFeedbackList.tsx
│   │   ├── ReadingsList.tsx
│   │   ├── ThresholdManager.tsx
│   │   ├── TrendsChart.tsx
│   │   └── UserManagement.tsx
│   ├── pages/           # Route-level page components
│   │   ├── AdminDashboard.tsx
│   │   ├── AuthenticationDashboard.tsx
│   │   ├── PatientDashboard.tsx
│   │   ├── PatientDetailsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SpecialistDashboard.tsx
│   │   └── StaffDashboard.tsx
│   ├── services/        # API integration & utilities
│   │   ├── apiService.ts       # Axios instance with interceptors
│   │   ├── authService.ts      # Authentication helpers
│   │   └── socketService.ts    # WebSocket manager
│   ├── styles/          # Global CSS and styling
│   ├── utils/           # Helper functions and utilities
│   ├── App.tsx          # Root component with routing
│   └── main.tsx         # Application entry point
├── public/              # Static public assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Prerequisites

- **Node.js:** v16.0 or higher
- **npm:** v7.0 or higher
- **Backend Server:** Must be running on `http://localhost:5000`

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Backend API expected at `http://localhost:5000/api`
   - WebSocket server expected at `http://localhost:5000`
   - CORS must be configured on backend for `http://localhost:3000`

3. **Start development server:**
   ```bash
   npm run dev
   ```
   - Frontend runs at `http://localhost:3000` (or next available port)
   - Hot Module Replacement (HMR) enabled for instant updates

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | TypeScript compilation + production build |
| `npm run lint` | Run ESLint code quality checks |
| `npm run preview` | Preview production build locally |

## Key Features

### Role-Based Dashboards

- **Patient Dashboard** (`/dashboard`)
  - Add/view blood sugar readings with auto-categorization
  - View AI-generated health suggestions
  - Track alerts for abnormal readings
  - View specialist feedback
  - Edit profile information

- **Specialist Dashboard** (`/specialist`)
  - View assigned patients list
  - Access detailed patient reading history
  - Provide feedback to patients
  - Monitor abnormal reading patterns

- **Clinic Staff Dashboard** (`/staff`)
  - Manage system-wide threshold configurations
  - View patient lists (read-only)
  - Configure Normal/Borderline/Abnormal ranges

- **Administrator Dashboard** (`/admin`)
  - User management (create, delete users)
  - Generate system reports
  - View platform statistics
  - Manage specialist-patient assignments

### Real-Time Features

- **WebSocket Integration:** Live alerts and notifications via Socket.IO
- **Auto-Categorization:** Readings categorized based on system/patient thresholds
- **AI Pattern Analysis:** Automated health suggestions based on reading patterns

## API Integration

### API Service (`src/services/apiService.ts`)

Axios instance with automatic JWT token injection:

```typescript
// Request interceptor attaches Authorization header
axiosInstance.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Base URL:** `http://localhost:5000/api`

### Authentication Service (`src/services/authService.ts`)

Handles JWT token management and user session:

```typescript
// Store token and user in localStorage
authService.login(token, user);

// Retrieve current user
const user = authService.getCurrentUser();

// Remove session data
authService.logout();
```

### WebSocket Service (`src/services/socketService.ts`)

Manages real-time Socket.IO connections:

```typescript
// Connect with authentication
socketService.connect(token);

// Listen for events
socketService.on('alert', handleAlertEvent);

// Disconnect
socketService.disconnect();
```

## Authentication Flow

1. **Login** (`POST /api/auth/login`)
   - Credentials sent to backend
   - JWT token received and stored in `localStorage`
   - User object stored for role-based routing

2. **Token Management**
   - Token attached to all API requests via interceptor
   - Expiration: 1 hour (configurable in backend)
   - No automatic refresh implemented

3. **Protected Routes**
   - All dashboard routes require authentication
   - Role-based access control on frontend
   - Backend validates JWT on every request

4. **Logout**
   - Clears `localStorage` token and user data
   - Redirects to login page
   - WebSocket connection closed

## Routing Structure

| Route | Component | Access |
|-------|-----------|--------|
| `/` | AuthenticationDashboard | Public |
| `/dashboard` | PatientDashboard | Patient |
| `/specialist` | SpecialistDashboard | Specialist |
| `/specialist/patient/:id` | PatientDetailsPage | Specialist |
| `/staff` | StaffDashboard | Clinic Staff |
| `/admin` | AdminDashboard | Administrator |
| `/profile` | ProfilePage | All authenticated |

**Navigation Logic:**
- After login, users are routed to role-specific dashboard
- Navigation component adapts menu items based on user role
- Profile page includes back button to return to appropriate dashboard

## Development Guidelines

### TypeScript

- **Strict mode enabled:** All types must be explicitly defined
- **No `any` types:** Use proper type definitions or interfaces
- **Type safety:** Leverage TypeScript for compile-time error detection

### Component Structure

```typescript
// Functional components with TypeScript
interface Props {
  patientId: number;
  onSubmit: (data: ReadingData) => void;
}

const Component: React.FC<Props> = ({ patientId, onSubmit }) => {
  // Component logic
};
```

### API Error Handling

```typescript
try {
  const response = await apiService.get('/endpoint');
  // Handle success
} catch (error: any) {
  console.error('API Error:', error.response?.data?.message);
  // Display user-friendly error message
}
```

### Styling

- **Global styles:** `src/styles/global.css`
- **Component styles:** Inline styles or scoped CSS
- **Responsive design:** Mobile-first approach
- **CSS classes:** `.btn`, `.btn.primary`, `.btn.secondary`, `.card`, `.dashboard-grid`

### Code Quality

- **ESLint:** Run `npm run lint` before committing
- **TypeScript:** Run `npm run build` to check type errors
- **Console logs:** Wrap in `if (import.meta.env.DEV)` for production
- **Error boundaries:** Implement for production error handling

## Common Development Tasks

### Adding a New Page

1. Create component in `src/pages/NewPage.tsx`
2. Add route in `App.tsx`:
   ```typescript
   <Route path="/new-page" element={<NewPage />} />
   ```
3. Update Navigation component if needed

### Adding a New API Endpoint

1. Use `apiService` for authenticated requests:
   ```typescript
   import apiService from '../services/apiService';

   const fetchData = async () => {
     const response = await apiService.get('/endpoint');
     return response.data;
   };
   ```

### Adding Real-Time Features

1. Import `socketService`:
   ```typescript
   import socketService from '../services/socketService';
   ```
2. Set up event listeners in `useEffect`:
   ```typescript
   useEffect(() => {
     socketService.on('event-name', handleEvent);
     return () => socketService.off('event-name', handleEvent);
   }, []);
   ```

## Troubleshooting

### CORS Errors
- Verify backend CORS is configured for `http://localhost:3000`
- Check backend `.env` file: `CORS_ORIGIN=http://localhost:3000`

### 401 Unauthorized Errors
- Check JWT token exists in `localStorage`
- Verify token expiration (default 1 hour)
- Re-login to obtain fresh token

### WebSocket Connection Failures
- Ensure backend Socket.IO server is running
- Check browser console for connection errors
- Verify token is passed to `socketService.connect(token)`

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`
- Verify all dependencies are installed: `npm install`

## Production Build

```bash
# Create optimized production build
npm run build

# Output directory: dist/
# Serve with any static file server or deploy to hosting platform
```

**Build Output:**
- Minified JavaScript bundles
- Optimized CSS
- Asset hashing for cache busting
- Source maps for debugging (optional)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with ES6+ support

## Team

**Blood Sugar Monitoring System - INFO2413**
- Frontend Development: Vinicius Suzano, Sukhraj Basi, Manan Chopra, Shivam Rana, Krish Nagpal
- Kwantlen Polytechnic University

---

**Note:** This frontend requires the backend API server to be running at `http://localhost:5000`. See `../backend/README.md` for backend setup instructions.
