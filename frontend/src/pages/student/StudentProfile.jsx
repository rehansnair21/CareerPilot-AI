import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { TopNavbar } from '../../components/dashboard/TopNavbar';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Code,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  X,
  RefreshCw,
  Camera,
  Upload,
  Trash2,
  Award,
  Globe,
  Check,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳', label: 'India (+91)' },
  { code: '+1', country: 'US', flag: '🇺🇸', label: 'USA / Canada (+1)' },
  { code: '+44', country: 'GB', flag: '🇬🇧', label: 'UK (+44)' },
  { code: '+61', country: 'AU', flag: '🇦🇺', label: 'Australia (+61)' },
  { code: '+971', country: 'AE', flag: '🇦🇪', label: 'UAE (+971)' },
  { code: '+65', country: 'SG', flag: '🇸🇬', label: 'Singapore (+65)' },
  { code: '+49', country: 'DE', flag: '🇩🇪', label: 'Germany (+49)' },
  { code: '+33', country: 'FR', flag: '🇫🇷', label: 'France (+33)' },
  { code: '+81', country: 'JP', flag: '🇯🇵', label: 'Japan (+81)' },
  { code: '+86', country: 'CN', flag: '🇨🇳', label: 'China (+86)' },
  { code: '+966', country: 'SA', flag: '🇸🇦', label: 'Saudi Arabia (+966)' },
  { code: '+974', country: 'QA', flag: '🇶🇦', label: 'Qatar (+974)' },
  { code: '+965', country: 'KW', flag: '🇰🇼', label: 'Kuwait (+965)' },
  { code: '+968', country: 'OM', flag: '🇴🇲', label: 'Oman (+968)' },
  { code: '+973', country: 'BH', flag: '🇧🇭', label: 'Bahrain (+973)' },
  { code: '+977', country: 'NP', flag: '🇳🇵', label: 'Nepal (+977)' },
  { code: '+94', country: 'LK', flag: '🇱🇰', label: 'Sri Lanka (+94)' },
  { code: '+880', country: 'BD', flag: '🇧🇩', label: 'Bangladesh (+880)' },
  { code: '+92', country: 'PK', flag: '🇵🇰', label: 'Pakistan (+92)' },
  { code: '+60', country: 'MY', flag: '🇲🇾', label: 'Malaysia (+60)' },
  { code: '+62', country: 'ID', flag: '🇮🇩', label: 'Indonesia (+62)' },
  { code: '+63', country: 'PH', flag: '🇵🇭', label: 'Philippines (+63)' },
  { code: '+66', country: 'TH', flag: '🇹🇭', label: 'Thailand (+66)' },
  { code: '+84', country: 'VN', flag: '🇻🇳', label: 'Vietnam (+84)' },
  { code: '+64', country: 'NZ', flag: '🇳🇿', label: 'New Zealand (+64)' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', label: 'South Africa (+27)' },
  { code: '+234', country: 'NG', flag: '🇳🇬', label: 'Nigeria (+234)' },
  { code: '+254', country: 'KE', flag: '🇰🇪', label: 'Kenya (+254)' },
  { code: '+20', country: 'EG', flag: '🇪🇬', label: 'Egypt (+20)' },
  { code: '+55', country: 'BR', flag: '🇧🇷', label: 'Brazil (+55)' },
  { code: '+52', country: 'MX', flag: '🇲🇽', label: 'Mexico (+52)' },
  { code: '+39', country: 'IT', flag: '🇮🇹', label: 'Italy (+39)' },
  { code: '+34', country: 'ES', flag: '🇪🇸', label: 'Spain (+34)' },
  { code: '+31', country: 'NL', flag: '🇳🇱', label: 'Netherlands (+31)' },
  { code: '+46', country: 'SE', flag: '🇸🇪', label: 'Sweden (+46)' },
  { code: '+41', country: 'CH', flag: '🇨🇭', label: 'Switzerland (+41)' },
  { code: '+353', country: 'IE', flag: '🇮🇪', label: 'Ireland (+353)' },
  { code: '+82', country: 'KR', flag: '🇰🇷', label: 'South Korea (+82)' },
];

const parsePhoneNumber = (phoneStr = '') => {
  const trimmed = (phoneStr || '').trim();
  if (!trimmed) return { countryCode: '+91', number: '' };

  const matched = COUNTRY_CODES.find((c) => trimmed.startsWith(c.code));
  if (matched) {
    const rawNumber = trimmed.slice(matched.code.length).trim().replace(/^[-\s]+/, '');
    return { countryCode: matched.code, number: rawNumber };
  }

  if (trimmed.startsWith('+')) {
    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx > 0) {
      return {
        countryCode: trimmed.slice(0, spaceIdx),
        number: trimmed.slice(spaceIdx + 1).trim(),
      };
    }
  }

  return { countryCode: '+91', number: trimmed };
};

