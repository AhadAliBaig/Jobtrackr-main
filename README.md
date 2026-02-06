# Jobtrackr

Tired of using excel sheets to keep track of your applications? check out Jobtrackr

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the `backend/` directory with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Run the Application

Open **two terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
ng serve
```
Frontend runs on `http://localhost:4200`

Open your browser and navigate to `http://localhost:4200`

## Project Structure

```
├── backend/          # Node.js/Express API
│   ├── src/
│   └── .env         # Database configuration (create this)
├── frontend/         # Angular application
└── README.md
```

## Important Notes

- Make sure your `.env` file is in the `backend/` directory
- Never commit `.env` files to Git (already in `.gitignore`)
- Backend must be running before using the frontend
- Database must be set up and running before starting the backend

## Troubleshooting

- **Backend won't start**: Check your `.env` file and database connection
- **Frontend can't connect**: Make sure backend is running on port 3000
- **Port already in use**: Stop other services using ports 3000 or 4200
