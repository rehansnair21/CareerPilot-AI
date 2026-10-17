import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  LayoutDashboard,
  User,
  FileCheck,
  FileText,
  PieChart,
  Sparkles,
  Map,
  Briefcase,
  LogOut,
  X,
  ChevronRight,
  ChevronDown,
  Code,
  Brain,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose, activeTab = 'dashboard', setActiveTab, userProfilePhoto }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState(userProfilePhoto || '');
  const [assessmentsExpanded, setAssessmentsExpanded] = useState(
    activeTab === 'assessments' || activeTab === 'assessments-technical' || activeTab === 'assessments-soft'
  );
  const [coursesExpanded, setCoursesExpanded] = useState(
    activeTab === 'courses' || activeTab === 'enrollments'
  );
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    if (activeTab === 'assessments' || activeTab === 'assessments-technical' || activeTab === 'assessments-soft') {
      setAssessmentsExpanded(true);
    }
    if (activeTab === 'courses' || activeTab === 'enrollments') {
      setCoursesExpanded(true);
    }
  }, [activeTab]);

  const fetchSidebarEnrollments = async () => {
    if (user && user.role === 'student') {
      try {
        const res = await api.get('/student/enrollments');
        if (res.data && res.data.success) {
          setEnrolledCourses(res.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching sidebar enrollments:', err);
      }
    }
  };

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (user && user.role === 'student') {
      try {
        const res = await api.get('/student/unread-count');
        if (res.data && res.data.success && res.data.data) {
          setUnreadMessagesCount(res.data.data.unreadMessages || 0);
        }
      } catch (err) {
        // ignore
      }
    }
  };

  useEffect(() => {
    fetchSidebarEnrollments();
    fetchUnreadCount();

    const handleEnrollmentUpdated = () => {
      fetchSidebarEnrollments();
    };

    const handleUnreadUpdated = () => {
      fetchUnreadCount();
    };

    window.addEventListener('enrollmentUpdated', handleEnrollmentUpdated);
    window.addEventListener('unreadMessagesUpdated', handleUnreadUpdated);
    return () => {
      window.removeEventListener('enrollmentUpdated', handleEnrollmentUpdated);
      window.removeEventListener('unreadMessagesUpdated', handleUnreadUpdated);
    };
  }, [user]);

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

  const primaryNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'courses', label: 'Courses & Learning', icon: BookOpen },
    { id: 'messages', label: 'Mentor Messages', icon: MessageSquare },
    { id: 'assessments', label: 'Assessments', icon: FileCheck },
    { id: 'resume', label: 'Resume Analysis', icon: FileText },
    { id: 'portfolio', label: 'Portfolio Analysis', icon: PieChart },
    { id: 'recommendations', label: 'Career Recommendations', icon: Sparkles },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
  ];

  const handleNavClick = (id, extraState) => {
    if (setActiveTab) {
      setActiveTab(id, extraState);
    }

    if (id === 'profile') {
      navigate('/student/profile');
    } else if (id === 'dashboard') {
      navigate('/student/dashboard', { state: { activeTab: 'dashboard' } });
    } else {
      // If user clicks a tab while on /student/profile, navigate to dashboard with that tab
      if (window.location.pathname !== '/student/dashboard') {
        navigate('/student/dashboard', { state: { activeTab: id, ...extraState } });
      }
    }

    if (onClose) onClose();
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

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#2D060D]/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Main Container (265px) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[265px] bg-white border-r border-[#9FB2AC] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 shadow-[2px_0_12px_-4px_rgba(93,13,26,0.06)]'
          }`}
      >
        {/* Top Section: Brand & Navigation */}
        <div>
          {/* Brand Header */}
          <div className="h-[72px] px-5 border-b border-[#9FB2AC]/70 flex items-center justify-between">
            <div
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] flex items-center justify-center text-[#FFF9EB] shadow-md shadow-[#5D0D1A]/20">
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
                  Professional Career Co-pilot
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
          <div className="px-3.5 py-4 overflow-y-auto max-h-[calc(100vh-170px)] scrollbar-none space-y-6">
            {/* Primary Section */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A6C66] px-3 mb-2">
                Main Menu
              </div>
              <nav className="space-y-1 relative">
                {primaryNav.map((item) => {
                  const Icon = item.icon;

                  if (item.id === 'courses') {
                    const isCoursesActive = activeTab === 'courses' || activeTab === 'enrollments';

                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          onClick={() => {
                            setCoursesExpanded(!coursesExpanded);
                            if (!isCoursesActive) {
                              handleNavClick('courses');
                            }
                          }}
                          className={`relative w-full flex items-center justify-between h-[46px] px-[13px] rounded-[12px] text-[14px] transition-all duration-200 ease-out group ${
                            isCoursesActive
                              ? 'bg-gradient-to-r from-[#FFF9EB] to-[#F7EED8] text-[#5D0D1A] font-extrabold shadow-2xs'
                              : 'bg-transparent text-[#5A6C66] font-medium hover:bg-[#FFF9EB] hover:text-[#5D0D1A] hover:translate-x-[2px]'
                          }`}
                        >
                          {isCoursesActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-[3.5px] bg-[#5D0D1A] rounded-r-full" />
                          )}

                          <div className="flex items-center gap-[12px]">
                            <Icon
                              size={19}
                              className={`transition-colors duration-200 ${
                                isCoursesActive ? 'text-[#5D0D1A]' : 'text-[#5A6C66] group-hover:text-[#5D0D1A]'
                              }`}
                            />
                            <span>{item.label}</span>
                            {enrolledCourses.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#5D0D1A] text-[#FFF9EB] text-[10px] font-black shrink-0">
                                {enrolledCourses.length}
                              </span>
                            )}
                          </div>

                          {coursesExpanded ? (
                            <ChevronDown size={15} className="text-[#5D0D1A]" />
                          ) : (
                            <ChevronRight size={14} className="text-[#9FB2AC] group-hover:text-[#5D0D1A]" />
                          )}
                        </button>

                        {/* Expandable Sub-Menu for My Enrollments & Catalog */}
                        <AnimatePresence>
                          {coursesExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pl-3 space-y-1 overflow-hidden"
                            >
                              {/* Catalog Link */}
                              <button
                                onClick={() => handleNavClick('courses')}
                                className="w-full flex items-center gap-2 h-[36px] px-3 rounded-[10px] text-[12px] font-extrabold text-[#5D0D1A] hover:bg-[#FFF9EB] transition-all"
                              >
                                <BookOpen size={14} className="text-[#5D0D1A]" />
                                <span>Course Catalog</span>
                              </button>

                              {/* My Enrollments Header */}
                              <div className="pt-2 pb-1 px-3 flex items-center justify-between text-[10px] font-black uppercase text-[#5D0D1A] tracking-wider border-t border-[#9FB2AC]/40">
                                <span className="flex items-center gap-1.5">
                                  <GraduationCap size={14} className="text-[#5D0D1A]" />
                                  <span>My Enrollments</span>
                                </span>
                                <span className="px-1.5 py-0.2 bg-[#5D0D1A]/10 text-[#5D0D1A] rounded-full text-[9px] font-extrabold">
                                  {enrolledCourses.length}
                                </span>
                              </div>

                              {/* List of Enrolled Courses */}
                              {enrolledCourses.length === 0 ? (
                                <div className="px-3 py-1.5 text-[11px] text-[#4A5D57] font-medium italic">
                                  No enrolled courses yet
                                </div>
                              ) : (
                                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                  {enrolledCourses.map((enr) => {
                                    const courseDoc = enr.courseId;
                                    if (!courseDoc || typeof courseDoc !== 'object') return null;

                                    return (
                                      <button
                                        key={enr._id || courseDoc._id}
                                        onClick={() => handleNavClick('courses', { openCourseId: courseDoc._id })}
                                        title={courseDoc.title}
                                        className="w-full flex items-center justify-between h-[34px] px-2.5 rounded-[9px] text-[11px] font-semibold text-[#2D060D] hover:bg-[#FFF9EB] hover:text-[#5D0D1A] transition-all group/item border border-transparent hover:border-[#9FB2AC]/40"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                          <span className="truncate text-left">{courseDoc.title}</span>
                                        </div>
                                        {((enr.progressStats?.percentage !== undefined ? enr.progressStats.percentage : enr.progressPercentage) || 0) > 0 && (
                                          <span className="text-[9px] font-black text-[#5D0D1A] shrink-0 ml-1">
                                            {(enr.progressStats?.percentage !== undefined ? enr.progressStats.percentage : enr.progressPercentage)}%
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  if (item.id === 'assessments') {
                    const isAssessmentActive =
                      activeTab === 'assessments' ||
                      activeTab === 'assessments-technical' ||
                      activeTab === 'assessments-soft';

                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          onClick={() => {
                            setAssessmentsExpanded(!assessmentsExpanded);
                            if (!isAssessmentActive) {
                              handleNavClick('assessments-technical');
                            }
                          }}
                          className={`relative w-full flex items-center justify-between h-[46px] px-[13px] rounded-[12px] text-[14px] transition-all duration-200 ease-out group ${
                            isAssessmentActive
                              ? 'bg-gradient-to-r from-[#FFF9EB] to-[#F7EED8] text-[#5D0D1A] font-extrabold shadow-2xs'
                              : 'bg-transparent text-[#5A6C66] font-medium hover:bg-[#FFF9EB] hover:text-[#5D0D1A] hover:translate-x-[2px]'
                          }`}
                        >
                          {isAssessmentActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-[3.5px] bg-[#5D0D1A] rounded-r-full" />
                          )}

                          <div className="flex items-center gap-[12px]">
                            <Icon
                              size={19}
                              className={`transition-colors duration-200 ${
                                isAssessmentActive ? 'text-[#5D0D1A]' : 'text-[#5A6C66] group-hover:text-[#5D0D1A]'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>

                          {assessmentsExpanded ? (
                            <ChevronDown size={15} className="text-[#5D0D1A]" />
                          ) : (
                            <ChevronRight size={14} className="text-[#9FB2AC] group-hover:text-[#5D0D1A]" />
                          )}
                        </button>

                        {/* Sub-buttons for Assessments */}
                        <AnimatePresence>
                          {assessmentsExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pl-4 space-y-1 overflow-hidden"
                            >
                              {[
                                { id: 'assessments-technical', label: 'Technical Assessment', icon: Code },
                                { id: 'assessments-soft', label: 'Soft Skill Assessment', icon: Brain },
                              ].map((subItem) => {
                                const SubIcon = subItem.icon;
                                const isSubActive =
                                  activeTab === subItem.id ||
                                  (subItem.id === 'assessments-technical' && activeTab === 'assessments');
                                return (
                                  <button
                                    key={subItem.id}
                                    onClick={() => handleNavClick(subItem.id)}
                                    className={`w-full flex items-center gap-2.5 h-[38px] px-3 rounded-[10px] text-[13px] transition-all ${
                                      isSubActive
                                        ? 'bg-[#5D0D1A] text-[#FFF9EB] font-bold shadow-xs'
                                        : 'text-[#5A6C66] font-medium hover:bg-[#FFF9EB] hover:text-[#5D0D1A]'
                                    }`}
                                  >
                                    <SubIcon size={15} className={isSubActive ? 'text-[#FFF9EB]' : 'text-[#5A6C66]'} />
                                    <span>{subItem.label}</span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`relative w-full flex items-center justify-between h-[46px] px-[13px] rounded-[12px] text-[14px] transition-all duration-200 ease-out group ${isActive
                        ? 'bg-gradient-to-r from-[#FFF9EB] to-[#F7EED8] text-[#5D0D1A] font-extrabold shadow-2xs'
                        : 'bg-transparent text-[#5A6C66] font-medium hover:bg-[#FFF9EB] hover:text-[#5D0D1A] hover:translate-x-[2px]'
                        }`}
                    >
                      {/* 3.5px Vertical Bloodstone Active Indicator on Left */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3.5px] bg-[#5D0D1A] rounded-r-full" />
                      )}

                        <div className="flex items-center gap-[12px]">
                          <Icon
                            size={19}
                            className={`transition-colors duration-200 ${isActive ? 'text-[#5D0D1A]' : 'text-[#5A6C66] group-hover:text-[#5D0D1A]'
                              }`}
                          />
                          <span>{item.label}</span>
                          {item.id === 'messages' && unreadMessagesCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0">
                              {unreadMessagesCount}
                            </span>
                          )}
                        </div>

                      {isActive ? (
                        <ChevronRight size={15} className="text-[#5D0D1A]" />
                      ) : (
                        <ChevronRight size={14} className="text-[#9FB2AC] opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>


          </div>
        </div>

        {/* Student Profile Footer Card */}
        <div className="p-3.5 border-t border-[#9FB2AC]/70 bg-[#FFF9EB]/80">
          <div
            onClick={() => navigate('/student/profile')}
            className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-[#9FB2AC] shadow-2xs hover:border-[#5D0D1A]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isRealProfileImage(profilePhoto) ? (
                <img
                  src={profilePhoto}
                  alt="User Avatar"
                  className="w-9 h-9 rounded-xl object-cover border border-[#5D0D1A] shadow-sm shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-extrabold text-xs flex items-center justify-center shadow-md shadow-[#5D0D1A]/20 shrink-0">
                  {getInitials(user?.name || user?.fullName)}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-extrabold text-[#5D0D1A] truncate">
                  {user?.name || user?.fullName || 'Student'}
                </span>
                <span className="text-[10px] font-semibold text-[#5A6C66] truncate capitalize">
                  {user?.role || 'student'}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
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