export const StudentProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [activeNavSection, setActiveNavSection] = useState('sec-personal');

  const fileInputRef = useRef(null);

  // Loading & Error States
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetToast, setResetToast] = useState(false);

  // Field Validation Errors
  const [errors, setErrors] = useState({});

  // Profile Form State
  const [profileData, setProfileData] = useState({
    phone: '',
    profilePhoto: '',
    college: '',
    degree: '',
    specialization: '',
    graduationYear: '',
    cgpa: '',
    targetCareer: '',
    preferredJobRole: '',
    careerInterests: '',
    technicalSkills: [],
    softSkills: [],
    linkedin: '',
    github: '',
    portfolio: '',
    profileCompletion: 0,
  });

  // Backup of last saved profile state for instant resetting
  const [savedProfileData, setSavedProfileData] = useState(null);

  // Skill input buffers
  const [newTechSkill, setNewTechSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');

  // Target Domain Options
  const targetCareerDomains = [
    { id: 'Software Development', label: 'Software Development' },
    { id: 'Data Science', label: 'Data Science & Analytics' },
    { id: 'AI / Machine Learning', label: 'AI / Machine Learning' },
    { id: 'Cybersecurity', label: 'Cybersecurity' },
    { id: 'Cloud Computing', label: 'Cloud & DevOps' },
    { id: 'UI/UX Design', label: 'UI/UX Design' },
  ];

  // Preset skill suggestions
  const techSkillPresets = ['React', 'Node.js', 'Python', 'JavaScript', 'MongoDB', 'Java', 'SQL', 'TypeScript', 'Docker', 'AWS'];
  const softSkillPresets = ['Problem Solving', 'Communication', 'Teamwork', 'Critical Thinking', 'Adaptability', 'Leadership'];

  // Dispatch custom profile update event for top navbar & sidebar sync
  const notifyProfileUpdated = (photoUrl) => {
    window.dispatchEvent(
      new CustomEvent('profileUpdated', {
        detail: { profilePhoto: photoUrl || '' },
      })
    );
  };

  // Fetch student profile from backend MongoDB API
  const fetchProfile = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await api.get('/student/profile');
      if (res.data && res.data.success) {
        const p = res.data.data.profile;
        const loaded = {
          phone: p.phone || '',
          profilePhoto: p.profilePhoto || '',
          college: p.college || '',
          degree: p.degree || '',
          specialization: p.specialization || '',
          graduationYear: p.graduationYear || '',
          cgpa: p.cgpa || '',
          targetCareer: p.targetCareer || '',
          preferredJobRole: p.preferredJobRole || '',
          careerInterests: p.careerInterests || '',
          technicalSkills: Array.isArray(p.technicalSkills) ? p.technicalSkills : [],
          softSkills: Array.isArray(p.softSkills) ? p.softSkills : [],
          linkedin: p.linkedin || '',
          github: p.github || '',
          portfolio: p.portfolio || '',
          profileCompletion: p.profileCompletion || 0,
        };
        setProfileData(JSON.parse(JSON.stringify(loaded)));
        setSavedProfileData(JSON.parse(JSON.stringify(loaded)));
        notifyProfileUpdated(loaded.profilePhoto);
      } else {
        setFetchError(res.data?.message || 'Unable to fetch student profile');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setFetchError(err.response?.data?.message || 'Failed to connect to profile service');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Live Validation Rule Engine for Profile Fields
  const validateSingleField = (name, value, currentData = profileData) => {
    if (value === undefined || value === null) return null;
    const strVal = String(value).trim();
    if (!strVal) return null; // Empty fields are allowed until user fills them

    switch (name) {
      case 'phone': {
        const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
        if (!phoneRegex.test(strVal)) {
          return 'Enter a valid phone number (7 to 15 digits)';
        }
        break;
      }
      case 'college': {
        if (strVal.length > 120) {
          return 'College name cannot exceed 120 characters';
        }
        break;
      }
      case 'degree': {
        if (strVal.length > 80) {
          return 'Degree title cannot exceed 80 characters';
        }
        break;
      }
      case 'specialization': {
        if (strVal.length > 100) {
          return 'Specialization cannot exceed 100 characters';
        }
        break;
      }
      case 'graduationYear': {
        const yr = parseInt(strVal);
        if (isNaN(yr) || yr < 2000 || yr > 2035) {
          return 'Graduation year must be between 2000 and 2035';
        }
        break;
      }
      case 'cgpa': {
        const num = parseFloat(strVal);
        if (isNaN(num) || num < 0 || num > 100) {
          return 'CGPA / Percentage must be a valid number between 0 and 100';
        }
        break;
      }
      case 'preferredJobRole': {
        if (strVal.length > 100) {
          return 'Preferred job role cannot exceed 100 characters';
        }
        break;
      }
      case 'careerInterests': {
        if (strVal.length > 250) {
          return 'Career interests cannot exceed 250 characters';
        }
        break;
      }
      case 'linkedin': {
        const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
        const normalized = normalizeUrl(strVal);
        if (!urlRegex.test(normalized) || !normalized.toLowerCase().includes('linkedin')) {
          return 'Must be a valid LinkedIn profile URL (e.g. linkedin.com/in/username)';
        }
        break;
      }
      case 'github': {
        const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
        const normalized = normalizeUrl(strVal);
        if (!urlRegex.test(normalized) || !normalized.toLowerCase().includes('github')) {
          return 'Must be a valid GitHub profile URL (e.g. github.com/username)';
        }
        break;
      }
      case 'portfolio': {
        const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
        const normalized = normalizeUrl(strVal);
        if (!urlRegex.test(normalized)) {
          return 'Must be a valid portfolio URL (e.g. myportfolio.dev)';
        }
        break;
      }
      default:
        return null;
    }
    return null;
  };

  // Instant Live Input Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => {
      const updated = { ...prev, [name]: value };
      const liveErr = validateSingleField(name, value, updated);
      setErrors((prevErrs) => ({ ...prevErrs, [name]: liveErr }));
      return updated;
    });

    setSaveError(null);
    setSaveSuccess(false);
    setResetToast(false);
  };

  // Helper to scroll smoothly to the first error input field
  const scrollToFirstError = (errs) => {
    const errorKeys = Object.keys(errs);
    if (errorKeys.length > 0) {
      const firstElem = document.getElementsByName(errorKeys[0])[0];
      if (firstElem) {
        firstElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstElem.focus();
      }
    }
  };

  // Select Career Domain Handler
  const handleSelectDomain = (domainId) => {
    setProfileData((prev) => ({ ...prev, targetCareer: domainId }));
    setSaveError(null);
    setSaveSuccess(false);
    setResetToast(false);
  };

  // Image File Selection Handler with Canvas Compression
  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Profile photo size must be less than 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to crisp 300x300 avatar thumbnail
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProfileData((prev) => ({ ...prev, profilePhoto: compressedDataUrl }));
        setSaveError(null);
        setSaveSuccess(false);
        setResetToast(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileData((prev) => ({ ...prev, profilePhoto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setResetToast(false);
  };

  // Skill Handlers
  const handleAddTechnicalSkill = (valToAdd) => {
    const val = typeof valToAdd === 'string' ? valToAdd.trim() : newTechSkill.trim();
    if (val && !profileData.technicalSkills.includes(val)) {
      setProfileData((prev) => ({
        ...prev,
        technicalSkills: [...prev.technicalSkills, val],
      }));
      setNewTechSkill('');
      setResetToast(false);
    }
  };

  const handleRemoveTechnicalSkill = (skillToRemove) => {
    setProfileData((prev) => ({
      ...prev,
      technicalSkills: prev.technicalSkills.filter((s) => s !== skillToRemove),
    }));
    setResetToast(false);
  };

  const handleAddSoftSkill = (valToAdd) => {
    const val = typeof valToAdd === 'string' ? valToAdd.trim() : newSoftSkill.trim();
    if (val && !profileData.softSkills.includes(val)) {
      setProfileData((prev) => ({
        ...prev,
        softSkills: [...prev.softSkills, val],
      }));
      setNewSoftSkill('');
      setResetToast(false);
    }
  };

  const handleRemoveSoftSkill = (skillToRemove) => {
    setProfileData((prev) => ({
      ...prev,
      softSkills: prev.softSkills.filter((s) => s !== skillToRemove),
    }));
    setResetToast(false);
  };

  // Helper to normalize URLs (auto-prefixes https:// if missing)
  const normalizeUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleUrlBlur = (e) => {
    const { name, value } = e.target;
    if (value && value.trim()) {
      const formatted = normalizeUrl(value);
      setProfileData((prev) => {
        const updated = { ...prev, [name]: formatted };
        const liveErr = validateSingleField(name, formatted, updated);
        setErrors((prevErrs) => ({ ...prevErrs, [name]: liveErr }));
        return updated;
      });
    }
  };

  // Comprehensive Form Validation
  const validateForm = () => {
    const errs = {};
    const fieldsToValidate = [
      'phone',
      'college',
      'degree',
      'specialization',
      'graduationYear',
      'cgpa',
      'preferredJobRole',
      'careerInterests',
      'linkedin',
      'github',
      'portfolio',
    ];

    fieldsToValidate.forEach((fieldName) => {
      const val = profileData[fieldName];
      const liveErr = validateSingleField(fieldName, val, profileData);
      if (liveErr) {
        errs[fieldName] = liveErr;
      }
    });

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      scrollToFirstError(errs);
    }
    return Object.keys(errs).length === 0;
  };

  // Reset Form Handler (Restores form to last saved database state)
  const handleResetForm = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrors({});
    setSaveError(null);
    setSaveSuccess(false);
    setNewTechSkill('');
    setNewSoftSkill('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (savedProfileData) {
      const restored = JSON.parse(JSON.stringify(savedProfileData));
      setProfileData(restored);
      notifyProfileUpdated(restored.profilePhoto);
    }
    
    fetchProfile();
    setResetToast(true);
    setTimeout(() => setResetToast(false), 3500);
  };

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      setSaveError('Please correct the validation errors highlighted below before saving.');
      return;
    }

    // Auto-normalize professional links before sending payload
    const normalizedData = {
      ...profileData,
      linkedin: profileData.linkedin ? normalizeUrl(profileData.linkedin) : '',
      github: profileData.github ? normalizeUrl(profileData.github) : '',
      portfolio: profileData.portfolio ? normalizeUrl(profileData.portfolio) : '',
    };

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    setResetToast(false);

    try {
      const res = await api.put('/student/profile', normalizedData);
      if (res.data && res.data.success) {
        const updated = {
          ...normalizedData,
          profileCompletion: res.data.data.profileCompletion,
        };
        setProfileData(updated);
        setSavedProfileData(updated);
        notifyProfileUpdated(updated.profilePhoto);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.data?.message || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      const msg = err.response?.data?.message || 'Error saving profile to MongoDB';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveNavSection(sectionId);
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const isRealProfileImage = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.includes('certificate') || url.includes('document')) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9EB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-[#5D0D1A]">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const sectionNavItems = [
    { id: 'sec-personal', label: 'Personal Information', icon: User },
    { id: 'sec-academic', label: 'Academic Background', icon: GraduationCap },
    { id: 'sec-career', label: 'Career Goals', icon: Briefcase },
    { id: 'sec-skills', label: 'Skills & Expertise', icon: Code },
    { id: 'sec-links', label: 'Professional Links', icon: LinkIcon },
  ];

  return (
    <div className="relative min-h-screen bg-[#FFF9EB] flex font-sans text-[#2D060D] antialiased selection:bg-[#5D0D1A] selection:text-[#FFF9EB] overflow-x-hidden">
      {/* Background Ambient Lighting Glow Spheres (Bloodstone & Misty Sage) */}
      <div className="fixed -top-40 right-1/4 w-[600px] h-[600px] bg-[#5D0D1A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-[#9FB2AC]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden Local Image File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileSelect}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfilePhoto={profileData.profilePhoto}
      />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col lg:pl-[265px] min-w-0 transition-all duration-300">
        <TopNavbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          setActiveTab={setActiveTab}
          userProfilePhoto={profileData.profilePhoto}
        />

        <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 max-w-[1250px] w-full mx-auto space-y-8">
          {/* 1. CLEAN PAGE HEADER WITH COMPACT TOP SAVE & RESET BUTTONS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">
                Profile
              </h1>
              <p className="text-xs sm:text-sm text-[#5A6C66] font-medium">
                Build your professional identity and help CareerPilot AI understand your career goals.
              </p>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                title="Reset form to last saved state"
                className="inline-flex items-center justify-center gap-1.5 px-4 h-[44px] rounded-xl bg-white text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB] border border-[#9FB2AC] text-xs font-bold transition-all shadow-2xs"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveProfile}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 h-[44px] rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs sm:text-sm font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all shrink-0 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Profile Saved ✓</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Profile</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
          {fetching ? (
            /* Skeleton Loading State */
            <div className="space-y-6 animate-pulse">
              <div className="h-32 bg-[#9FB2AC]/20 rounded-[24px] w-full border border-[#9FB2AC]/30" />
              <div className="h-12 bg-[#9FB2AC]/20 rounded-xl w-full border border-[#9FB2AC]/30" />
              <div className="h-64 bg-[#9FB2AC]/20 rounded-[24px] w-full border border-[#9FB2AC]/30" />
            </div>
          ) : fetchError ? (
            /* Error Card */
            <div className="bg-white rounded-[24px] p-8 text-center border border-[#9FB2AC] shadow-xs space-y-4 max-w-lg mx-auto my-10">
              <div className="w-12 h-12 rounded-full bg-red-50 text-[#5D0D1A] flex items-center justify-center mx-auto border border-red-200">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#5D0D1A]">Unable to load profile</h3>
                <p className="text-xs text-[#5A6C66] font-medium">{fetchError}</p>
              </div>
              <button
                onClick={fetchProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold shadow-xs transition-all"
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-8">
              {/* 2. COMPACT PREMIUM PROFILE SUMMARY CARD */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)]"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left & Center: Avatar + Student Details */}
                  <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Circular Avatar Presentation */}
                    <div className="relative group shrink-0">
                      {isRealProfileImage(profileData.profilePhoto) ? (
                        <img
                          src={profileData.profilePhoto}
                          alt="Profile Avatar"
                          className="w-20 h-20 rounded-full object-cover border-2 border-[#5D0D1A] shadow-md shadow-[#5D0D1A]/15"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] text-[#FFF9EB] font-extrabold text-2xl flex items-center justify-center shadow-md shadow-[#5D0D1A]/20">
                          {getInitials(user?.name)}
                        </div>
                      )}

                      {/* Camera Button Badge at Bottom-Right */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Change profile photo"
                        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] shadow-md transition-all hover:scale-110 active:scale-95 ring-2 ring-white"
                      >
                        <Camera size={13} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-extrabold text-[#5D0D1A]">
                          {user?.name || 'Student Name'}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-md bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-[10px] font-extrabold uppercase">
                          Student
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 size={12} className="text-emerald-700" />
                          Verified
                        </span>
                      </div>

                      <p className="text-xs text-[#5A6C66] font-medium flex items-center gap-1.5">
                        <Mail size={13} className="text-[#5D0D1A]" />
                        {user?.email}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[#5D0D1A] font-bold hover:underline"
                        >
                          Upload Photo
                        </button>
                        {profileData.profilePhoto && (
                          <>
                            <span className="text-[#9FB2AC]">•</span>
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="text-red-600 font-bold hover:underline"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Dynamic Profile Strength Gauge */}
                  <div className="lg:col-span-5 bg-[#FFF9EB] p-4 sm:p-5 rounded-2xl border border-[#9FB2AC] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-[#5D0D1A]" />
                        <span className="text-xs font-extrabold text-[#5D0D1A]">Profile Strength</span>
                      </div>
                      <span className="text-base font-extrabold text-[#5D0D1A]">
                        {profileData.profileCompletion}%
                      </span>
                    </div>

                    <div className="w-full bg-[#9FB2AC]/30 h-2.5 rounded-full overflow-hidden border border-[#9FB2AC]/40">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${profileData.profileCompletion}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424]"
                      />
                    </div>

                    <p className="text-[11px] text-[#5A6C66] font-medium leading-relaxed">
                      Complete your profile to unlock personalized career recommendations.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Toast Feedback Alerts */}
              <AnimatePresence>
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2 shadow-2xs"
                  >
                    <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                    <span>Profile saved successfully! Dashboard completion percentage updated.</span>
                  </motion.div>
                )}

                {resetToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-[#FFF9EB] border border-[#9FB2AC] text-[#5D0D1A] text-sm font-bold flex items-center gap-2 shadow-2xs"
                  >
                    <RotateCcw size={18} className="text-[#5D0D1A] shrink-0" />
                    <span>Form reset to last saved profile data ✓</span>
                  </motion.div>
                )}

                {saveError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-bold flex items-center gap-2 shadow-2xs"
                  >
                    <AlertCircle size={18} className="text-red-600 shrink-0" />
                    <span>{saveError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 3. STICKY SECTION PILL NAVIGATION */}
              <div className="sticky top-[72px] z-20 bg-[#FFF9EB]/95 backdrop-blur-md py-3 border-b border-[#9FB2AC]">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {sectionNavItems.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeNavSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={`inline-flex items-center gap-2 px-4 h-[38px] rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${isActive
                          ? 'bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] text-[#FFF9EB] shadow-md shadow-[#5D0D1A]/20'
                          : 'bg-white text-[#5D0D1A] hover:bg-[#FFF9EB] hover:text-[#5D0D1A] border border-[#9FB2AC]'
                          }`}
                      >
                        <Icon size={14} />
                        <span>{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. FORM SECTIONS */}
              <div className="space-y-8">
                {/* 1. PERSONAL INFORMATION */}
                <motion.section
                  id="sec-personal"
                  className="scroll-mt-28 bg-white rounded-[24px] p-7 sm:p-8 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-3 pb-4 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <User size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Personal Information</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">Your contact and identification details</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={user?.name || ''}
                        disabled
                        className="w-full h-[50px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 py-3 text-sm text-[#5A6C66] cursor-not-allowed font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full h-[50px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 py-3 text-sm text-[#5A6C66] cursor-not-allowed font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">Phone Number</label>
                      <div className={`relative flex items-center bg-[#FFF9EB] border rounded-[14px] overflow-hidden transition-all ${errors.phone
                        ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-200 bg-red-50/20'
                        : profileData.phone && profileData.phone.trim()
                        ? 'border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-200'
                        : 'border-[#9FB2AC] focus-within:ring-2 focus-within:ring-[#5D0D1A]/20 focus-within:border-[#5D0D1A]'
                        }`}>
                        {/* Country Code Dropdown */}
                        <div className="flex items-center gap-1.5 pl-3 pr-2 py-3 bg-[#F4EBD9]/70 border-r border-[#9FB2AC]/50 shrink-0">
                          <Phone size={16} className="text-[#5A6C66] shrink-0" />
                          <select
                            value={parsePhoneNumber(profileData.phone).countryCode}
                            onChange={(e) => {
                              const newCode = e.target.value;
                              const { number } = parsePhoneNumber(profileData.phone);
                              const newFull = number ? `${newCode} ${number}` : `${newCode} `;
                              handleChange({ target: { name: 'phone', value: newFull } });
                            }}
                            className="bg-transparent text-sm font-bold text-[#5D0D1A] focus:outline-none cursor-pointer pr-1"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code + c.country} value={c.code} className="bg-white text-[#5D0D1A] font-medium py-1">
                                {c.flag} {c.code} ({c.country})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Phone Digits Input */}
                        <input
                          type="text"
                          name="phone"
                          value={parsePhoneNumber(profileData.phone).number}
                          onChange={(e) => {
                            const newNumber = e.target.value.replace(/[^0-9\s\-()]/g, '');
                            const { countryCode } = parsePhoneNumber(profileData.phone);
                            const newFull = newNumber ? `${countryCode} ${newNumber}` : '';
                            handleChange({ target: { name: 'phone', value: newFull } });
                          }}
                          placeholder="7907243685"
                          className="w-full h-[50px] bg-transparent pl-3 pr-4 py-3 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none font-medium"
                        />
                      </div>
                      {errors.phone ? (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.phone}
                        </p>
                      ) : (
                        <span className="text-[11px] text-[#5A6C66] mt-1 block">7 to 15 digits (e.g. +91 9876543210)</span>
                      )}
                    </div>
                  </div>
                </motion.section>

                {/* 2. ACADEMIC BACKGROUND */}
                <motion.section
                  id="sec-academic"
                  className="scroll-mt-28 bg-white rounded-[24px] p-7 sm:p-8 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-3 pb-4 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Academic Background</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">Educational qualification & score details</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">College / University</label>
                      <input
                        type="text"
                        name="college"
                        value={profileData.college}
                        onChange={handleChange}
                        placeholder="e.g. Stanford University / IIT Delhi"
                        className={`w-full h-[50px] bg-[#FFF9EB] border rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 font-medium transition-all ${errors.college
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : profileData.college && profileData.college.trim()
                          ? 'border-emerald-400 focus:ring-emerald-200'
                          : 'border-[#9FB2AC] focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A]'
                          }`}
                      />
                      {errors.college && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.college}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">Degree</label>
                      <select
                        name="degree"
                        value={profileData.degree}
                        onChange={handleChange}
                        className="w-full h-[50px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] font-medium transition-all"
                      >
                        <option value="">Select Degree</option>
                        <option value="B.Tech">B.Tech</option>
                        <option value="M.Tech">M.Tech</option>
                        <option value="BCA">BCA</option>
                        <option value="MCA">MCA</option>
                        <option value="B.Sc">B.Sc Computer Science</option>
                        <option value="M.Sc">M.Sc Computer Science</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        value={profileData.specialization}
                        onChange={handleChange}
                        placeholder="Computer Science / Artificial Intelligence"
                        className={`w-full h-[50px] bg-[#FFF9EB] border rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 font-medium transition-all ${errors.specialization
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : profileData.specialization && profileData.specialization.trim()
                          ? 'border-emerald-400 focus:ring-emerald-200'
                          : 'border-[#9FB2AC] focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A]'
                          }`}
                      />
                      {errors.specialization && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.specialization}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">Graduation Year</label>
                      <select
                        name="graduationYear"
                        value={profileData.graduationYear}
                        onChange={handleChange}
                        className={`w-full h-[50px] bg-[#FFF9EB] border rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 font-medium transition-all ${errors.graduationYear
                          ? 'border-red-400 focus:ring-red-200'
                          : 'border-[#9FB2AC] focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A]'
                          }`}
                      >
                        <option value="">Select Year</option>
                        {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                          <option key={yr} value={String(yr)}>
                            {yr}
                          </option>
                        ))}
                      </select>
                      {errors.graduationYear && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.graduationYear}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">CGPA / Percentage</label>
                      <input
                        type="text"
                        name="cgpa"
                        value={profileData.cgpa}
                        onChange={handleChange}
                        placeholder="e.g. 8.5"
                        className={`w-full h-[50px] bg-[#FFF9EB] border rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 font-medium transition-all ${errors.cgpa
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : profileData.cgpa && String(profileData.cgpa).trim()
                          ? 'border-emerald-400 focus:ring-emerald-200'
                          : 'border-[#9FB2AC] focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A]'
                          }`}
                      />
                      {errors.cgpa ? (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.cgpa}
                        </p>
                      ) : (
                        <span className="text-[11px] text-[#5A6C66] mt-1 block">Enter your current CGPA out of 10 or percentage score.</span>
                      )}
                    </div>
                  </div>
                </motion.section>

                {/* 3. CAREER GOALS */}
                <motion.section
                  id="sec-career"
                  className="scroll-mt-28 bg-white rounded-[24px] p-7 sm:p-8 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-3 pb-4 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Career Goals</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">Select your preferred job domain and career focus</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#5D0D1A] mb-2.5">Target Career Domain</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {targetCareerDomains.map((dom) => {
                          const isSelected = profileData.targetCareer === dom.id;
                          return (
                            <button
                              key={dom.id}
                              type="button"
                              onClick={() => handleSelectDomain(dom.id)}
                              className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${isSelected
                                ? 'bg-[#FFF9EB] border-[#5D0D1A] text-[#5D0D1A] shadow-2xs'
                                : 'bg-white border-[#9FB2AC] text-[#5D0D1A] hover:bg-[#FFF9EB] hover:border-[#5D0D1A]/50'
                                }`}
                            >
                              <span>{dom.label}</span>
                              {isSelected && <Check size={14} className="text-[#5D0D1A] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">Preferred Job Role</label>
                        <input
                          type="text"
                          name="preferredJobRole"
                          value={profileData.preferredJobRole}
                          onChange={handleChange}
                          placeholder="e.g. MERN Stack Developer / AI Engineer"
                          className={`w-full h-[50px] bg-[#FFF9EB] border rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 font-medium transition-all ${errors.preferredJobRole
                            ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                            : profileData.preferredJobRole && profileData.preferredJobRole.trim()
                            ? 'border-emerald-400 focus:ring-emerald-200'
                            : 'border-[#9FB2AC] focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A]'
                            }`}
                        />
                        {errors.preferredJobRole && (
                          <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.preferredJobRole}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#5D0D1A] mb-1.5">Career Interests</label>
                        <input
                          type="text"
                          name="careerInterests"
                          value={profileData.careerInterests}
                          onChange={handleChange}
                          placeholder="e.g. Web Apps, Microservices, Generative AI"
                          className={`w-full h-[50px] bg-[#FFF9EB] border rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 font-medium transition-all ${errors.careerInterests
                            ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                            : profileData.careerInterests && profileData.careerInterests.trim()
                            ? 'border-emerald-400 focus:ring-emerald-200'
                            : 'border-[#9FB2AC] focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A]'
                            }`}
                        />
                        {errors.careerInterests && (
                          <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.careerInterests}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* 4. SKILLS & EXPERTISE */}
                <motion.section
                  id="sec-skills"
                  className="scroll-mt-28 bg-white rounded-[24px] p-7 sm:p-8 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-3 pb-4 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <Code size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Skills & Expertise</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">Technical proficiencies and soft skills chips</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Technical Skills */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-[#5D0D1A]">Technical Skills</label>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 min-h-[48px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl p-2 flex flex-wrap items-center gap-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5D0D1A]/20 focus-within:border-[#5D0D1A] transition-all">
                          {profileData.technicalSkills.map((sk) => (
                            <span
                              key={sk}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold shadow-2xs"
                            >
                              <span>{sk}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTechnicalSkill(sk)}
                                className="text-[#FFF9EB] hover:text-red-300 font-bold ml-0.5"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            value={newTechSkill}
                            onChange={(e) => setNewTechSkill(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                handleAddTechnicalSkill();
                              }
                            }}
                            placeholder={profileData.technicalSkills.length === 0 ? "Add skill (e.g. React)" : "Add skill..."}
                            className="flex-1 bg-transparent border-none text-xs font-semibold text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none min-w-[120px] px-2 py-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddTechnicalSkill()}
                          className="px-4 h-[48px] rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold hover:bg-[#7A1424] transition-all flex items-center gap-1 shrink-0 shadow-xs"
                        >
                          <Plus size={15} />
                          <span>Add</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#5A6C66] uppercase tracking-wider block">Suggestions:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {techSkillPresets.map((preset) => {
                            const isAdded = profileData.technicalSkills.includes(preset);
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => !isAdded && handleAddTechnicalSkill(preset)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${isAdded
                                  ? 'bg-[#FFF9EB] text-[#5D0D1A] border-[#9FB2AC] opacity-60 cursor-default'
                                  : 'bg-[#FFF9EB] text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB] border-[#9FB2AC]'
                                  }`}
                              >
                                {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Soft Skills */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-[#5D0D1A]">Soft Skills</label>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 min-h-[48px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl p-2 flex flex-wrap items-center gap-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5D0D1A]/20 focus-within:border-[#5D0D1A] transition-all">
                          {profileData.softSkills.map((sk) => (
                            <span
                              key={sk}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold shadow-2xs"
                            >
                              <span>{sk}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSoftSkill(sk)}
                                className="text-[#FFF9EB] hover:text-red-300 font-bold ml-0.5"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            value={newSoftSkill}
                            onChange={(e) => setNewSoftSkill(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                handleAddSoftSkill();
                              }
                            }}
                            placeholder={profileData.softSkills.length === 0 ? "Add skill (e.g. Communication)" : "Add skill..."}
                            className="flex-1 bg-transparent border-none text-xs font-semibold text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none min-w-[120px] px-2 py-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddSoftSkill()}
                          className="px-4 h-[48px] rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold hover:bg-[#7A1424] transition-all flex items-center gap-1 shrink-0 shadow-xs"
                        >
                          <Plus size={15} />
                          <span>Add</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#5A6C66] uppercase tracking-wider block">Suggestions:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {softSkillPresets.map((preset) => {
                            const isAdded = profileData.softSkills.includes(preset);
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => !isAdded && handleAddSoftSkill(preset)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${isAdded
                                  ? 'bg-[#FFF9EB] text-[#5D0D1A] border-[#9FB2AC] opacity-60 cursor-default'
                                  : 'bg-[#FFF9EB] text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB] border-[#9FB2AC]'
                                  }`}
                              >
                                {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* 5. PROFESSIONAL LINKS */}
                <motion.section
                  id="sec-links"
                  className="scroll-mt-28 bg-white rounded-[24px] p-7 sm:p-8 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-3 pb-4 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <LinkIcon size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Professional Links</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">Connect your LinkedIn, GitHub & portfolio profiles</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-semibold text-[#5D0D1A]">LinkedIn Profile</label>
                        <ExternalLink size={13} className="text-[#5A6C66]" />
                      </div>
                      <input
                        type="text"
                        inputMode="url"
                        name="linkedin"
                        value={profileData.linkedin}
                        onChange={handleChange}
                        onBlur={handleUrlBlur}
                        placeholder="e.g. linkedin.com/in/username"
                        className={`w-full h-[50px] bg-[#FFF9EB] border rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-[#FFF] focus:ring-2 font-medium transition-all ${errors.linkedin
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : 'border-[#9FB2AC] focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A]'
                          }`}
                      />
                      {errors.linkedin && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.linkedin}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-semibold text-[#5D0D1A]">GitHub Profile</label>
                        <ExternalLink size={13} className="text-[#5A6C66]" />
                      </div>
                      <input
                        type="text"
                        inputMode="url"
                        name="github"
                        value={profileData.github}
                        onChange={handleChange}
                        onBlur={handleUrlBlur}
                        placeholder="e.g. github.com/username"
                        className={`w-full h-[50px] bg-[#FFF9EB] border rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-[#FFF] focus:ring-2 font-medium transition-all ${errors.github
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : 'border-[#9FB2AC] focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A]'
                          }`}
                      />
                      {errors.github && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.github}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-semibold text-[#5D0D1A]">Portfolio Website</label>
                        <ExternalLink size={13} className="text-[#5A6C66]" />
                      </div>
                      <input
                        type="text"
                        inputMode="url"
                        name="portfolio"
                        value={profileData.portfolio}
                        onChange={handleChange}
                        onBlur={handleUrlBlur}
                        placeholder="e.g. myportfolio.dev"
                        className={`w-full h-[50px] bg-[#FFF9EB] border rounded-[14px] px-4 py-3 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-[#FFF] focus:ring-2 font-medium transition-all ${errors.portfolio
                          ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                          : 'border-[#9FB2AC] focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A]'
                          }`}
                      />
                      {errors.portfolio && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.portfolio}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.section>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};
