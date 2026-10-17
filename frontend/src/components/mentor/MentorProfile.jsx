import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  Mail,
  Phone,
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
  Globe,
  Check,
  RotateCcw,
  Edit3,
  Calendar,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MentorProfile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Mode & Loading States
  const [isEditing, setIsEditing] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    professionalTitle: '',
    company: '',
    experience: '',
    bio: '',
    expertise: [],
    linkedin: '',
    github: '',
    availability: '',
    phone: '',
    profilePhoto: '',
  });

  // Backup state for cancelling edits
  const [savedProfileData, setSavedProfileData] = useState(null);

  // Expertise input buffer
  const [newSkill, setNewSkill] = useState('');

  // Preset skill suggestions for Mentors
  const expertisePresets = [
    'Career Guidance',
    'System Design',
    'React',
    'Node.js',
    'Python',
    'Data Science',
    'AI & Machine Learning',
    'Cloud Architecture',
    'Technical Interview Prep',
    'Portfolio Review',
  ];

  const notifyProfileUpdated = (photoUrl) => {
    window.dispatchEvent(
      new CustomEvent('profileUpdated', {
        detail: { profilePhoto: photoUrl || '' },
      })
    );
  };

  // Fetch mentor profile from backend
  const fetchProfile = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await api.get('/mentor/profile');
      if (res.data && res.data.success) {
        const p = res.data.data.profile;
        const loaded = {
          fullName: p.fullName || p.name || user?.name || user?.fullName || '',
          email: p.email || user?.email || '',
          professionalTitle: p.professionalTitle || p.designation || '',
          company: p.company || '',
          experience: p.experience || '',
          bio: p.bio || '',
          expertise: Array.isArray(p.expertise) ? p.expertise : [],
          linkedin: p.linkedin || '',
          github: p.github || '',
          availability: p.availability || '',
          phone: p.phone || '',
          profilePhoto: p.profilePhoto || '',
        };
        setProfileData(JSON.parse(JSON.stringify(loaded)));
        setSavedProfileData(JSON.parse(JSON.stringify(loaded)));
        notifyProfileUpdated(loaded.profilePhoto);
      } else {
        setFetchError(res.data?.message || 'Unable to fetch mentor profile');
      }
    } catch (err) {
      console.error('Fetch mentor profile error:', err);
      setFetchError(err.response?.data?.message || 'Failed to connect to mentor profile service');
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFieldChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setSaveError(null);
    setSaveSuccess(false);
  };

  // Add Expertise Skill Tag
  const handleAddExpertise = (skillToAdd) => {
    const targetSkill = (skillToAdd || newSkill).trim();
    if (!targetSkill) return;

    if (profileData.expertise.some((s) => s.toLowerCase() === targetSkill.toLowerCase())) {
      setNewSkill('');
      return;
    }

    setProfileData((prev) => ({
      ...prev,
      expertise: [...prev.expertise, targetSkill],
    }));
    setNewSkill('');
  };

  // Remove Expertise Tag
  const handleRemoveExpertise = (indexToRemove) => {
    setProfileData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Profile Image Upload (Base64 conversion)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setSaveError('Profile photo size must be less than 3 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleFieldChange('profilePhoto', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove Profile Photo
  const handleRemovePhoto = () => {
    handleFieldChange('profilePhoto', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Cancel edits & restore saved profile data
  const handleCancel = () => {
    if (savedProfileData) {
      setProfileData(JSON.parse(JSON.stringify(savedProfileData)));
    }
    setIsEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
  };

  // Save changes to API
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await api.put('/mentor/profile', profileData);
      if (res.data && res.data.success) {
        const updated = res.data.data.profile;
        const loaded = {
          fullName: updated.fullName || updated.name || '',
          email: updated.email || '',
          professionalTitle: updated.professionalTitle || updated.designation || '',
          company: updated.company || '',
          experience: updated.experience || '',
          bio: updated.bio || '',
          expertise: Array.isArray(updated.expertise) ? updated.expertise : [],
          linkedin: updated.linkedin || '',
          github: updated.github || '',
          availability: updated.availability || '',
          phone: updated.phone || '',
          profilePhoto: updated.profilePhoto || '',
        };
        setProfileData(JSON.parse(JSON.stringify(loaded)));
        setSavedProfileData(JSON.parse(JSON.stringify(loaded)));
        notifyProfileUpdated(loaded.profilePhoto);
        setSaveSuccess(true);
        setIsEditing(false);

        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Save mentor profile error:', err);
      setSaveError(err.response?.data?.message || 'Server error while saving profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'MP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (fetching) {
    return (
      <div className="bg-white rounded-[22px] p-12 border border-[#9FB2AC] shadow-xs text-center space-y-4 my-8">
        <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-[#5D0D1A]">Loading Mentor Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Alert Messages */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-bold">Mentor profile updated successfully!</span>
            </div>
            <button onClick={() => setSaveSuccess(false)} className="text-emerald-700 hover:text-emerald-900">
              <X size={16} />
            </button>
          </motion.div>
        )}

        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0" />
              <span className="text-sm font-bold">{saveError}</span>
            </div>
            <button onClick={() => setSaveError(null)} className="text-red-700 hover:text-red-900">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header Banner Card */}
      <div className="rounded-[28px] bg-white p-6 md:p-8 border border-[#9FB2AC] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          {/* Profile Photo */}
          <div className="relative group">
            {profileData.profilePhoto ? (
              <img
                src={profileData.profilePhoto}
                alt="Mentor Avatar"
                className="w-28 h-28 rounded-2xl object-cover border-2 border-[#5D0D1A] shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-3xl font-extrabold flex items-center justify-center border-2 border-[#5D0D1A] shadow-md">
                {getInitials(profileData.fullName)}
              </div>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-[#5D0D1A] text-[#FFF9EB] rounded-xl hover:bg-[#7A1424] transition-all shadow-md"
                title="Upload Photo"
              >
                <Camera size={16} />
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl font-extrabold text-[#5D0D1A] tracking-tight">
                {profileData.fullName || 'Mentor Name'}
              </h1>
              <span className="text-xs font-bold bg-[#FFF9EB] text-[#5D0D1A] px-2.5 py-0.5 rounded-full border border-[#9FB2AC]">
                Verified Mentor
              </span>
            </div>
            <p className="text-sm font-semibold text-[#5A6C66]">
              {profileData.professionalTitle || 'Professional Title / Designation'}
            </p>
            <p className="text-xs text-[#5A6C66] font-medium">{profileData.email}</p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-sm font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02]"
            >
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#F7EED8] text-sm font-bold transition-all"
              >
                <RotateCcw size={16} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-sm font-extrabold shadow-md transition-all hover:scale-[1.02]"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Details Form / Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal & Professional Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Information */}
          <div className="rounded-[22px] bg-white p-6 border border-[#9FB2AC] shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#9FB2AC]/50 pb-3">
              <User size={18} className="text-[#5D0D1A]" />
              <h2 className="text-base font-extrabold text-[#5D0D1A]">Personal & Professional Info</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5D0D1A]">Full Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profileData.fullName}
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                  className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-sm text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] disabled:opacity-80 font-medium"
                />
              </div>

              {/* Professional Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5D0D1A]">Professional Title</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. Senior Software Architect"
                  value={profileData.professionalTitle}
                  onChange={(e) => handleFieldChange('professionalTitle', e.target.value)}
                  className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-sm text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] disabled:opacity-80 font-medium"
                />
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5D0D1A]">Company / Organization</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. Google, Microsoft"
                  value={profileData.company}
                  onChange={(e) => handleFieldChange('company', e.target.value)}
                  className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-sm text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] disabled:opacity-80 font-medium"
                />
              </div>

              {/* Years of Experience */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5D0D1A]">Years of Experience</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. 8+ Years"
                  value={profileData.experience}
                  onChange={(e) => handleFieldChange('experience', e.target.value)}
                  className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-sm text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] disabled:opacity-80 font-medium"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-[#5D0D1A]">Professional Bio</label>
              <textarea
                rows={4}
                disabled={!isEditing}
                placeholder="Share your background, mentorship philosophy, and career achievements..."
                value={profileData.bio}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl p-3.5 text-sm text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] disabled:opacity-80 font-medium"
              />
            </div>
          </div>

          {/* Card 2: Expertise & Skills Tags */}
          <div className="rounded-[22px] bg-white p-6 border border-[#9FB2AC] shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#9FB2AC]/50 pb-3">
              <Code size={18} className="text-[#5D0D1A]" />
              <h2 className="text-base font-extrabold text-[#5D0D1A]">Expertise & Technical Skills</h2>
            </div>

            {/* Active Tags */}
            <div className="flex flex-wrap gap-2 min-h-[48px] p-3 bg-[#FFF9EB]/60 rounded-xl border border-[#9FB2AC]/60">
              {profileData.expertise.length === 0 ? (
                <span className="text-xs text-[#5A6C66] italic">No expertise tags added yet.</span>
              ) : (
                profileData.expertise.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-bold shadow-2xs"
                  >
                    <span>{skill}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExpertise(idx)}
                        className="hover:text-red-300 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </span>
                ))
              )}
            </div>

            {/* Input tag buffer & presets when editing */}
            {isEditing && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom skill or expertise..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExpertise();
                      }
                    }}
                    className="flex-1 bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddExpertise()}
                    className="px-4 py-2 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold hover:bg-[#7A1424] transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Preset Suggestions */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#5A6C66]">Quick Add Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {expertisePresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddExpertise(preset)}
                        className="px-2.5 py-1 rounded-md bg-white border border-[#9FB2AC] text-[11px] font-semibold text-[#5D0D1A] hover:bg-[#FFF9EB] transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact, Links & Availability */}
        <div className="space-y-6">
          {/* Card 3: Professional Links & Availability */}
          <div className="rounded-[22px] bg-white p-6 border border-[#9FB2AC] shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#9FB2AC]/50 pb-3">
              <LinkIcon size={18} className="text-[#5D0D1A]" />
              <h2 className="text-base font-extrabold text-[#5D0D1A]">Links & Availability</h2>
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5D0D1A]">LinkedIn Profile</label>
              <input
                type="url"
                disabled={!isEditing}
                placeholder="https://linkedin.com/in/username"
                value={profileData.linkedin}
                onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] disabled:opacity-80 font-medium"
              />
            </div>

            {/* GitHub */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5D0D1A]">GitHub Profile</label>
              <input
                type="url"
                disabled={!isEditing}
                placeholder="https://github.com/username"
                value={profileData.github}
                onChange={(e) => handleFieldChange('github', e.target.value)}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] disabled:opacity-80 font-medium"
              />
            </div>

            {/* Availability */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5D0D1A]">Mentorship Availability</label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="e.g. Mon-Fri, 5 PM - 8 PM IST"
                value={profileData.availability}
                onChange={(e) => handleFieldChange('availability', e.target.value)}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] disabled:opacity-80 font-medium"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5D0D1A]">Contact Phone</label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="+91 9876543210"
                value={profileData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] disabled:opacity-80 font-medium"
              />
            </div>
          </div>

          {/* Card 4: Action Footer Buttons when Editing */}
          {isEditing && (
            <div className="rounded-[22px] bg-white p-6 border border-[#9FB2AC] shadow-xs space-y-3">
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-sm font-extrabold shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                <span>Save Changes</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#F7EED8] text-sm font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
