import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import HodDashboard from './pages/HodDashboard'
import SecurityDashboard from './pages/SecurityDashboard'
import WardenDashboard from './pages/WardenDashboard'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import RequestOutpass from './pages/RequestOutpass'
import Register from './pages/Register'
import ParentApproval from './pages/ParentApproval'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/parent-approval" element={<ParentApproval />} />
        <Route path="/hod" element={<HodDashboard />} />
        <Route path="/security" element={<SecurityDashboard />} />
        <Route path="/warden" element={<WardenDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/request" element={<RequestOutpass />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
