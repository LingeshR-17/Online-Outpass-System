# Deployment Guide: Outpass Management System

This guide explains how to host your backend and frontend so that parents can access the system from anywhere.

## 1. Backend Hosting (on [Render](https://render.com))
Render is free and easy for Express apps.

- **Create a Web Service**: Link your GitHub repo.
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Add these in the "Environment" tab:
  - `PORT`: `5000`
  - `EMAIL_USER`: Your Gmail address
  - `EMAIL_PASS`: Your Google App Password
  - `FRONTEND_URL`: The URL of your frontend (e.g., `https://your-app.vercel.app`)

## 2. Frontend Hosting (on [Vercel](https://vercel.com))
Vercel is the best for React/Vite apps.

- **Import Project**: Link your GitHub repo.
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Environment Variables**: Add this in the "Environment" tab:
  - `VITE_BACKEND_URL`: Your Render backend URL (e.g., `https://your-backend.onrender.com`)

## 3. Firebase Configuration
- Go to the [Firebase Console](https://console.firebase.google.com/).
- Navigate to **Authentication > Settings > Authorized Domains**.
- Add both your Vercel URL and Render URL to the whitelist.

---

## 4. Local Network Testing (Mobile on Wi-Fi)
If you just want to test on your phone over Wi-Fi **now**:
1. Run `ipconfig` to find your IPv4 address (e.g., `192.168.1.5`).
2. In `backend/.env`, set `FRONTEND_URL=http://192.168.1.5:5173`.
3. In `frontend/.env`, set `VITE_BACKEND_URL=http://192.168.1.5:5000`.
4. Restart both servers.
5. On your phone, visit `http://192.168.1.5:5173`.
