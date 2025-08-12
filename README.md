# ⚡ ZeroTouch MicroPolicy

Buy in seconds. Learn in AR. Get paid without pressing a button.

## Features
- Instant micro-policy purchase
- AR explainer for users
- Auto payouts on API-verified events
- Fraud prevention via blockchain-style hashes

## Architecture
zerotouch-micropolicy/
├── frontend/   # HTML, CSS, JS (PWA)
├── backend/    # Node.js (Express + MongoDB)
└── docs/       # API & deployment documentation

## Tech Stack
Frontend: HTML, CSS, JS
Backend: Node.js, Express, MongoDB
Auth: JWT + bcrypt
Security: CORS, validation, rate limiting

## Demo Credentials
Customer: demo@test.com / password123
Admin: admin / zerotouch123

## Local Setup
git clone https://github.com/...
cd zerotouch-micropolicy

# Backend
cd backend
npm install
cp .env.example .env
npm start

# Visit frontend at http://localhost:5000

## Documentation
- [API Reference](docs/API.md)
- [Deployment Guide](docs/deployment.md)
