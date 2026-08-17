import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut, Database } from 'lucide-react';

export const AdminTopNavbar = ({
  onOpenMobileSidebar,
  activeTab = 'overview',
  setActiveTab
}) => {
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
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const titles = {
    overview: 'Overview & Analytics',
    users: 'User Management',
    students: 'Student Accounts',
    recruiters: 'Recruiter Companies',
    jobs: 'Job Postings Management',
    applications: 'Candidate Applications',
    'resume-ai': 'Resume & AI Analysis',
    assessments: 'Skill Assessments Control',
    analytics: 'Reports & Analytics',
    notifications: 'Admin Notifications',
    settings: 'System Configuration',
    profile: 'Admin Profile Settings',
  };

  return (
    <header className="sticky top-0 z-30 h-[72px] bg-white border-b border-[#9FB2AC] px-4 md:px-8 flex items-center justify-between transition-all shadow-2xs">
      {/* Left Section: Mobile Menu, Page Title & Badge, Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 mr-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB] rounded-xl transition-colors shrink-0"
          aria-label="Open Admin Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-base sm:text-lg font-extrabold text-[#5D0D1A] tracking-tight whitespace-nowrap">
            {titles[activeTab] || 'Admin Dashboard'}
          </h1>
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold bg-[#FFF9EB] text-[#5D0D1A] px-2.5 py-0.5 rounded-full border border-[#9FB2AC] whitespace-nowrap shrink-0">
            <Database size={11} /> MongoDB Active
          </span>
        </div>

        {/* Global Search */}
        <div className="relative w-full hidden md:block max-w-xs ml-2">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
          <input
            type="text"
            placeholder="Search admin workspace..."
            className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] transition-all font-medium"
          />
        </div>
      </div>

      {/* Right Section: Notifications Bell & Profile Dropdown */}
      <div className="flex items-center gap-2.5 md:gap-4 shrink-0">
        {/* Notifications Bell */}
        <button
          onClick={() => setActiveTab('notifications')}
          className="relative p-2 text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB] rounded-xl transition-colors"
          title="Admin Notifications"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#5D0D1A] rounded-full ring-2 ring-white" />
        </button>

        <div className="h-5 w-[1px] bg-[#9FB2AC] hidden sm:block" />

        {/* User Profile Dropdown Header */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-[#FFF9EB] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
              {getInitials(user?.fullName || user?.username || user?.name)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-extrabold text-[#5D0D1A] whitespace-nowrap">
                {user?.fullName || user?.username || 'Admin'}
              </span>
              <span className="text-[10px] font-semibold text-[#5A6C66] whitespace-nowrap">
                admins collection
              </span>
            </div>
            <ChevronDown size={15} className="text-[#5A6C66] shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#9FB2AC] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-200">
              <div className="px-4 py-2.5 border-b border-[#9FB2AC]/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold text-xs flex items-center justify-center shrink-0">
                  {getInitials(user?.fullName || user?.username || user?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[#5D0D1A] truncate">
                    {user?.fullName || user?.username || 'System Admin'}
                  </p>
                  <p className="text-[11px] text-[#5A6C66] truncate">{user?.email || 'admin@careerpilot.ai'}</p>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setActiveTab('profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A] transition-colors"
                >
                  <User size={15} />
                  <span>Admin Profile</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setActiveTab('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A] transition-colors"
                >
                  <Settings size={15} />
                  <span>System Settings</span>
                </button>
              </div>

              <div className="border-t border-[#9FB2AC]/70 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopNavbar;
