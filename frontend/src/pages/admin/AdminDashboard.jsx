import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminTopNavbar } from '../../components/admin/AdminTopNavbar';
import { AdminOverview } from '../../components/admin/AdminOverview';
import { AdminCourseManagement } from '../../components/admin/AdminCourseManagement';
import { AdminUserManagement } from '../../components/admin/AdminUserManagement';
import { AdminJobManagement } from '../../components/admin/AdminJobManagement';
import { AdminNotifications } from '../../components/admin/AdminNotifications';
import { AdminSettings } from '../../components/admin/AdminSettings';
import { AdminProfile } from '../../components/admin/AdminProfile';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  // Telemetry & Database State
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all backend telemetry
  const fetchData = useCallback(async () => {
    if (!stats) {
      setDataLoading(true);
    }
    setRefreshing(true);
    setDataError(null);

    try {
      const [statsRes, usersRes, jobsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => null),
        api.get('/admin/users').catch(() => null),
        api.get('/admin/jobs').catch(() => null),
      ]);

      if (statsRes?.data?.success) {
        setStats(statsRes.data.stats);
      }
      if (usersRes?.data?.success) {
        setUsersList(usersRes.data.users);
      }
      if (jobsRes?.data?.success) {
        setJobsList(jobsRes.data.jobs);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setDataError(err.response?.data?.message || 'Unable to load admin data from database.');
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  }, [stats]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, fetchData]);

  // Handle Deleting User Account
  const handleDeleteUser = async (userToDelete) => {
    if (
      !window.confirm(
        `Are you sure you want to delete account "${userToDelete.fullName || userToDelete.username}" from "${userToDelete.collectionName}" collection?`
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/admin/users/${userToDelete.collectionName}/${userToDelete._id}`);
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message || 'User deleted successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchData();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Failed to delete user account');
    }
  };

  // Handle Activating / Deactivating User Account
  const handleToggleUserStatus = async (userToToggle) => {
    if (userToToggle.role === 'admin') {
      alert('Admin accounts cannot be deactivated.');
      return;
    }

    const nextAction = userToToggle.isActive !== false ? 'deactivate' : 'activate';
    if (
      !window.confirm(
        `Are you sure you want to ${nextAction} account for "${userToToggle.fullName || userToToggle.name || userToToggle.username}"?`
      )
    ) {
      return;
    }

    try {
      const res = await api.put(`/admin/users/${userToToggle.collectionName}/${userToToggle._id}/toggle-status`);
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchData();
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert(err.response?.data?.message || 'Failed to update user active status');
    }
  };

  // Auth Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9EB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-extrabold text-[#5D0D1A]">Loading Admin Session...</span>
        </div>
      </div>
    );
  }

  // Auth Protection
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const pageTransition = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] },
  };

  return (
    <div className="relative min-h-screen bg-[#FFF9EB] flex font-sans text-[#2D060D] antialiased selection:bg-[#5D0D1A] selection:text-[#FFF9EB] overflow-x-hidden">
      {/* Ambient Radial Lighting Glow in Background (Bloodstone & Misty Sage) matching StudentDashboard */}
      <div className="fixed -top-40 right-1/4 w-[600px] h-[600px] bg-[#5D0D1A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-[#9FB2AC]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar Navigation */}
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-[265px] min-w-0 transition-all duration-300">
        {/* Top Navbar */}
        <AdminTopNavbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRefresh={fetchData}
          refreshing={refreshing}
        />

        {/* Content Container */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 md:py-10 max-w-[1400px] w-full mx-auto">
          
          {/* Notification Toast */}
          {successMsg && (
            <div className="mb-6 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-4 text-xs font-bold flex items-center gap-2 shadow-2xs">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {dataLoading ? (
              /* Loading Skeleton matching Student Dashboard */
              <div className="space-y-6 animate-pulse" key="loading-skeleton">
                <div className="h-44 bg-[#9FB2AC]/20 rounded-[26px] w-full border border-[#9FB2AC]/30" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-28 bg-[#9FB2AC]/20 rounded-[22px] w-full border border-[#9FB2AC]/30" />
                  ))}
                </div>
              </div>
            ) : dataError ? (
              /* Error State */
              <div key="data-error" className="bg-white rounded-[22px] p-8 text-center border border-red-200 shadow-xs space-y-4 my-8 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#5D0D1A]">Unable to connect to database</h3>
                  <p className="text-[#5A6C66] text-xs font-medium">{dataError}</p>
                </div>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-xs transition-all"
                >
                  <RefreshCw size={14} />
                  <span>Retry Connection</span>
                </button>
              </div>
            ) : (
              /* Tab Router Views */
              <motion.div key={activeTab} {...pageTransition}>
                {activeTab === 'overview' && (
                  <AdminOverview
                    stats={stats}
                    usersList={usersList}
                    jobsList={jobsList}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'courses' && (
                  <AdminCourseManagement />
                )}

                {activeTab === 'users' && (
                  <AdminUserManagement
                    usersList={usersList}
                    onDeleteUser={handleDeleteUser}
                    onToggleUserStatus={handleToggleUserStatus}
                  />
                )}

                {activeTab === 'jobs' && (
                  <AdminJobManagement jobsList={jobsList} onRefresh={fetchData} />
                )}

                {activeTab === 'notifications' && (
                  <AdminNotifications />
                )}

                {activeTab === 'settings' && (
                  <AdminSettings />
                )}

                {activeTab === 'profile' && (
                  <AdminProfile />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
