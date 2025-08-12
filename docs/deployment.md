# ZeroTouch MicroPolicy Deployment Guide

## Prerequisites
- Node.js v16+
- MongoDB Atlas account
- GitHub repository
- Render account

## Environment Variables
In backend/.env:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5000
FRONTEND_URL=https://your-frontend.onrender.com

## Backend Deployment (Render)
1. Push to GitHub
2. On Render → New Web Service
3. Set build command: cd backend && npm install
4. Set start command: cd backend && npm start
5. Add environment variables from .env
6. Deploy

## Frontend Deployment (Render)
1. New Static Site
2. Publish directory: frontend
3. Deploy

## Testing
- Visit your frontend URL.
- Create account, buy policy, simulate event as admin.
