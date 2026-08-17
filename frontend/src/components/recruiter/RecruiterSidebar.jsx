import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  LayoutDashboard,
  User,
  PlusCircle,
  Briefcase,
  FileText,
  Users,
  Bell,
  Settings,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const RecruiterSidebar = ({ mobileOpen, setMobileOpen, onOpenNotifications, onOpenSettings }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/recruiter/profile', icon: User },
    { name: 'Post a Job', path: '/recruiter/jobs/new', icon: PlusCircle },
    { name: 'My Jobs', path: '/recruiter/jobs', icon: Briefcase },
    { name: 'Applications', path: '/recruiter/applications', icon: FileText },
    { name: 'Candidates', path: '/recruiter/candidates', icon: Users },
  ];

  const accountItems = [
    { name: 'Notifications', onClick: onOpenNotifications, icon: Bell, badge: '3' },
    { name: 'Settings', onClick: onOpenSettings, icon: Settings },
  ];

  const getInitials = (name) => {
    if (!name) return 'RC';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-[#9FB2AC] w-[265px] select-none shadow-xs">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#9FB2AC]/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5D0D1A] via-[#7A1424] to-[#420912] text-[#FFF9EB] flex items-center justify-center shadow-md shadow-[#5D0D1A]/20">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base text-[#5D0D1A] tracking-tight">CareerPilot</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#5D0D1A] text-[#FFF9EB] uppercase tracking-wider">AI</span>
            </div>
            <span className="text-[11px] font-bold text-[#5A6C66] flex items-center gap-1">
              <ShieldCheck size={12} className="text-[#5D0D1A]" /> Recruiter Co-pilot
            </span>
          </div>
        </div>

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-[#5A6C66] hover:bg-[#FFF9EB] lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6 scrollbar-thin">
        {/* Main Section */}
        <div className="space-y-1.5">
          <span className="px-3 text-[10px] font-extrabold uppercase text-[#5A6C66] tracking-wider block mb-2">
            Hiring Management
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] shadow-2xs'
                      : 'text-[#5A6C66] hover:bg-[#FFF9EB]/60 hover:text-[#5D0D1A]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#5D0D1A]" />
              </NavLink>
            );
          })}
        </div>

        {/* Account Section */}
        <div className="space-y-1.5 pt-2 border-t border-[#9FB2AC]/60">
          <span className="px-3 text-[10px] font-extrabold uppercase text-[#5A6C66] tracking-wider block mb-2">
            Account & System
          </span>
          {accountItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-xs text-[#5A6C66] hover:bg-[#FFF9EB]/60 hover:text-[#5D0D1A] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#5D0D1A] text-[#FFF9EB]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recruiter Footer Profile Card */}
      <div className="p-4 m-3 bg-[#FFF9EB] rounded-2xl border border-[#9FB2AC] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center font-black text-sm shadow-2xs">
            {getInitials(user?.name || user?.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-extrabold text-[#5D0D1A] truncate">
              {user?.name || user?.fullName || 'John Recruiter'}
            </h4>
            <p className="text-[11px] font-semibold text-[#5A6C66] truncate">
              {user?.email || 'recruiter@organization.com'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white border border-[#9FB2AC] text-red-700 hover:bg-red-50 text-xs font-extrabold transition-all shadow-2xs"
        >
          <LogOut size={14} />
          <span>Sign Out Account</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 animate-slide-right">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
