import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const RecruiterNavbar = ({ onOpenMobileMenu, onOpenNotifications, onOpenSettings, searchVal, setSearchVal }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    if (!name) return 'RC';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-20 bg-[#FFF9EB]/90 backdrop-blur-md border-b border-[#9FB2AC] px-4 md:px-8 py-3 shadow-2xs">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Menu Button & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl border border-[#9FB2AC] text-[#5D0D1A] hover:bg-white lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
            <input
              type="text"
              placeholder="Search candidates, jobs, applications..."
              value={searchVal || ''}
              onChange={(e) => setSearchVal && setSearchVal(e.target.value)}
              className="w-full bg-white border border-[#9FB2AC] rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-[#2D060D] placeholder:text-[#5A6C66] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A] transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notification Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-xl border border-[#9FB2AC] text-[#5D0D1A] hover:bg-white transition-all shadow-2xs"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5D0D1A] ring-2 ring-[#FFF9EB]" />
          </button>

          {/* Recruiter Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-[#9FB2AC] bg-white hover:bg-[#FFF9EB] transition-all shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-extrabold text-xs flex items-center justify-center shadow-2xs">
                {getInitials(user?.name || user?.fullName)}
              </div>
              <span className="hidden md:inline font-extrabold text-xs text-[#5D0D1A]">
                {user?.name || user?.fullName || 'John Recruiter'}
              </span>
              <ChevronDown size={14} className="text-[#5A6C66]" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#9FB2AC] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-[#9FB2AC]/60">
                  <p className="text-xs font-extrabold text-[#5D0D1A]">
                    {user?.name || user?.fullName || 'John Recruiter'}
                  </p>
                  <p className="text-[11px] font-semibold text-[#5A6C66] truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/recruiter/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-extrabold text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A]"
                  >
                    <User size={15} />
                    <span>Recruiter Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onOpenSettings) onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-extrabold text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A]"
                  >
                    <Settings size={15} />
                    <span>Account Settings</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#9FB2AC]/60">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-extrabold text-red-700 hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
