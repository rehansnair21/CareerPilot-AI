import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { MentorSidebar } from '../../components/mentor/MentorSidebar';
import { TopNavbar } from '../../components/dashboard/TopNavbar';
import { MentorOverview } from '../../components/mentor/MentorOverview';
import { MentorProfile } from '../../components/mentor/MentorProfile';
import { MentorCourses } from '../../components/mentor/MentorCourses';
import { MentorEnrollments } from '../../components/mentor/MentorEnrollments';
import { MentorStudentProgress } from '../../components/mentor/MentorStudentProgress';
import { MentorMessagesView } from '../../components/mentor/MentorMessagesView';
import { Sparkles, ArrowLeft, Construction, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MentorDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === '/mentor/profile') return 'profile';
    return location.state?.activeTab || 'dashboard';
  });

  // Sync activeTab if location path or state changes
  useEffect(() => {
    if (location.pathname === '/mentor/profile') {
      setActiveTab('profile');
    } else if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    setDataError(null);
    try {
      const res = await api.get('/mentor/dashboard-stats');
      if (res.data && res.data.success) {
        setDashboardData(res.data.data);
      } else {
        setDataError(res.data?.message || 'Unable to load mentor dashboard stats');
      }
    } catch (err) {
      console.error('Error fetching mentor stats:', err);
      setDataError(err.response?.data?.message || 'Unable to load mentor dashboard stats');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'mentor') {
      fetchDashboardStats();
    }
  }, [user, fetchDashboardStats]);

  const handleNavigateTab = (tab) => {
    setActiveTab(tab);
  };

  // Auth Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9EB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-[#5D0D1A]">Loading mentor session...</span>
        </div>
      </div>
    );
  }

  // Auth Protection
  if (!user || user.role !== 'mentor') {
    return <Navigate to="/login" replace />;
  }

  const moduleNames = {
    profile: 'Mentor Profile',
    notifications: 'Notifications',
    settings: 'Account Settings',
  };

  const pageTransition = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] },
  };

  return (
    <div className="relative min-h-screen bg-[#FFF9EB] flex font-sans text-[#2D060D] antialiased selection:bg-[#5D0D1A] selection:text-[#FFF9EB] overflow-x-hidden">
      {/* Ambient Radial Lighting Glows */}
      <div className="fixed -top-40 right-1/4 w-[600px] h-[600px] bg-[#5D0D1A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-[#9FB2AC]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Mentor Sidebar Navigation */}
      <MentorSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
      />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col lg:pl-[265px] min-w-0 transition-all duration-300">
        {/* Top Navbar */}
        <TopNavbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          setActiveTab={handleNavigateTab}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 md:py-10 max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div key="dashboard" {...pageTransition}>
                {dataLoading ? (
                  <div className="space-y-8 animate-pulse">
                    <div className="h-44 bg-[#9FB2AC]/20 rounded-[28px] w-full border border-[#9FB2AC]/30" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-36 bg-[#9FB2AC]/20 rounded-[22px] w-full border border-[#9FB2AC]/30" />
                      ))}
                    </div>
                  </div>
                ) : dataError ? (
                  <div className="bg-white rounded-[22px] p-8 text-center border border-[#9FB2AC] shadow-xs space-y-4 my-8 max-w-lg mx-auto">
                    <div className="w-12 h-12 rounded-full bg-red-50 text-[#5D0D1A] flex items-center justify-center mx-auto border border-red-200">
                      <AlertCircle size={24} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-[#5D0D1A]">Unable to load dashboard data</h3>
                      <p className="text-[#4A5D57] text-xs font-medium">{dataError}</p>
                    </div>
                    <button
                      onClick={fetchDashboardStats}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold shadow-xs transition-all"
                    >
                      <RefreshCw size={14} />
                      <span>Retry</span>
                    </button>
                  </div>
                ) : (
                  <MentorOverview data={dashboardData} onNavigateTab={handleNavigateTab} />
                )}
              </motion.div>
            ) : activeTab === 'courses' ? (
              <motion.div key="courses" {...pageTransition}>
                <MentorCourses onCoursesUpdated={fetchDashboardStats} />
              </motion.div>
            ) : activeTab === 'enrollments' ? (
              <motion.div key="enrollments" {...pageTransition}>
                <MentorEnrollments />
              </motion.div>
            ) : activeTab === 'progress' ? (
              <motion.div key="progress" {...pageTransition}>
                <MentorStudentProgress />
              </motion.div>
            ) : activeTab === 'messages' ? (
              <motion.div key="messages" {...pageTransition}>
                <MentorMessagesView />
              </motion.div>
            ) : activeTab === 'profile' ? (
              <motion.div key="profile" {...pageTransition}>
                <MentorProfile />
              </motion.div>
            ) : (
              /* Module Placeholder */
              <motion.div
                key={activeTab}
                {...pageTransition}
                className="bg-white rounded-[22px] p-8 md:p-12 border border-[#9FB2AC] shadow-xs text-center space-y-5 my-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto shadow-2xs border border-[#9FB2AC]">
                  <Construction size={30} />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9EB] text-[#5D0D1A] text-xs font-bold border border-[#9FB2AC]">
                    <Sparkles size={13} className="text-[#5D0D1A]" />
                    Module Under Development
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#5D0D1A] tracking-tight">
                    {moduleNames[activeTab] || 'Feature Coming Soon'}
                  </h2>
                  <p className="text-[#4A5D57] text-sm leading-relaxed font-medium">
                    The <strong>{moduleNames[activeTab] || activeTab}</strong> module is part of the next phase of CareerPilot AI.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-sm font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02]"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Overview</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
