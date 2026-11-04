# Craviti - Restaurant Management Panel (SaaS)

Craviti is a modern QR-based restaurant dining and ordering management platform.

## Architecture

- **Frontend**: React (Vite), Tailwind CSS, React Router DOM, React Hook Form, React Hot Toast, Framer Motion, Socket.io client.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Cloudinary, Socket.io, Express Validator.

## Project Structure

```
craviti_v2/
├── frontend/        # React SPA Restaurant Panel
├── backend/         # Express & MongoDB API Server
├── docs/            # Architecture & API documentation
├── .gitignore
├── package.json     # Workspace management scripts
└── README.md
```

## Getting Started

### Backend
1. `cd backend`
2. `npm install`
3. Configure `backend/.env`
4. `npm run dev` (Runs on `http://localhost:5000`)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Runs on `http://localhost:5173`)

