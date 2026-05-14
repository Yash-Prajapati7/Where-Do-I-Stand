# WDIS - Where Do I Stand

WDIS is a full-stack placement tracking platform with a dynamic round-based student dashboard and a dedicated admin console.

This build replaces the old Google Sheets polling model with a custom MongoDB-backed backend and admin-controlled workflow.

## Highlights

- Multi-process placement tracking (company/process scoped)
- Dynamic round creation and ordering
- Excel upload + validation + student ingestion
- Per-student round result updates (`status`, `venue`, `groupNumber`, `remarks`)
- Dynamic student board rendering (no hardcoded round columns)
- Mobile-friendly row-based board flow
- Separate student app (`client`) and admin app (`admin`)

## Tech Stack

- Student frontend: Next.js + React + Tailwind + React Query + Zustand
- Admin frontend: Next.js + React Query + Axios + custom CSS
- Backend: Node.js (ES Modules), Express, Mongoose
- Database: MongoDB

## Project Structure

```text
WDIS/
├── admin/
│   ├── components/
│   ├── pages/
│   ├── styles/
│   └── utils/
├── client/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── store/
│   ├── styles/
│   └── utils/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── Reference.md
├── .env.example
├── docker-compose.yml
└── README.md
```

## Environment Variables

Copy `.env.example` to `.env` in the root and update values.

Backend:
- `MONGODB_URI` (default: `mongodb://localhost:27017/wdis`)
- `MONGODB_DB_NAME` (optional)
- `BACKEND_PORT` (default: `8080`)
- `FRONTEND_ORIGIN` (comma-separated allowed origins)

Frontend/Admin:
- `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8080/api`)
- `NEXT_PUBLIC_DEFAULT_POLL_INTERVAL_MS` (client only, default: `2500`)

## Local Development

Install dependencies:

```bash
npm install
npm install --prefix server
npm install --prefix client
npm install --prefix admin
```

Run all apps:

```bash
npm run dev
```

Expected local services:
- Student app: `http://localhost:3000`
- Admin app: `http://localhost:3001`
- Backend API: `http://localhost:8080`
- MongoDB: `mongodb://localhost:27017/wdis` (if running locally)

## Docker Development

```bash
docker compose up
```

This starts:
- `mongo`
- `server`
- `client`
- `admin`

## API Overview

Public API:
- `GET /api/health`
- `GET /api/processes`
- `GET /api/process/:processName`

Admin API:
- `GET /api/admin/processes`
- `POST /api/admin/processes`
- `GET /api/admin/processes/:processId`
- `GET /api/admin/processes/:processId/students`
- `POST /api/admin/processes/:processId/students/upload`
- `POST /api/admin/processes/:processId/rounds`
- `PATCH /api/admin/processes/:processId/rounds/:roundId`
- `DELETE /api/admin/processes/:processId/rounds/:roundId`
- `PATCH /api/admin/processes/:processId/students/:studentId/rounds/:roundId` (studentId may be a MongoDB ObjectId or a SAP ID)

## Excel Upload Expectations

Required columns (aliases supported):
- SAP ID (`SAP ID`, `SAPID`, `StudentID`, `RollNumber`, `RegNo`, etc.)
- Name (`Name`, `Student Name`, etc.)

Optional columns:
- Email, Phone, Branch, and any additional columns

Additional columns are mapped into student `metadata`.

## Legacy Note

The legacy Google Sheets dependency has been removed from runtime code.
MongoDB is now the authoritative data source.

## Reference Document

See `Reference.md` for full architecture details, schema definitions, data flow, assumptions, and known limitations.
