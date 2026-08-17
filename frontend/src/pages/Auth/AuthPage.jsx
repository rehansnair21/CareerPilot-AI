import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Compass,
  Sparkles,
  Target,
  FileCheck,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export const AuthPage = ({ initialMode = 'login' }) => {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'student') {
        navigate('/student/dashboard', { replace: true });
      } else if (user.role === 'recruiter') {
        navigate('/recruiter/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  // Panel toggle state for smooth sliding transition
  const [isRightPanelActive, setIsRightPanelActive] = useState(initialMode === 'register');

  useEffect(() => {
    setIsRightPanelActive(initialMode === 'register');
  }, [initialMode]);

  // Registration Form State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [regErrors, setRegErrors] = useState({});
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Live Registration Rule Engine
  const validateRegField = (fieldName, value, currentData = regData) => {
    if (value === undefined || value === null) return null;
    const strVal = String(value).trim();
    if (!strVal) return null;

    switch (fieldName) {
      case 'name': {
        if (strVal.length < 2) return 'Full name must be at least 2 characters';
        if (strVal.length > 80) return 'Full name cannot exceed 80 characters';
        break;
      }
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(strVal)) {
          return 'Please enter a valid email address (e.g. user@gmail.com)';
        }
        break;
      }
      case 'password': {
        if (strVal.length < 6) return 'Password must be at least 6 characters long';
        break;
      }
      case 'confirmPassword': {
        if (strVal !== currentData.password) return 'Passwords do not match';
        break;
      }
      default:
        return null;
    }
    return null;
  };

  // Instant Live Registration Input Handler
  const handleRegFieldChange = (fieldName, value) => {
    setRegData((prev) => {
      const updated = { ...prev, [fieldName]: value };
      const fieldErr = validateRegField(fieldName, value, updated);

      setRegErrors((prevErrors) => {
        const newErrs = { ...prevErrors, [fieldName]: fieldErr };
        if (fieldName === 'password' && updated.confirmPassword) {
          newErrs.confirmPassword = validateRegField('confirmPassword', updated.confirmPassword, updated);
        }
        return newErrs;
      });

      return updated;
    });

    setRegError('');
  };

  // Login Form State
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    role: 'student',
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Reset all forms to empty values on page load
  useEffect(() => {
    setLoginData({ email: '', password: '', role: 'student' });
    setRegData({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
    setRegErrors({});
  }, []);

  // Roles definition with feature highlights
  const roles = [
    {
      id: 'student',
      title: 'Student',
      icon: <GraduationCap className="role-icon-svg" size={20} />,
      desc: 'AI Roadmaps & Skill Analysis',
    },
    {
      id: 'mentor',
      title: 'Mentor',
      icon: <Users className="role-icon-svg" size={20} />,
      desc: 'Guide & Conduct 1-on-1 Sessions',
    },
    {
      id: 'recruiter',
      title: 'Recruiter',
      icon: <Briefcase className="role-icon-svg" size={20} />,
      desc: 'Discover & Hire Top Talent',
    },
    {
      id: 'admin',
      title: 'Admin',
      icon: <ShieldCheck className="role-icon-svg" size={20} />,
      desc: 'System & Database Control',
    },
  ];

  // Handle Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    // Comprehensive validation check before submit
    const errs = {};
    if (!regData.name.trim()) {
      errs.name = 'Please enter your full name';
    } else if (regData.name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }

    if (!regData.email.trim()) {
      errs.email = 'Please enter your email address';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(regData.email.trim())) {
        errs.email = 'Please enter a valid email address (e.g. user@gmail.com)';
      }
    }

    if (!regData.password) {
      errs.password = 'Please enter a password';
    } else if (regData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters long';
    }

    if (!regData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (regData.password !== regData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setRegErrors(errs);
    if (Object.keys(errs).length > 0) {
      setRegError('Please resolve errors in the registration form');
      return;
    }

    setRegLoading(true);
    const result = await register(regData);
    setRegLoading(false);

    if (result && result.success) {
      const registeredEmail = regData.email;
      const registeredRole = regData.role || 'student';

      setRegSuccess('Registration successful! Redirecting to login...');

      // Pre-fill login data with registered credentials
      setLoginData({
        email: registeredEmail,
        password: '',
        role: registeredRole,
      });

      // Clear registration form
      setRegData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
      });
      setRegErrors({});

      // Slide smoothly to Login panel after short pause
      setTimeout(() => {
        setIsRightPanelActive(false);
        setLoginSuccess(`Account created for ${registeredEmail}! Please enter your password to log in.`);
        setRegSuccess('');
      }, 700);
    } else {
      setRegError(result?.message || 'Registration failed');
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    if (!loginData.email.trim()) {
      setLoginError('Please enter your email address');
      return;
    }
    if (!loginData.password) {
      setLoginError('Please enter your password');
      return;
    }

    setLoginLoading(true);
    const result = await login(loginData);
    setLoginLoading(false);

    if (result.success) {
      setLoginSuccess('Login successful! Welcome to Career Pilot AI.');
    } else {
      setLoginError(result.message);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Background Decorative Glows */}
      <div className="auth-bg-circle-1"></div>
      <div className="auth-bg-circle-2"></div>

      <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">

        {/* ================= REGISTER FORM (Sign Up) ================= */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleRegisterSubmit} autoComplete="off">
            {/* Dummy hidden inputs to intercept browser autofill */}
            <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

            {/* Brand Logo Header */}
            <div className="brand-header">
              <div className="brand-logo">
                <Compass className="brand-icon" size={26} />
              </div>
              <div className="brand-title-group">
                <span className="brand-name">Career Pilot <span className="brand-ai-badge">AI</span></span>
              </div>
            </div>

            <h1>Create Account</h1>
            <p className="subtitle">Register to unlock AI-powered career roadmaps & mentorship</p>

            {regError && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{regError}</span>
              </div>
            )}
            {regSuccess && (
              <div className="alert alert-success">
                <CheckCircle size={16} />
                <span>{regSuccess}</span>
              </div>
            )}

            {/* Role Selection */}
            <div className="role-selector-container">
              <span className="role-label">Select Your Account Type:</span>
              <div className="role-options">
                {roles.map((r) => (
                  <div
                    key={`reg-${r.id}`}
                    className={`role-card ${regData.role === r.id ? 'selected' : ''}`}
                    onClick={() => setRegData({ ...regData, role: r.id })}
                  >
                    <input
                      type="radio"
                      name="regRole"
                      value={r.id}
                      checked={regData.role === r.id}
                      onChange={() => { }}
                    />
                    <div className="role-icon">{r.icon}</div>
                    <span className="role-title">{r.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="input-group">
              <input
                type="text"
                name="reg_fullname_field"
                className="input-field"
                style={regErrors.name ? { borderColor: '#f87171', backgroundColor: '#fef2f2' } : {}}
                placeholder="Full Name"
                value={regData.name}
                onChange={(e) => handleRegFieldChange('name', e.target.value)}
                autoComplete="off"
                required
              />
              <User className="input-icon" size={18} />
              {regErrors.name && (
                <span className="field-error-msg" style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {regErrors.name}
                </span>
              )}
            </div>

            {/* Email Input */}
            <div className="input-group">
              <input
                type="email"
                name="reg_email_field"
                className="input-field"
                style={regErrors.email ? { borderColor: '#f87171', backgroundColor: '#fef2f2' } : {}}
                placeholder="Email Address (e.g. user@gmail.com)"
                value={regData.email}
                onChange={(e) => handleRegFieldChange('email', e.target.value)}
                autoComplete="off"
                required
              />
              <Mail className="input-icon" size={18} />
              {regErrors.email && (
                <span className="field-error-msg" style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {regErrors.email}
                </span>
              )}
            </div>

            {/* Password Input */}
            <div className="input-group">
              <input
                type={showRegPassword ? 'text' : 'password'}
                name="reg_password_field"
                className="input-field"
                style={regErrors.password ? { borderColor: '#f87171', backgroundColor: '#fef2f2' } : {}}
                placeholder="Password (min. 6 chars)"
                value={regData.password}
                onChange={(e) => handleRegFieldChange('password', e.target.value)}
                autoComplete="new-password"
                required
              />
              <Lock className="input-icon" size={18} />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowRegPassword(!showRegPassword)}
              >
                {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {regErrors.password && (
                <span className="field-error-msg" style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {regErrors.password}
                </span>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="input-group">
              <input
                type={showRegConfirmPassword ? 'text' : 'password'}
                name="reg_confirm_password_field"
                className="input-field"
                style={regErrors.confirmPassword ? { borderColor: '#f87171', backgroundColor: '#fef2f2' } : {}}
                placeholder="Confirm Password"
                value={regData.confirmPassword}
                onChange={(e) => handleRegFieldChange('confirmPassword', e.target.value)}
                autoComplete="new-password"
                required
              />
              <Lock className="input-icon" size={18} />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
              >
                {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {regErrors.confirmPassword && (
                <span className="field-error-msg" style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {regErrors.confirmPassword}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-primary" disabled={regLoading}>
              {regLoading ? <div className="spinner"></div> : 'Register Account'}
            </button>
          </form>
        </div>

        {/* ================= LOGIN FORM (Sign In) ================= */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLoginSubmit} autoComplete="off">
            {/* Dummy hidden inputs to intercept browser autofill */}
            <input type="text" name="prevent_autofill_login_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="prevent_autofill_login_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

            {/* Brand Logo Header */}
            <div className="brand-header">
              <div className="brand-logo">
                <Compass className="brand-icon" size={26} />
              </div>
              <div className="brand-title-group">
                <span className="brand-name">Career Pilot <span className="brand-ai-badge">AI</span></span>
              </div>
            </div>

            <h1>Welcome Back</h1>
            <p className="subtitle">Sign in to launch your AI career dashboard</p>

            {loginError && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}
            {loginSuccess && (
              <div className="alert alert-success">
                <CheckCircle size={16} />
                <span>{loginSuccess}</span>
              </div>
            )}

            {/* Role Selection */}
            <div className="role-selector-container">
              <span className="role-label">Login As:</span>
              <div className="role-options">
                {roles.map((r) => (
                  <div
                    key={`login-${r.id}`}
                    className={`role-card ${loginData.role === r.id ? 'selected' : ''}`}
                    onClick={() => setLoginData({ ...loginData, role: r.id })}
                  >
                    <input
                      type="radio"
                      name="loginRole"
                      value={r.id}
                      checked={loginData.role === r.id}
                      onChange={() => { }}
                    />
                    <div className="role-icon">{r.icon}</div>
                    <span className="role-title">{r.title}</span>
                  </div>
                ))}
              </div>
            </div>



            {/* Email / Username Input */}
            <div className="input-group">
              <input
                type="text"
                name="login_email_field"
                className="input-field"
                placeholder={loginData.role === 'admin' ? "Admin Username or Email" : "Email Address"}
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                autoComplete="off"
                required
              />
              <Mail className="input-icon" size={18} />
            </div>

            {/* Password Input */}
            <div className="input-group">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                name="login_password_field"
                className="input-field"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                autoComplete="new-password"
                required
              />
              <Lock className="input-icon" size={18} />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
              >
                {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-primary" disabled={loginLoading}>
              {loginLoading ? <div className="spinner"></div> : 'Sign In'}
            </button>
          </form>
        </div>

        {/* ================= OVERLAY SLIDING PANEL ================= */}
        <div className="overlay-container">
          <div className="overlay">
            {/* Left Overlay (shown during Register mode) */}
            <div className="overlay-panel overlay-left">
              <div className="overlay-brand">
                <Compass size={32} />
                <h2>Career Pilot AI</h2>
              </div>
              <h1>Already Registered?</h1>
              <p>Log in to access your saved career roadmaps, mentor sessions, and hiring pipelines.</p>

              {/* Project Functionalities Showcase */}
              <div className="project-features-list">
                <div className="feature-item">
                  <Sparkles size={16} className="feature-icon" />
                  <span>AI Resume & Skill Gap Analysis</span>
                </div>
                <div className="feature-item">
                  <Target size={16} className="feature-icon" />
                  <span>Personalized Learning Pathways</span>
                </div>
              </div>

              <button
                className="btn-ghost"
                onClick={() => {
                  setIsRightPanelActive(false);
                  setRegError('');
                  setRegSuccess('');
                }}
              >
                Sign In
              </button>
            </div>

            {/* Right Overlay (shown during Login mode) */}
            <div className="overlay-panel overlay-right">
              <div className="overlay-brand">
                <Compass size={32} />
                <h2>Career Pilot AI</h2>
              </div>
              <h1>Navigate Your Career</h1>
              <p>Join thousands of students, mentors, and recruiters leveraging AI for intelligent career growth.</p>

              {/* Project Functionalities Showcase */}
              <div className="project-features-list">
                <div className="feature-item">
                  <TrendingUp size={16} className="feature-icon" />
                  <span>Smart AI Career Matchmaker</span>
                </div>
                <div className="feature-item">
                  <FileCheck size={16} className="feature-icon" />
                  <span>1-on-1 Verified Mentorship</span>
                </div>
              </div>

              <button
                className="btn-ghost"
                onClick={() => {
                  setIsRightPanelActive(true);
                  setLoginError('');
                  setLoginSuccess('');
                }}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
