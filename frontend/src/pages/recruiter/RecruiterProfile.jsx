import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import {
  User,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Edit,
  Save,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';

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

export const RecruiterProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    profilePhoto: '',
    email: '',
    phone: '',
    companyName: '',
    industry: '',
    companyWebsite: '',
    location: '',
    designation: '',
    companyDescription: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true); // Open for manual editing by default
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const photoInputRef = useRef(null);

  useEffect(() => {
    fetchRecruiterProfile();
  }, []);

  const fetchRecruiterProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recruiter/profile');
      if (res.data && res.data.success && res.data.data) {
        const p = res.data.data;
        setProfile({
          fullName: p.fullName || user?.fullName || user?.name || '',
          profilePhoto: p.profilePhoto || '',
          email: p.email || user?.email || '',
          phone: p.phone || '',
          companyName: p.companyName || '',
          industry: p.industry || '',
          companyWebsite: p.companyWebsite || '',
          location: p.location || '',
          designation: p.designation || '',
          companyDescription: p.companyDescription || '',
        });

        // If companyName or designation exists, lock editing mode initially
        if (p.companyName && p.designation) {
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.warn('Notice loading recruiter profile:', err);
    } finally {
      setLoading(false);
    }
  };
  const [touched, setTouched] = useState({});

  const validateField = (name, value, allData = profile) => {
    const val = (value || '').trim();
    switch (name) {
      case 'fullName':
        if (!val) return 'Full name is required.';
        if (val.length < 2) return 'Full name must be at least 2 characters.';
        if (!/^[a-zA-Z\s.'-]+$/.test(val)) return 'Full name should only contain letters and spaces.';
        return '';
      case 'phone':
        const { number } = parsePhoneNumber(allData.phone);
        if (number) {
          const cleanDigits = number.replace(/[^0-9]/g, '');
          if (cleanDigits.length < 7 || cleanDigits.length > 15) {
            return 'Phone number must contain between 7 and 15 digits.';
          }
        }
        return '';
      case 'companyWebsite':
        if (val) {
          const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
          if (!urlPattern.test(val)) {
            return 'Please enter a valid website URL (e.g. https://company.com).';
          }
        }
        return '';
      case 'companyName':
        if (val && val.length < 2) return 'Company name must be at least 2 characters.';
        return '';
      case 'designation':
        if (val && val.length < 2) return 'Designation must be at least 2 characters.';
        return '';
      case 'industry':
        if (val && val.length < 2) return 'Industry must be at least 2 characters.';
        return '';
      case 'location':
        if (val && val.length < 2) return 'Location must be at least 2 characters.';
        return '';
      case 'companyDescription':
        if (val && val.length < 10) return 'Description should be at least 10 characters.';
        return '';
      default:
        return '';
    }
  };

  const getErrors = (data = profile) => {
    const errs = {};
    ['fullName', 'phone', 'companyName', 'designation', 'industry', 'companyWebsite', 'location', 'companyDescription'].forEach((field) => {
      const err = validateField(field, data[field], data);
      if (err) errs[field] = err;
    });
    return errs;
  };

  const errors = getErrors(profile);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldStatus = (field) => {
    if (!isEditing) return 'default';
    const isTouched = touched[field];
    const hasValue = Boolean(profile[field] && profile[field].trim());
    const err = errors[field];

    if (err && (isTouched || hasValue)) return 'error';
    if (!err && hasValue) return 'valid';
    return 'default';
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 3MB limit. Please choose a smaller photo.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, profilePhoto: reader.result }));
      setSuccessMsg('Profile photo selected! Click "Save Profile" to apply your changes.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfile((prev) => ({ ...prev, profilePhoto: '' }));
    if (photoInputRef.current) photoInputRef.current.value = '';
    setSuccessMsg('Profile photo removed.');
  };

  // Calculate dynamic Profile Completion Percentage (0 - 100%)
  const calculateProfileCompletion = () => {
    const fields = [
      profile.fullName,
      profile.profilePhoto,
      profile.phone,
      profile.companyName,
      profile.industry,
      profile.designation,
      profile.location,
      profile.companyWebsite,
      profile.companyDescription,
    ];
    const completed = fields.filter((f) => f && f.trim().length > 0).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercentage = calculateProfileCompletion();

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const currentErrors = getErrors(profile);
    if (Object.keys(currentErrors).length > 0) {
      const allTouched = {};
      Object.keys(currentErrors).forEach((k) => (allTouched[k] = true));
      setTouched(allTouched);
      setErrorMsg('Please fix the highlighted validation errors before saving your profile.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/recruiter/profile', profile);
      if (res.data && res.data.success) {
        setSuccessMsg('Recruiter profile updated successfully!');
        setIsEditing(false);
      } else {
        setErrorMsg(res.data?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Server error saving recruiter profile.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'RC';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <RecruiterLayout>
        <div className="bg-white rounded-[24px] p-12 border border-[#9FB2AC] text-center my-8">
          <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#5D0D1A]">Loading recruiter profile details...</p>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="space-y-8">
        {/* Hidden File Input for Profile Photo */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* Header Profile Card */}
        <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Profile Avatar / Photo with Camera Upload Overlay */}
              <div className="relative group shrink-0">
                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={profile.fullName || 'Recruiter'}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#5D0D1A] shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] via-[#7A1424] to-[#420912] text-[#FFF9EB] flex items-center justify-center text-2xl font-black shadow-md shadow-[#5D0D1A]/20">
                    {getInitials(profile.fullName)}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] border-2 border-white flex items-center justify-center shadow-xs transition-transform hover:scale-110 cursor-pointer"
                  title="Upload / Change Profile Photo"
                >
                  <Camera size={13} />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-extrabold text-[#5D0D1A]">
                    {profile.fullName || 'Recruiter Profile'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Verified Recruiter
                  </span>
                </div>
                <p className="text-xs font-bold text-[#7A1424] flex items-center gap-1.5">
                  <Building2 size={14} /> {profile.companyName || 'No Company Set'} • {profile.designation || 'Technical Recruiter'}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#5A6C66] font-semibold pt-1">
                  <span className="flex items-center gap-1"><Mail size={13} /> {profile.email}</span>
                  {profile.location && <span className="flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#9FB2AC] hover:border-[#5D0D1A] text-[#5D0D1A] hover:bg-[#FFF9EB] text-xs font-extrabold transition-all self-start md:self-auto shadow-2xs"
            >
              <Edit size={15} />
              <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Profile Completion Indicator */}
          <div className="p-4 rounded-2xl bg-[#FFF9EB] border border-[#9FB2AC] space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#5D0D1A]">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={15} />
                Profile Completion: {completionPercentage}%
              </span>
              <span>{completionPercentage === 100 ? 'Complete' : 'Pending Manual Information'}</span>
            </div>
            <div className="w-full h-2.5 bg-[#9FB2AC]/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] transition-all duration-700 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            {completionPercentage < 100 && (
              <p className="text-[11px] font-semibold text-[#5A6C66]">
                Please upload a profile photo and complete your company details, phone number, and designation below.
              </p>
            )}
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Manual Completion Form */}
        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Personal Contact & Photo Information */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-5">
            <h2 className="text-sm font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-2 border-b border-[#9FB2AC]/60 pb-3">
              <User size={16} className="text-[#5D0D1A]" />
              Personal Contact & Profile Photo
            </h2>

            {/* Profile Photo Uploader Control Bar */}
            <div className="p-4 rounded-2xl bg-[#FFF9EB]/70 border border-[#9FB2AC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="Profile" className="w-14 h-14 rounded-2xl object-cover border-2 border-[#5D0D1A] shadow-xs" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center font-extrabold text-sm shadow-xs">
                    {getInitials(profile.fullName)}
                  </div>
                )}
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-[#5D0D1A] block">Recruiter Profile Avatar</span>
                  <span className="text-[11px] font-semibold text-[#5A6C66] block">Upload PNG, JPG, or WEBP (Max 3MB)</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <Upload size={14} />
                  <span>{profile.profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                {profile.profilePhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-extrabold border border-red-200 flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  onBlur={() => handleBlur('fullName')}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-75 transition-all focus:outline-none focus:ring-2 ${
                    getFieldStatus('fullName') === 'error'
                      ? 'border-red-400 bg-red-50/20 text-red-900 focus:ring-red-500/30 focus:border-red-500'
                      : getFieldStatus('fullName') === 'valid'
                      ? 'border-emerald-400 bg-emerald-50/20 text-[#2D060D] focus:ring-emerald-500/30 focus:border-emerald-500'
                      : 'border-[#9FB2AC] bg-[#FFF9EB]/60 text-[#2D060D] focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A]'
                  }`}
                  required
                />
                {getFieldStatus('fullName') === 'error' && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
                {getFieldStatus('fullName') === 'valid' && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Valid name format</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full bg-gray-100 border border-[#9FB2AC] rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-500 cursor-not-allowed"
                />
                <p className="text-[11px] font-semibold text-[#5A6C66] mt-1">
                  Email is locked to your authenticated account.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Phone Number</label>
                <div className={`flex items-center rounded-xl overflow-hidden transition-all focus-within:ring-2 ${
                  getFieldStatus('phone') === 'error'
                    ? 'border border-red-400 bg-red-50/20 focus-within:ring-red-500/30 focus-within:border-red-500'
                    : getFieldStatus('phone') === 'valid'
                    ? 'border border-emerald-400 bg-emerald-50/20 focus-within:ring-emerald-500/30 focus-within:border-emerald-500'
                    : 'border border-[#9FB2AC] bg-[#FFF9EB]/60 focus-within:ring-[#5D0D1A]/30 focus-within:border-[#5D0D1A]'
                }`}>
                  <div className="flex items-center gap-1 pl-3 pr-2 py-2.5 bg-[#F4EBD9]/60 border-r border-[#9FB2AC]/50 shrink-0">
                    <Phone size={14} className="text-[#5D0D1A] shrink-0" />
                    <select
                      disabled={!isEditing}
                      value={parsePhoneNumber(profile.phone).countryCode}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        const { number } = parsePhoneNumber(profile.phone);
                        const newFull = number ? `${newCode} ${number}` : `${newCode} `;
                        setProfile({ ...profile, phone: newFull });
                      }}
                      className="bg-transparent text-xs font-bold text-[#5D0D1A] focus:outline-none cursor-pointer pr-1 disabled:opacity-75"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code + c.country} value={c.code} className="bg-white text-[#5D0D1A] font-medium py-1">
                          {c.flag} {c.code} ({c.country})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="7907243685"
                    value={parsePhoneNumber(profile.phone).number}
                    onChange={(e) => {
                      const newNumber = e.target.value.replace(/[^0-9\s\-()]/g, '');
                      const { countryCode } = parsePhoneNumber(profile.phone);
                      const newFull = newNumber ? `${countryCode} ${newNumber}` : '';
                      setProfile({ ...profile, phone: newFull });
                    }}
                    onBlur={() => handleBlur('phone')}
                    className="w-full bg-transparent px-3 py-2.5 text-xs font-semibold text-[#2D060D] focus:outline-none disabled:opacity-75"
                  />
                </div>
                {getFieldStatus('phone') === 'error' && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
                {getFieldStatus('phone') === 'valid' && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Valid phone number</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Designation / Job Title</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. Senior Talent Partner, HR Lead"
                  value={profile.designation}
                  onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                  onBlur={() => handleBlur('designation')}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-75 transition-all focus:outline-none focus:ring-2 ${
                    getFieldStatus('designation') === 'error'
                      ? 'border-red-400 bg-red-50/20 text-red-900 focus:ring-red-500/30 focus:border-red-500'
                      : getFieldStatus('designation') === 'valid'
                      ? 'border-emerald-400 bg-emerald-50/20 text-[#2D060D] focus:ring-emerald-500/30 focus:border-emerald-500'
                      : 'border-[#9FB2AC] bg-[#FFF9EB]/60 text-[#2D060D] focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A]'
                  }`}
                />
                {getFieldStatus('designation') === 'error' && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.designation}</span>
                  </p>
                )}
                {getFieldStatus('designation') === 'valid' && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Valid designation</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Company Details */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-5">
            <h2 className="text-sm font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-2 border-b border-[#9FB2AC]/60 pb-3">
              <Building2 size={16} className="text-[#5D0D1A]" />
              Company Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Company Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="Enter your organization name"
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  onBlur={() => handleBlur('companyName')}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-75 transition-all focus:outline-none focus:ring-2 ${
                    getFieldStatus('companyName') === 'error'
                      ? 'border-red-400 bg-red-50/20 text-red-900 focus:ring-red-500/30 focus:border-red-500'
                      : getFieldStatus('companyName') === 'valid'
                      ? 'border-emerald-400 bg-emerald-50/20 text-[#2D060D] focus:ring-emerald-500/30 focus:border-emerald-500'
                      : 'border-[#9FB2AC] bg-[#FFF9EB]/60 text-[#2D060D] focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A]'
                  }`}
                />
                {getFieldStatus('companyName') === 'error' && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.companyName}</span>
                  </p>
                )}
                {getFieldStatus('companyName') === 'valid' && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Valid company name</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Industry</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. Information Technology, Healthcare, Finance"
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  onBlur={() => handleBlur('industry')}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-75 transition-all focus:outline-none focus:ring-2 ${
                    getFieldStatus('industry') === 'error'
                      ? 'border-red-400 bg-red-50/20 text-red-900 focus:ring-red-500/30 focus:border-red-500'
                      : getFieldStatus('industry') === 'valid'
                      ? 'border-emerald-400 bg-emerald-50/20 text-[#2D060D] focus:ring-emerald-500/30 focus:border-emerald-500'
                      : 'border-[#9FB2AC] bg-[#FFF9EB]/60 text-[#2D060D] focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A]'
                  }`}
                />
                {getFieldStatus('industry') === 'error' && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.industry}</span>
                  </p>
                )}
                {getFieldStatus('industry') === 'valid' && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Valid industry</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Company Website URL</label>
                <input
                  type="url"
                  disabled={!isEditing}
                  placeholder="https://yourcompany.com"
                  value={profile.companyWebsite}
                  onChange={(e) => setProfile({ ...profile, companyWebsite: e.target.value })}
                  onBlur={() => handleBlur('companyWebsite')}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-75 transition-all focus:outline-none focus:ring-2 ${
                    getFieldStatus('companyWebsite') === 'error'
                      ? 'border-red-400 bg-red-50/20 text-red-900 focus:ring-red-500/30 focus:border-red-500'
                      : getFieldStatus('companyWebsite') === 'valid'
                      ? 'border-emerald-400 bg-emerald-50/20 text-[#2D060D] focus:ring-emerald-500/30 focus:border-emerald-500'
                      : 'border-[#9FB2AC] bg-[#FFF9EB]/60 text-[#2D060D] focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A]'
                  }`}
                />
                {getFieldStatus('companyWebsite') === 'error' && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.companyWebsite}</span>
                  </p>
                )}
                {getFieldStatus('companyWebsite') === 'valid' && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Valid URL format</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Company Location</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. New York, NY / Remote"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  onBlur={() => handleBlur('location')}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-75 transition-all focus:outline-none focus:ring-2 ${
                    getFieldStatus('location') === 'error'
                      ? 'border-red-400 bg-red-50/20 text-red-900 focus:ring-red-500/30 focus:border-red-500'
                      : getFieldStatus('location') === 'valid'
                      ? 'border-emerald-400 bg-emerald-50/20 text-[#2D060D] focus:ring-emerald-500/30 focus:border-emerald-500'
                      : 'border-[#9FB2AC] bg-[#FFF9EB]/60 text-[#2D060D] focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A]'
                  }`}
                />
                {getFieldStatus('location') === 'error' && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.location}</span>
                  </p>
                )}
                {getFieldStatus('location') === 'valid' && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Valid location</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Company Overview & Culture Description</label>
                <textarea
                  rows={4}
                  disabled={!isEditing}
                  placeholder="Provide a brief description of your company mission, culture, and hiring focus..."
                  value={profile.companyDescription}
                  onChange={(e) => setProfile({ ...profile, companyDescription: e.target.value })}
                  onBlur={() => handleBlur('companyDescription')}
                  className={`w-full rounded-xl p-4 text-xs font-semibold disabled:opacity-75 transition-all focus:outline-none focus:ring-2 ${
                    getFieldStatus('companyDescription') === 'error'
                      ? 'border-red-400 bg-red-50/20 text-red-900 focus:ring-red-500/30 focus:border-red-500'
                      : getFieldStatus('companyDescription') === 'valid'
                      ? 'border-emerald-400 bg-emerald-50/20 text-[#2D060D] focus:ring-emerald-500/30 focus:border-emerald-500'
                      : 'border-[#9FB2AC] bg-[#FFF9EB]/60 text-[#2D060D] focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A]'
                  }`}
                />
                {getFieldStatus('companyDescription') === 'error' && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.companyDescription}</span>
                  </p>
                )}
                {getFieldStatus('companyDescription') === 'valid' && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Sufficient description length</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Save Action Footer */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl border border-[#9FB2AC] text-[#5A6C66] text-xs font-extrabold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <Save size={16} />
                <span>{saving ? 'Saving Profile...' : 'Save & Complete Profile'}</span>
              </button>
            </div>
          )}
        </form>

        {/* COMPLETED RECRUITER PROFILE DETAILS TABLE */}
        <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#9FB2AC]/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#5D0D1A]">Completed Recruiter Details Table</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  completionPercentage === 100 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  {completionPercentage === 100 ? '100% Completed' : `${completionPercentage}% Completed`}
                </span>
              </div>
              <p className="text-xs text-[#5A6C66]">Detailed tabular record of completed recruiter and organization credentials</p>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-xs transition-all hover:scale-[1.02]"
              >
                <Edit size={14} />
                <span>Edit Profile Information</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#9FB2AC] text-[11px] font-extrabold uppercase text-[#5A6C66] tracking-wider bg-[#FFF9EB]/60">
                  <th className="py-3 px-4">Profile Attribute</th>
                  <th className="py-3 px-4">Completed Detail Value</th>
                  <th className="py-3 px-4">Attribute Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9FB2AC]/40 text-xs font-semibold text-[#2D060D]">
                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <User size={15} className="text-[#5D0D1A]" /> Full Name
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-[#2D060D]">{profile.fullName || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      Completed
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Camera size={15} className="text-[#5D0D1A]" /> Profile Photo
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {profile.profilePhoto ? (
                      <div className="flex items-center gap-2">
                        <img src={profile.profilePhoto} alt="Thumb" className="w-8 h-8 rounded-lg object-cover border border-[#5D0D1A]" />
                        <span className="text-xs font-bold text-emerald-800">Photo Uploaded</span>
                      </div>
                    ) : (
                      <span className="text-amber-700 italic font-normal">Not uploaded</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {profile.profilePhoto ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">Completed</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">Pending</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Mail size={15} className="text-[#5D0D1A]" /> Email Address
                  </td>
                  <td className="py-3.5 px-4 text-[#5A6C66]">{profile.email || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      Verified
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Phone size={15} className="text-[#5D0D1A]" /> Phone Number
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {profile.phone || <span className="text-amber-700 italic font-normal">Not provided</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {profile.phone ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">Completed</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">Pending</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Briefcase size={15} className="text-[#5D0D1A]" /> Designation / Title
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {profile.designation || <span className="text-amber-700 italic font-normal">Not provided</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {profile.designation ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">Completed</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">Pending</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Building2 size={15} className="text-[#5D0D1A]" /> Organization / Company
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-[#7A1424]">
                    {profile.companyName || <span className="text-amber-700 italic font-normal">Not provided</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {profile.companyName ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">Completed</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">Pending</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <TrendingUp size={15} className="text-[#5D0D1A]" /> Industry Sector
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {profile.industry || <span className="text-amber-700 italic font-normal">Not provided</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {profile.industry ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">Completed</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">Pending</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <MapPin size={15} className="text-[#5D0D1A]" /> Location
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {profile.location || <span className="text-amber-700 italic font-normal">Not provided</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {profile.location ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">Completed</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">Pending</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Globe size={15} className="text-[#5D0D1A]" /> Company Website
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {profile.companyWebsite ? (
                      <a href={profile.companyWebsite} target="_blank" rel="noreferrer" className="text-[#7A1424] hover:underline font-bold">
                        {profile.companyWebsite}
                      </a>
                    ) : (
                      <span className="text-amber-700 italic font-normal">Not provided</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {profile.companyWebsite ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">Completed</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">Pending</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Sparkles size={15} className="text-[#5D0D1A]" /> Company Description
                  </td>
                  <td className="py-3.5 px-4 text-[#4A5D57] leading-relaxed max-w-md">
                    {profile.companyDescription || <span className="text-amber-700 italic font-normal">Not provided</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {profile.companyDescription ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">Completed</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">Pending</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};
