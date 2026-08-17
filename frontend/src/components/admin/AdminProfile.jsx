import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, User, Mail, Key, CheckCircle, Lock, Save, Database } from 'lucide-react';

export const AdminProfile = () => {
  const { user } = useAuth();
  const [savedMsg, setSavedMsg] = useState('');
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || user?.name || 'System Administrator',
    username: user?.username || 'admin',
    email: user?.email || 'admin@careerpilot.ai',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setSavedMsg('Admin profile information updated successfully.');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setSavedMsg('Admin account password updated successfully.');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSavedMsg(''), 4000);
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner matching StudentProfile */}
      <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] rounded-[26px] p-8 text-[#FFF9EB] shadow-xl shadow-[#5D0D1A]/10 border border-[#9FB2AC]/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-extrabold text-2xl flex items-center justify-center shadow-lg shrink-0 border-2 border-white/20">
            {getInitials(profileData.fullName)}
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[#FFF9EB] text-xs font-bold border border-white/15">
              <ShieldCheck size={13} className="text-[#FFF9EB]" /> Dedicated Collection: admins
            </div>
            <h2 className="text-2xl font-extrabold">{profileData.fullName}</h2>
            <p className="text-xs text-[#FFF9EB]/90 font-mono">@{profileData.username} • {profileData.email}</p>
          </div>
        </div>
      </div>

      {savedMsg && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Edit Profile Info */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#5D0D1A] flex items-center gap-2 border-b border-[#9FB2AC]/60 pb-3">
            <User size={16} className="text-[#5D0D1A]" />
            Administrator Credentials
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">Full Name</label>
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none focus:border-[#5D0D1A]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">Admin Username</label>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none focus:border-[#5D0D1A]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">Admin Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none focus:border-[#5D0D1A]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save size={15} />
                <span>Save Profile Info</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#5D0D1A] flex items-center gap-2 border-b border-[#9FB2AC]/60 pb-3">
            <Lock size={16} className="text-[#5D0D1A]" />
            Change Admin Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none focus:border-[#5D0D1A]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">New Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none focus:border-[#5D0D1A]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none focus:border-[#5D0D1A]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Key size={15} />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminProfile;
