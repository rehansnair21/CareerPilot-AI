import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/Auth/AuthPage';
import { LandingPage } from './components/landing/LandingPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfilePage } from './pages/student/StudentProfile';

// Recruiter Dashboard Pages
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { RecruiterProfilePage } from './pages/recruiter/RecruiterProfile';
import { PostJobPage } from './pages/recruiter/PostJob';
import { MyJobsPage } from './pages/recruiter/MyJobs';
import { ApplicationsPage } from './pages/recruiter/Applications';
import { CandidatesPage } from './pages/recruiter/Candidates';

// Admin Dashboard Page
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Mentor Dashboard Page
import { MentorDashboardPage } from './pages/mentor/MentorDashboard';

import { ArrowLeft } from 'lucide-react';

const RootContent = () => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuth(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
  };

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate role dashboard
  if (user) {
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (user.role === 'recruiter') {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'mentor') {
      return <Navigate to="/mentor/dashboard" replace />;
    }
    return <Navigate to="/mentor/dashboard" replace />;
  }

  // Unauthenticated user
  if (showAuth) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleBackToLanding}
          className="btn-landing-secondary"
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 9999,
            height: '44px',
            padding: '0 18px',
            fontSize: '14px',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
        <AuthPage initialMode={authMode} />
      </div>
    );
  }

  return <LandingPage onOpenAuth={handleOpenAuth} />;
};

// Protected Student Route Wrapper
const StudentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    );
  }
  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Mentor Route Wrapper
const MentorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    );
  }
  if (!user || user.role !== 'mentor') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Recruiter Route Wrapper
const RecruiterRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    );
  }
  if (!user || user.role !== 'recruiter') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootContent />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
          <Route path="/student/profile" element={<StudentRoute><StudentProfilePage /></StudentRoute>} />

          {/* Mentor Routes */}
          <Route path="/mentor/dashboard" element={<MentorRoute><MentorDashboardPage /></MentorRoute>} />
          <Route path="/mentor/profile" element={<MentorRoute><MentorDashboardPage /></MentorRoute>} />

          {/* Recruiter Routes */}
          <Route path="/recruiter/dashboard" element={<RecruiterRoute><RecruiterDashboard /></RecruiterRoute>} />
          <Route path="/recruiter/profile" element={<RecruiterRoute><RecruiterProfilePage /></RecruiterRoute>} />
          <Route path="/recruiter/jobs/new" element={<RecruiterRoute><PostJobPage /></RecruiterRoute>} />
          <Route path="/recruiter/jobs" element={<RecruiterRoute><MyJobsPage /></RecruiterRoute>} />
          <Route path="/recruiter/applications" element={<RecruiterRoute><ApplicationsPage /></RecruiterRoute>} />
          <Route path="/recruiter/candidates" element={<RecruiterRoute><CandidatesPage /></RecruiterRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
