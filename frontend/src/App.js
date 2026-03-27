import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ExamsPage from './pages/student/ExamsPage';
import GradesPage from './pages/student/GradesPage';
import AttendancePage from './pages/student/AttendancePage';
import LessonsPage from './pages/student/LessonsPage';
import SessionsPage from './pages/student/SessionsPage';
import ExamTakingPage from './pages/student/ExamTakingPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExamsPage from './pages/admin/AdminExamsPage';
import AdminLessonsPage from './pages/admin/AdminLessonsPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminSessionsPage from './pages/admin/AdminSessionsPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAttendancePage from './pages/admin/AdminAttendancePage';
import AdminGradesPage from './pages/admin/AdminGradesPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student routes */}
          <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/exams" element={<ProtectedRoute role="student"><ExamsPage /></ProtectedRoute>} />
          <Route path="/exams/:examId/take" element={<ProtectedRoute role="student"><ExamTakingPage /></ProtectedRoute>} />
          <Route path="/grades" element={<ProtectedRoute role="student"><GradesPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute role="student"><AttendancePage /></ProtectedRoute>} />
          <Route path="/lessons" element={<ProtectedRoute role="student"><LessonsPage /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute role="student"><SessionsPage /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/exams" element={<ProtectedRoute role="admin"><AdminExamsPage /></ProtectedRoute>} />
          <Route path="/admin/lessons" element={<ProtectedRoute role="admin"><AdminLessonsPage /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute role="admin"><AdminCoursesPage /></ProtectedRoute>} />
          <Route path="/admin/sessions/:courseId" element={<ProtectedRoute role="admin"><AdminSessionsPage /></ProtectedRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute role="admin"><AdminAnnouncementsPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute role="admin"><AdminAttendancePage /></ProtectedRoute>} />
          <Route path="/admin/grades" element={<ProtectedRoute role="admin"><AdminGradesPage /></ProtectedRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
