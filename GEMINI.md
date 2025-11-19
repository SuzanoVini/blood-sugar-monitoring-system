# Project Overview

This is a blood sugar monitoring web application. It allows patients to record their blood sugar levels, and allows specialists to monitor their patients' data. The application also provides AI-powered suggestions and alerts.

The project is a full-stack web application with the following architecture:

*   **Frontend:** A React application built with Vite and TypeScript. It uses Chart.js for data visualization and `axios` for API communication.
*   **Backend:** A Node.js application using the Express framework. It provides a RESTful API for the frontend.
*   **Database:** A MySQL database to store all application data.

# Building and Running

## Frontend

To run the frontend development server:

```bash
cd frontend
npm install
npm run dev
```

To build the frontend for production:

```bash
cd frontend
npm install
npm run build
```

To lint the frontend code:

```bash
cd frontend
npm run lint
```

## Backend

To run the backend server:

```bash
cd backend
npm install
npm start
```

To run the backend server in development mode (with auto-reloading):

```bash
cd backend
npm install
npm run dev
```

## Database

The database schema is defined in `database/blood_sugar_monitoring_system.sql`. To set up the database, you can import this file into your MySQL server.

# Development Conventions

*   **Code Style:** The frontend uses ESLint for code linting. The configuration is in `frontend/.eslintrc.js`.
*   **Testing:** The backend has a placeholder for tests.
*   **API:** The backend provides a RESTful API. The API routes are defined in the `backend/routes` directory.
