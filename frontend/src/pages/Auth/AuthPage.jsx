import React, { useState, useEffect, useRef } from 'react';
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

// ─── Google Sign-In Button Component ──────────────────────────────────────────
const GoogleSignInButton = ({ onSuccess, onError, role }) => {
  const btnRef = useRef(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load the Google GSI script if not already loaded
    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      if (window.google && window.google.accounts) {
        setGoogleLoaded(true);
      } else {
        existingScript.addEventListener('load', () => setGoogleLoaded(true));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    script.onerror = () => console.error('Failed to load Google GSI script');
    document.head.appendChild(script);
  }, []);

  const handleGoogleClick = () => {
    if (!window.google || !window.google.accounts) {
      onError('Google Sign-In is not ready yet. Please try again.');
      return;
    }

    setLoading(true);

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setLoading(false);
        if (response.credential) {
          await onSuccess(response.credential);
        } else {
          onError('Google Sign-In was cancelled or failed. Please try again.');
        }
      },
      use_fedcm_for_prompt: true, // Opt in to FedCM to comply with Chrome and Edge
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Use prompt() with FedCM to show Google One Tap / account chooser
    window.google.accounts.id.prompt((notification) => {
      setLoading(false);
      // Modern FedCM status inspection (avoids deprecated isNotDisplayed / isSkippedMoment)
      if (typeof notification.getMomentType === 'function') {
        const moment = notification.getMomentType();
        if (moment === 'dismissed' || moment === 'skipped') {
          console.warn('[Google Auth]: One Tap prompt dismissed or skipped.');
        }
      }
    });
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Hidden div for GSI button fallback */}
      <div ref={btnRef} style={{ display: 'none' }}></div>

      <button
        type="button"
        className="btn-google"
        onClick={handleGoogleClick}
        disabled={loading || !googleLoaded}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          padding: '11px 20px',
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '10px',
          cursor: loading || !googleLoaded ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          color: '#1e293b',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          opacity: !googleLoaded ? 0.7 : 1,
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          if (!loading && googleLoaded) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {loading ? (
          <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </g>
          </svg>
        )}
        <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
      </button>
    </div>
  );
};

// ─── Divider Component ─────────────────────────────────────────────────────────
const OrDivider = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '4px 0',
    width: '100%',
  }}>
    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', whiteSpace: 'nowrap' }}>or continue with email</span>
    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
  </div>
);

// ─── Main AuthPage Component ───────────────────────────────────────────────────
export const AuthPage = ({ initialMode = 'login' }) => {
  const { user, login, register, loginWithGoogle } = useAuth();
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
      } else if (user.role === 'mentor') {
        navigate('/mentor/dashboard', { replace: true });
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
  ];

  // ─── Google Sign-In Handlers ─────────────────────────────────────────────────

  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);
  const [googleRegLoading, setGoogleRegLoading] = useState(false);

  const handleGoogleLoginSuccess = async (credential) => {
    setGoogleLoginLoading(true);
    setLoginError('');
    setLoginSuccess('');
    const result = await loginWithGoogle(credential, loginData.role);
    setGoogleLoginLoading(false);
    if (result && result.success) {
      setLoginSuccess('Google sign-in successful! Welcome to Career Pilot AI.');
    } else {
      setLoginError(result?.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleRegSuccess = async (credential) => {
    setGoogleRegLoading(true);
    setRegError('');
    setRegSuccess('');
    const result = await loginWithGoogle(credential, regData.role);
    setGoogleRegLoading(false);
    if (result && result.success) {
      setRegSuccess('Google account connected successfully! Redirecting...');
    } else {
      setRegError(result?.message || 'Google sign-up failed. Please try again.');
    }
  };

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

            {/* Google Sign-Up Button */}
            <GoogleSignInButton
              role={regData.role}
              onSuccess={handleGoogleRegSuccess}
              onError={(msg) => setRegError(msg)}
            />

            <OrDivider />

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

            {/* Google Sign-In Button */}
            <GoogleSignInButton
              role={loginData.role}
              onSuccess={handleGoogleLoginSuccess}
              onError={(msg) => setLoginError(msg)}
            />

            <OrDivider />

            {/* Email / Username Input */}
            <div className="input-group">
              <input
                type="text"
                name="login_email_field"
                className="input-field"
                placeholder="Email Address or Username"
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
