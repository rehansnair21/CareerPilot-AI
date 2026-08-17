import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  FileText,
  Layers,
  Sparkles,
  CheckSquare,
  TrendingUp,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  ChevronRight,
  Building2,
} from 'lucide-react';

export const AdminSidebar = ({ isOpen, onClose, activeTab = 'overview', setActiveTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mainModules = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'students', label: 'Student Management', icon: GraduationCap },
    { id: 'recruiters', label: 'Recruiter Management', icon: Building2 },
    { id: 'jobs', label: 'Job Management', icon: Briefcase },
    { id: 'applications', label: 'Application Management', icon: Layers },
    { id: 'resume-ai', label: 'Resume & AI Analysis', icon: Sparkles },
    { id: 'assessments', label: 'Assessments', icon: CheckSquare },
    { id: 'analytics', label: 'Reports & Analytics', icon: TrendingUp },
  ];

  const secondaryModules = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const handleNavClick = (id) => {
    if (setActiveTab) {
      setActiveTab(id);
    }
    if (onClose) onClose();
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#2D060D]/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Main Container (265px) matching Student Dashboard */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[265px] bg-white border-r border-[#9FB2AC] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full lg:translate-x-0 shadow-[2px_0_12px_-4px_rgba(93,13,26,0.06)]'
        }`}
      >
        {/* Top Section: Brand Header & Navigation */}
        <div>
          {/* Brand Header */}
          <div className="h-[72px] px-5 border-b border-[#9FB2AC]/70 flex items-center justify-between">
            <div
              onClick={() => handleNavClick('overview')}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] flex items-center justify-center text-[#FFF9EB] shadow-md shadow-[#5D0D1A]/20 shrink-0">
                <Compass size={22} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-[#5D0D1A] tracking-tight">CareerPilot</span>
                  <span className="text-[10px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] px-1.5 py-0.5 rounded-md border border-[#9FB2AC]">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-[#5A6C66] font-medium tracking-wide">
                  Admin Console
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB] rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Scrollable Container */}
          <div className="px-3.5 py-4 overflow-y-auto max-h-[calc(100vh-170px)] scrollbar-none space-y-5">
            {/* Primary Modules */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A6C66] px-3 mb-2">
                Admin Modules
              </div>
              <nav className="space-y-1 relative">
                {mainModules.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`relative w-full flex items-center justify-between h-[44px] px-[12px] rounded-[12px] text-[13.5px] transition-all duration-200 ease-out group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#FFF9EB] to-[#F7EED8] text-[#5D0D1A] font-extrabold shadow-2xs'
                          : 'bg-transparent text-[#5A6C66] font-medium hover:bg-[#FFF9EB] hover:text-[#5D0D1A] hover:translate-x-[2px]'
                      }`}
                    >
                      {/* 3.5px Vertical Bloodstone Active Indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3.5px] bg-[#5D0D1A] rounded-r-full" />
                      )}

                      <div className="flex items-center gap-[11px]">
                        <Icon
                          size={18}
                          className={`transition-colors duration-200 ${
                            isActive ? 'text-[#5D0D1A]' : 'text-[#5A6C66] group-hover:text-[#5D0D1A]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {isActive ? (
                        <ChevronRight size={14} className="text-[#5D0D1A] shrink-0" />
                      ) : (
                        <ChevronRight size={13} className="text-[#9FB2AC] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Divider */}
            <div className="border-t border-[#9FB2AC]/60" />

            {/* System Preferences */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A6C66] px-3 mb-2">
                System
              </div>
              <nav className="space-y-1">
                {secondaryModules.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`relative w-full flex items-center justify-between h-[44px] px-[12px] rounded-[12px] text-[13.5px] transition-all duration-200 ease-out group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#FFF9EB] to-[#F7EED8] text-[#5D0D1A] font-extrabold shadow-2xs'
                          : 'bg-transparent text-[#5A6C66] font-medium hover:bg-[#FFF9EB] hover:text-[#5D0D1A] hover:translate-x-[2px]'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3.5px] bg-[#5D0D1A] rounded-r-full" />
                      )}

                      <div className="flex items-center gap-[11px]">
                        <Icon
                          size={18}
                          className={`transition-colors duration-200 ${
                            isActive ? 'text-[#5D0D1A]' : 'text-[#5A6C66] group-hover:text-[#5D0D1A]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {isActive ? (
                        <ChevronRight size={14} className="text-[#5D0D1A] shrink-0" />
                      ) : (
                        <ChevronRight size={13} className="text-[#9FB2AC] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Footer Admin Profile Card */}
        <div className="p-3.5 border-t border-[#9FB2AC]/70 bg-[#FFF9EB]/80">
          <div
            onClick={() => handleNavClick('profile')}
            className={`flex items-center justify-between p-2.5 rounded-2xl border transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#FFF9EB] border-[#5D0D1A]'
                : 'bg-white border-[#9FB2AC] hover:border-[#5D0D1A]/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-extrabold text-xs flex items-center justify-center shadow-md shadow-[#5D0D1A]/20 shrink-0">
                {getInitials(user?.fullName || user?.username || user?.name)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-extrabold text-[#5D0D1A] truncate">
                  {user?.fullName || user?.username || 'Administrator'}
                </span>
                <span className="text-[10px] font-semibold text-[#5A6C66] truncate capitalize flex items-center gap-1">
                  <ShieldCheck size={11} className="text-[#5D0D1A]" /> Admin Console
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
                navigate('/login');
              }}
              title="Logout"
              className="p-2 text-[#5A6C66] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0 hover:scale-105 active:scale-95"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
