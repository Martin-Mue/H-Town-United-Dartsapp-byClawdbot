# H-Town United Darts Platform

Production-oriented full-stack scaffold implementing DDD and clean architecture.

## Modules
- `backend/` – Node.js + TypeScript REST/WebSocket API, JWT, OpenAPI and domain model samples
- `frontend/` – React + TypeScript + Tailwind + Framer Motion mobile-first app shell
- `App.tsx` – Existing Expo mobile score app prototype

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```
API docs: `http://localhost:8080/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Implemented Samples
- x01 match aggregate with bust/check-out logic and domain events
- match turn application service and REST controller
- ELO rating service
- training recommendation service
- camera recognition interface contract
- mobile bottom navigation + route slide transitions + settings delete dialog + tournament bracket
