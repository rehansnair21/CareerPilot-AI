import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

import {
  Users,
  LogOut,
  Compass,
  Calendar,
  Award,
  ArrowLeft,
} from 'lucide-react';

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

  // If user is authenticated
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

    // Default portal fallback for Mentor
    return <MentorPortal user={user} />;
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

const MentorPortal = ({ user }) => {
  const { logout } = useAuth();
  const mentorFeatures = [
    {
      icon: <Calendar size={20} />,
      title: 'Mentorship Scheduler',
      desc: 'Manage availability slots and conduct 1-on-1 career guidance calls with students.',
    },
    {
      icon: <Users size={20} />,
      title: 'Student Roadmaps Review',
      desc: 'Review and approve student learning milestones and provide feedback.',
    },
    {
      icon: <Award size={20} />,
      title: 'Mentor Impact & Badges',
      desc: 'Track student outcomes, feedback ratings, and earn verified mentor status.',
    },
  ];

  return (
    <div className="auth-wrapper">
      <div className="auth-bg-circle-1"></div>
      <div className="auth-bg-circle-2"></div>

      <div className="dashboard-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
          <div className="brand-logo" style={{ width: '34px', height: '34px' }}>
            <Compass size={20} />
          </div>
          <span className="brand-name" style={{ fontSize: '20px' }}>
            Career Pilot <span className="brand-ai-badge">AI</span>
          </span>
        </div>

        <div className="dashboard-badge">Mentor Portal</div>
        <h1>Welcome Back, {user.name}!</h1>
        <p className="subtitle" style={{ marginTop: '6px' }}>
          Logged in as <strong>{user.email}</strong> • Role: <strong>Mentor</strong>
        </p>

        <div style={{ textAlign: 'left', marginTop: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--gray-800)', marginBottom: '4px' }}>
            🚀 Mentorship Dashboard:
          </h3>
          <div className="dashboard-grid">
            {mentorFeatures.map((feat, index) => (
              <div key={index} className="dashboard-card">
                <div className="card-header-icon">{feat.icon}</div>
                <div className="card-title">{feat.title}</div>
                <div className="card-desc">{feat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={logout} className="btn-primary" style={{ maxWidth: '220px', margin: '20px auto 0' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
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
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />

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

