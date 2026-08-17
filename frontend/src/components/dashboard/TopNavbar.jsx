import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';

export const TopNavbar = ({ onOpenMobileSidebar, setActiveTab, userProfilePhoto }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(userProfilePhoto || '');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (userProfilePhoto !== undefined) {
      setProfilePhoto(userProfilePhoto);
    } else if (user && user.role === 'student') {
      api.get('/student/profile')
        .then((res) => {
          if (res.data && res.data.success && res.data.data.profile) {
            setProfilePhoto(res.data.data.profile.profilePhoto || '');
          }
        })
        .catch(() => { });
    }
  }, [user, userProfilePhoto]);

  // Listen for real-time profile updates/removals
  useEffect(() => {
    const handleProfileUpdated = (e) => {
      if (e.detail && e.detail.profilePhoto !== undefined) {
        setProfilePhoto(e.detail.profilePhoto);
      }
    };
    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdated);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleProfileClick = () => {
    setDropdownOpen(false);
    if (setActiveTab) {
      setActiveTab('profile');
    } else {
      navigate('/student/profile');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[72px] bg-white border-b border-[#9FB2AC] px-4 md:px-8 flex items-center justify-between transition-all">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB] rounded-xl transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
          <input
            type="text"
            placeholder="Search your career journey..."
            className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-10 pr-4 py-2 text-sm text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] transition-all font-medium"
          />
        </div>
      </div>

      {/* Right: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Notification Bell */}
        <button
          onClick={() => (setActiveTab ? setActiveTab('notifications') : navigate('/student/dashboard'))}
          className="relative p-2.5 text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB] rounded-xl transition-colors"
          title="Notifications"
        >
          <Bell size={19} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#5D0D1A] rounded-full ring-2 ring-white" />
        </button>

        <div className="h-5 w-[1px] bg-[#9FB2AC] hidden sm:block" />

        {/* User Profile Dropdown Header */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-[#FFF9EB] transition-colors"
          >
            {isRealProfileImage(profilePhoto) ? (
              <img
                src={profilePhoto}
                alt="User Avatar"
                className="w-8 h-8 rounded-lg object-cover border border-[#5D0D1A] shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold text-xs flex items-center justify-center shadow-2xs">
                {getInitials(user?.name || user?.fullName)}
              </div>
            )}
            <span className="text-sm font-extrabold text-[#5D0D1A] hidden md:block">
              {user?.name || user?.fullName || 'Student'}
            </span>
            <ChevronDown size={16} className="text-[#5A6C66]" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#9FB2AC] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-200">
              <div className="px-4 py-2.5 border-b border-[#9FB2AC]/70 flex items-center gap-3">
                {isRealProfileImage(profilePhoto) ? (
                  <img
                    src={profilePhoto}
                    alt="User Avatar"
                    className="w-9 h-9 rounded-xl object-cover border border-[#5D0D1A] shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(user?.name || user?.fullName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[#5D0D1A] truncate">
                    {user?.name || user?.fullName || 'Student User'}
                  </p>
                  <p className="text-[11px] text-[#5A6C66] truncate">{user?.email}</p>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A] transition-colors"
                >
                  <User size={15} />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (setActiveTab) setActiveTab('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A] transition-colors"
                >
                  <Settings size={15} />
                  <span>Settings</span>
                </button>
              </div>

              <div className="border-t border-[#9FB2AC]/70 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
