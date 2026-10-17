import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { TopNavbar } from '../../components/dashboard/TopNavbar';
import { WelcomeCard } from '../../components/dashboard/WelcomeCard';
import { StatsCards } from '../../components/dashboard/StatsCards';
import { CareerGoalCard } from '../../components/dashboard/CareerGoalCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { ResumeAnalysis } from '../../components/dashboard/ResumeAnalysis';
import { PortfolioAnalysis } from '../../components/dashboard/PortfolioAnalysis';
import { StudentJobs } from '../../components/dashboard/StudentJobs';
import { CodingAssessment } from '../../components/dashboard/CodingAssessment';
import { SoftSkillAssessment } from '../../components/dashboard/SoftSkillAssessment';
import { CareerRecommendations } from '../../components/dashboard/CareerRecommendations';
import { PersonalizedRoadmap } from '../../components/dashboard/PersonalizedRoadmap';
import { StudentCourses } from '../../components/dashboard/StudentCourses';
import { StudentMessages } from '../../components/dashboard/StudentMessages';
import { StudentMentorInterventionsCard } from '../../components/dashboard/StudentMentorInterventionsCard';
import { Sparkles, ArrowLeft, Construction, AlertCircle, RefreshCw, Code, Brain } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

export const StudentDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'dashboard');
  const [selectedRoadmapCareer, setSelectedRoadmapCareer] = useState(location.state?.career || null);

  const [selectedEnrollmentCourseId, setSelectedEnrollmentCourseId] = useState(location.state?.openCourseId || null);

  // Sync activeTab if location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (location.state?.openCourseId) {
      setSelectedEnrollmentCourseId(location.state.openCourseId);
    }
  }, [location]);

  // Reset transient roadmap selection state on user session change
  useEffect(() => {
    setSelectedRoadmapCareer(null);
    setSelectedEnrollmentCourseId(null);
  }, [user?._id]);

  // Dynamic database-driven dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    if (!dashboardData) {
      setDataLoading(true);
    }
    setDataError(null);
    try {
      const res = await api.get('/student/dashboard-stats');
      if (res.data && res.data.success) {
        setDashboardData(res.data.data);
      } else {
        setDataError(res.data?.message || 'Unable to load dashboard data.');
      }
    } catch (err) {
      console.error('Error fetching student stats:', err);
      const message = err.response?.data?.message || 'Unable to load dashboard data.';
      setDataError(message);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchDashboardStats();
    }
  }, [user, fetchDashboardStats]);

  useEffect(() => {
    const handleStatsUpdate = () => {
      fetchDashboardStats();
    };
    window.addEventListener('careerpilot:stats-updated', handleStatsUpdate);
    return () => {
      window.removeEventListener('careerpilot:stats-updated', handleStatsUpdate);
    };
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (activeTab === 'dashboard' && user && user.role === 'student') {
      fetchDashboardStats();
    }
  }, [activeTab, user, fetchDashboardStats]);

  const handleNavigateTab = (tab, extraState) => {
    if (tab === 'profile') {
      navigate('/student/profile');
    } else {
      if (tab === 'roadmap' && extraState?.career) {
        setSelectedRoadmapCareer(extraState.career);
      }
      if (tab === 'courses' && extraState?.openCourseId) {
        setSelectedEnrollmentCourseId(extraState.openCourseId);
      }
      setActiveTab(tab);
    }
  };

  // Auth Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9EB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-[#5D0D1A]">Loading session...</span>
        </div>
      </div>
    );
  }

  // Auth protection
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const moduleNames = {
    profile: 'Student Profile',
    courses: 'Courses & Learning',
    assessments: 'Skill Assessments',
    resume: 'Resume Analysis',
    portfolio: 'Portfolio Analysis',
    recommendations: 'Career Recommendations',
    roadmap: 'Personalized Roadmap',
    jobs: 'Jobs & Internships',
    messages: 'Mentor Messages',
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
      {/* Ambient Radial Lighting Glow in Background (Bloodstone & Misty Sage) */}
      <div className="fixed -top-40 right-1/4 w-[600px] h-[600px] bg-[#5D0D1A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-[#9FB2AC]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar
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
              <motion.div key="dashboard" {...pageTransition} className="space-y-10">
                {/* Data Loading State: Skeleton Cards */}
                {dataLoading ? (
                  <div className="space-y-8 animate-pulse">
                    {/* Hero Skeleton */}
                    <div className="h-64 bg-[#9FB2AC]/20 rounded-[28px] w-full border border-[#9FB2AC]/30" />

                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-36 bg-[#9FB2AC]/20 rounded-[22px] w-full border border-[#9FB2AC]/30" />
                      ))}
                    </div>

                    {/* Career Recommendation Skeleton */}
                    <div className="h-44 bg-[#9FB2AC]/20 rounded-[22px] w-full border border-[#9FB2AC]/30" />
                  </div>
                ) : dataError ? (
                  /* Data Error State */
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
                  /* Dynamic Loaded Dashboard with Section Anchors */
                  <>
                    {/* 1. Welcome Hero Feature */}
                    <WelcomeCard data={dashboardData} onNavigate={handleNavigateTab} />

                    {/* Mentor Guidance & Intervention Check-In */}
                    <StudentMentorInterventionsCard onNavigate={handleNavigateTab} />

                    {/* 2. Statistics Overview */}
                    <section id="overview">
                      <StatsCards data={dashboardData} />
                    </section>

                    {/* 3. Primary Career Recommendation Feature Card */}
                    <section id="recommendation">
                      <CareerGoalCard data={dashboardData} onNavigate={handleNavigateTab} />
                    </section>

                    {/* 4. Quick Actions */}
                    <section id="actions">
                      <QuickActions onNavigate={handleNavigateTab} />
                    </section>

                    {/* 5. Recent Activity Panel */}
                    <section id="activity">
                      <RecentActivity activities={dashboardData?.activities} />
                    </section>
                  </>
                )}
              </motion.div>
            ) : (activeTab === 'assessments' || activeTab === 'assessments-technical' || activeTab === 'assessments-soft') ? (
              <motion.div key={activeTab} {...pageTransition} className="space-y-6">
                {/* Assessment Sub-Buttons Navigation Bar */}
                <div className="bg-white rounded-[22px] p-2 border border-[#9FB2AC] shadow-xs flex items-center gap-2 max-w-md">
                  <button
                    onClick={() => setActiveTab('assessments-technical')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all ${
                      activeTab === 'assessments' || activeTab === 'assessments-technical'
                        ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-md shadow-[#5D0D1A]/10'
                        : 'bg-transparent text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB]'
                    }`}
                  >
                    <Code size={16} />
                    <span>Technical Assessment</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('assessments-soft')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all ${
                      activeTab === 'assessments-soft'
                        ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-md shadow-[#5D0D1A]/10'
                        : 'bg-transparent text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB]'
                    }`}
                  >
                    <Brain size={16} />
                    <span>Soft Skill Assessment</span>
                  </button>
                </div>

                {/* Sub-Assessment Content */}
                {activeTab === 'assessments-soft' ? (
                  <SoftSkillAssessment onAssessmentComplete={fetchDashboardStats} />
                ) : (
                  <CodingAssessment onAssessmentComplete={fetchDashboardStats} />
                )}
              </motion.div>
            ) : activeTab === 'resume' ? (
              <motion.div key="resume" {...pageTransition}>
                <ResumeAnalysis onAnalysisComplete={fetchDashboardStats} />
              </motion.div>
            ) : activeTab === 'portfolio' ? (
              <motion.div key="portfolio" {...pageTransition}>
                <PortfolioAnalysis onAnalysisComplete={fetchDashboardStats} />
              </motion.div>
            ) : activeTab === 'jobs' ? (
              <motion.div key="jobs" {...pageTransition}>
                <StudentJobs />
              </motion.div>
            ) : activeTab === 'recommendations' ? (
              <motion.div key="recommendations" {...pageTransition}>
                <CareerRecommendations
                  onNavigate={handleNavigateTab}
                  onSelectRoadmapCareer={(career) => {
                    setSelectedRoadmapCareer(career);
                    setActiveTab('roadmap');
                  }}
                />
              </motion.div>
            ) : activeTab === 'roadmap' ? (
              <motion.div key="roadmap" {...pageTransition}>
                <PersonalizedRoadmap
                  selectedCareer={selectedRoadmapCareer}
                  onNavigate={handleNavigateTab}
                />
              </motion.div>
            ) : activeTab === 'courses' ? (
              <motion.div key="courses" {...pageTransition}>
                <StudentCourses initialOpenCourseId={selectedEnrollmentCourseId} />
              </motion.div>
            ) : activeTab === 'messages' || activeTab === 'notifications' ? (
              <motion.div key="messages" {...pageTransition}>
                <StudentMessages
                  onNavigateToCourse={(courseId) => {
                    setSelectedEnrollmentCourseId(courseId);
                    setActiveTab('courses');
                  }}
                />
              </motion.div>
            ) : (

              /* Module Placeholder for Non-Dashboard Links */

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
                    The <strong>{moduleNames[activeTab]}</strong> module is part of the next phase of CareerPilot AI.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-sm font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02]"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Dashboard</span>
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
