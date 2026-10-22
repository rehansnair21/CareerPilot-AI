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
  Check,
  X,
  Compass,
  Sparkles,
  Target,
  FileCheck,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

// ─── Google Sign-In Button Component ──────────────────────────────────────────
const GoogleSignInButton = ({ id = 'google-btn' }) => {
  const containerRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let checkTimer = null;
    let isMounted = true;

    const tryRender = () => {
      if (!isMounted) return false;
      if (!window.google?.accounts?.id || !containerRef.current) return false;

      try {
        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: 320,
        });
        if (isMounted) setRendered(true);
        return true;
      } catch (err) {
        console.error('[Google GSI Render Error]:', err);
        return false;
      }
    };

    if (!tryRender()) {
      checkTimer = setInterval(() => {
        if (tryRender()) {
          clearInterval(checkTimer);
        }
      }, 200);
    }

    return () => {
      isMounted = false;
      if (checkTimer) clearInterval(checkTimer);
    };
  }, []);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0', minHeight: '44px' }}>
      {!rendered && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '320px',
            height: '40px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#64748b',
          }}
        >
          Loading Google Sign-In...
        </div>
      )}
      {/* Container is completely empty of React-managed elements to prevent removeChild crashes */}
      <div
        id={id}
        ref={containerRef}
        style={{
          display: rendered ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: '40px',
        }}
      />
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

  // Exact Registration Password Rules
  const validateRegistrationPassword = (password) => {
    if (!password || (typeof password === 'string' && !password.trim())) {
      return 'Password is required.';
    }
    if (typeof password !== 'string' || password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter.';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter.';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number.';
    }
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) || /[^A-Za-z0-9\s]/.test(password);
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character.';
    }
    return null;
  };

  const validateRegistrationConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword || (typeof confirmPassword === 'string' && !confirmPassword.trim())) {
      return 'Please confirm your password.';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match.';
    }
    return null;
  };

  // Password validation rules specification for registration checklist
  const passwordRules = [
    {
      id: 'length',
      label: 'At least 8 characters long',
      valid: Boolean(regData.password && regData.password.length >= 8),
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter (A–Z)',
      valid: /[A-Z]/.test(regData.password || ''),
    },
    {
      id: 'lowercase',
      label: 'At least one lowercase letter (a–z)',
      valid: /[a-z]/.test(regData.password || ''),
    },
    {
      id: 'number',
      label: 'At least one number (0–9)',
      valid: /[0-9]/.test(regData.password || ''),
    },
    {
      id: 'special',
      label: 'At least one special character (e.g., @, #, $)',
      valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(regData.password || '') || /[^A-Za-z0-9\s]/.test(regData.password || ''),
    },
  ];

  const allPasswordRulesMet = passwordRules.every((r) => r.valid);

  // Real-time mismatch flag for confirm password
  const isConfirmPasswordMismatch = Boolean(
    (regData.confirmPassword && regData.password !== regData.confirmPassword) ||
    (regErrors.confirmPassword && regData.password !== regData.confirmPassword)
  );

  // Real-time Registration Input Handler
  const handleRegFieldChange = (fieldName, value) => {
    setRegData((prev) => ({ ...prev, [fieldName]: value }));
    setRegErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
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

  // Ref tracking current auth state for single global Google callback
  const googleAuthRef = useRef({});
  useEffect(() => {
    googleAuthRef.current = {
      isRightPanelActive,
      loginRole: loginData.role,
      regRole: regData.role,
      handleGoogleLoginSuccess,
      handleGoogleRegSuccess,
      setLoginError,
      setRegError,
    };
  }, [isRightPanelActive, loginData.role, regData.role]);

  // Initialize Google Identity Services exactly ONCE per page
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('[Google Auth]: VITE_GOOGLE_CLIENT_ID is not configured.');
      return;
    }

    const initGoogleGsi = () => {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            const state = googleAuthRef.current;
            if (response.credential) {
              if (state.isRightPanelActive) {
                await state.handleGoogleRegSuccess(response.credential);
              } else {
                await state.handleGoogleLoginSuccess(response.credential);
              }
            } else {
              const errFn = state.isRightPanelActive ? state.setRegError : state.setLoginError;
              errFn('Google Sign-In was cancelled or failed. Please try again.');
            }
          },
          use_fedcm_for_prompt: true,
          auto_select: false,
        });
      } catch (err) {
        console.error('[Google GSI Init Error]:', err);
      }
    };

    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      if (window.google?.accounts?.id) {
        initGoogleGsi();
      } else {
        existingScript.addEventListener('load', initGoogleGsi);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleGsi;
    script.onerror = () => console.error('Failed to load Google GSI script');
    document.head.appendChild(script);
  }, []);

  // Handle Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const missingName = !regData.name || !regData.name.trim();
    const shortName = !missingName && regData.name.trim().length < 2;
    const missingEmail = !regData.email || !regData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = !missingEmail && !emailRegex.test(regData.email.trim());
    const passErr = validateRegistrationPassword(regData.password);
    const confirmErr = validateRegistrationConfirmPassword(regData.confirmPassword, regData.password);

    const errs = {};
    if (missingName || shortName) errs.name = true;
    if (missingEmail || invalidEmail) errs.email = true;
    if (passErr) errs.password = true;
    if (confirmErr) errs.confirmPassword = true;

    setRegErrors(errs);

    if (missingName && missingEmail && !regData.password) {
      setRegError('Please fill in all required fields to register.');
      e.target?.closest('form')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (missingName) {
      setRegError('Please enter your full name.');
      e.target?.closest('form')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (shortName) {
      setRegError('Full name must be at least 2 characters.');
      e.target?.closest('form')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (missingEmail) {
      setRegError('Please enter your email address.');
      e.target?.closest('form')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (invalidEmail) {
      setRegError('Please enter a valid email address (e.g. user@gmail.com).');
      e.target?.closest('form')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!regData.password) {
      setRegError('Password is required.');
      return;
    }
    if (passErr) {
      setRegError('Please satisfy all password requirements.');
      return;
    }
    if (confirmErr) {
      setRegError('Passwords do not match.');
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
      setRegError(result?.message || 'Registration failed. Please try again.');
      e.target?.closest('form')?.scrollTo({ top: 0, behavior: 'smooth' });
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
          <form onSubmit={handleRegisterSubmit} autoComplete="off" noValidate>
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
              <div className="alert alert-danger" role="alert" style={{ width: '100%', boxSizing: 'border-box' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>{regError}</span>
              </div>
            )}
            {regSuccess && (
              <div className="alert alert-success" role="alert" style={{ width: '100%', boxSizing: 'border-box' }}>
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>{regSuccess}</span>
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
            <GoogleSignInButton id="google-signup-btn" />

            <OrDivider />

            {/* Name Input */}
            <div className="input-group">
              <div style={{ position: 'relative', width: '100%' }}>
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
              </div>
            </div>

            {/* Email Input */}
            <div className="input-group">
              <div style={{ position: 'relative', width: '100%' }}>
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
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group">
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  id="reg-password-input"
                  name="reg_password_field"
                  className="input-field"
                  style={regErrors.password && !allPasswordRulesMet ? { borderColor: '#f87171', backgroundColor: '#fef2f2' } : {}}
                  placeholder="Password"
                  value={regData.password}
                  onChange={(e) => handleRegFieldChange('password', e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <Lock className="input-icon" size={18} />
                <button
                  type="button"
                  id="toggle-reg-password"
                  className="toggle-password"
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  title={showRegPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowRegPassword(!showRegPassword)}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Validation Requirements Checklist - only seen when typing the password */}
              {regData.password && !allPasswordRulesMet ? (
                <div
                  id="password-requirements-checklist"
                  style={{
                    marginTop: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#5A6C66', marginBottom: '2px' }}>
                    Password Requirements:
                  </span>
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.id}
                      id={`pwd-rule-${rule.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        color: rule.valid ? '#16a34a' : '#dc2626',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {rule.valid ? (
                        <Check size={13} strokeWidth={2.8} style={{ flexShrink: 0, color: '#16a34a' }} />
                      ) : (
                        <X size={13} strokeWidth={2.8} style={{ flexShrink: 0, color: '#dc2626' }} />
                      )}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              ) : regData.password ? (
                <div
                  id="password-requirements-satisfied"
                  style={{
                    marginTop: '4px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '2px 4px',
                    textAlign: 'left',
                  }}
                >
                  <Check size={13} strokeWidth={2.8} style={{ flexShrink: 0, color: '#16a34a' }} />
                  <span>Password meets all requirements</span>
                </div>
              ) : null}
            </div>

            {/* Confirm Password Input */}
            <div className="input-group">
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  id="reg-confirm-password-input"
                  name="reg_confirm_password_field"
                  className="input-field"
                  style={isConfirmPasswordMismatch ? { borderColor: '#f87171', backgroundColor: '#fef2f2' } : {}}
                  placeholder="Confirm Password"
                  value={regData.confirmPassword}
                  onChange={(e) => handleRegFieldChange('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <Lock className="input-icon" size={18} />
                <button
                  type="button"
                  id="toggle-reg-confirm-password"
                  className="toggle-password"
                  aria-label={showRegConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  title={showRegConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                >
                  {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {isConfirmPasswordMismatch && (
                <div
                  id="reg-confirm-password-error"
                  style={{
                    color: '#dc2626',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'left',
                  }}
                >
                  <X size={13} strokeWidth={2.8} style={{ flexShrink: 0, color: '#dc2626' }} />
                  <span>Passwords do not match.</span>
                </div>
              )}

              {!isConfirmPasswordMismatch && regData.confirmPassword && regData.password === regData.confirmPassword && (
                <div
                  id="reg-confirm-password-success"
                  style={{
                    color: '#16a34a',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'left',
                  }}
                >
                  <Check size={13} strokeWidth={2.8} style={{ flexShrink: 0, color: '#16a34a' }} />
                  <span>Passwords match.</span>
                </div>
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
            <GoogleSignInButton id="google-signin-btn" />

            <OrDivider />

            {/* Email / Username Input */}
            <div className="input-group">
              <div style={{ position: 'relative', width: '100%' }}>
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
            </div>

            {/* Password Input */}
            <div className="input-group">
              <div style={{ position: 'relative', width: '100%' }}>
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
                  setRegErrors({});
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
