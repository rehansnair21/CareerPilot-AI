import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Users,
  GraduationCap,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building,
  Award,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  User,
  ExternalLink,
  Eye,
  X,
  FileText,
  HelpCircle,
  Activity,
  Check,
  Calendar,
  Layers,
  BarChart3,
  UserCheck,
  ArrowUpRight,
  Brain,
  MessageSquare,
  AlertTriangle,
  Send,
  ChevronLeft,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MentorMessageModal from './MentorMessageModal';

export const MentorStudentProgress = () => {
  const [data, setData] = useState({
    studentProgressList: [],
    needsAttentionList: [],
    mentorCourses: [],
    stats: {
      totalEnrolledStudents: 0,
      totalEnrollments: 0,
      activeStudents: 0,
      completedCourses: 0,
      averageProgress: 0,
      needsAttentionCount: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');
  const [selectedProgressFilter, setSelectedProgressFilter] = useState('All');
  const [selectedProgressStatusFilter, setSelectedProgressStatusFilter] = useState('All'); // 'All' | 'On Track' | 'Needs Attention' | 'Low Progress' | 'Not Started'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Student for View Details Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('overview'); // 'overview' | 'lessons' | 'modules' | 'quizzes' | 'assignments' | 'timeline' | 'messages'

  // Message Composer Modal State
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [activeMessageTarget, setActiveMessageTarget] = useState({
    student: null,
    course: null,
    defaultTemplateKey: 'custom',
  });

  // Success toast state
  const [toastMessage, setToastMessage] = useState(null);

  const fetchStudentProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/student-progress');
      if (res.data && res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load student progress records');
      }
    } catch (err) {
      console.error('Error fetching student progress:', err);
      setError(err.response?.data?.message || 'Unable to connect to student progress service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentProgress();
  }, [fetchStudentProgress]);

  const { studentProgressList, needsAttentionList = [], mentorCourses, stats } = data;

  // Filter student progress items based on search and selected filters
  const filteredList = studentProgressList.filter((item) => {
    const studentName = (item.student?.name || '').toLowerCase();
    const studentEmail = (item.student?.email || '').toLowerCase();
    const college = (item.student?.college || '').toLowerCase();
    const courseTitle = (item.course?.title || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !query ||
      studentName.includes(query) ||
      studentEmail.includes(query) ||
      college.includes(query) ||
      courseTitle.includes(query);

    const matchesCourse =
      selectedCourseFilter === 'All' ||
      item.course?._id === selectedCourseFilter ||
      item.course?.title === selectedCourseFilter;

    const pct = item.progress?.overallPercentage ?? item.progress?.progressPercentage ?? 0;
    let matchesProgress = true;
    if (selectedProgressFilter === 'completed') {
      matchesProgress = pct === 100;
    } else if (selectedProgressFilter === 'in_progress') {
      matchesProgress = pct > 0 && pct < 100;
    } else if (selectedProgressFilter === 'not_started') {
      matchesProgress = pct === 0;
    }

    let matchesStatus = true;
    if (selectedStatusFilter === 'active') {
      matchesStatus = item.status === 'active';
    } else if (selectedStatusFilter === 'completed') {
      matchesStatus = item.status === 'completed' || pct === 100;
    } else if (selectedStatusFilter === 'dropped') {
      matchesStatus = item.status === 'dropped';
    }

    let matchesProgressStatus = true;
    if (selectedProgressStatusFilter !== 'All') {
      matchesProgressStatus = item.progressStatus === selectedProgressStatusFilter;
    }

    return matchesSearch && matchesCourse && matchesProgress && matchesStatus && matchesProgressStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenMessageComposer = (student, course, defaultTemplate = 'custom') => {
    setActiveMessageTarget({
      student,
      course,
      defaultTemplateKey: defaultTemplate,
    });
    setMessageModalOpen(true);
  };

  const handleMessageSentSuccess = (newMessage) => {
    setToastMessage(`Message sent to ${newMessage.recipientId?.fullName || newMessage.recipientId?.name || 'student'}!`);
    setTimeout(() => setToastMessage(null), 4000);

    // Update in-memory message history for this student
    setData((prev) => {
      const updatedList = prev.studentProgressList.map((item) => {
        if (
          item.student?._id === newMessage.recipientId?._id &&
          item.course?._id === newMessage.courseId?._id
        ) {
          const existingHistory = item.progress?.messageHistory || [];
          return {
            ...item,
            progress: {
              ...item.progress,
              messageHistory: [newMessage, ...existingHistory],
            },
          };
        }
        return item;
      });
      return { ...prev, studentProgressList: updatedList };
    });

    if (selectedItem) {
      setSelectedItem((prev) => {
        if (!prev) return null;
        const existingHistory = prev.progress?.messageHistory || [];
        return {
          ...prev,
          progress: {
            ...prev.progress,
            messageHistory: [newMessage, ...existingHistory],
          },
        };
      });
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const isRealProfileImage = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(dateString);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCourseFilter('All');
    setSelectedProgressFilter('All');
    setSelectedProgressStatusFilter('All');
    setSelectedStatusFilter('All');
    setCurrentPage(1);
  };

  const isFilterActive =
    searchQuery !== '' ||
    selectedCourseFilter !== 'All' ||
    selectedProgressFilter !== 'All' ||
    selectedProgressStatusFilter !== 'All' ||
    selectedStatusFilter !== 'All';

  // Helper badge for progress status
  const renderProgressStatusBadge = (status) => {
    switch (status) {
      case 'On Track':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            On Track
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={12} className="text-rose-600" />
            Needs Attention
          </span>
        );
      case 'Low Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="text-amber-600" />
            Low Progress
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-50 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#5D0D1A] text-[#FFF9EB] px-5 py-3 rounded-2xl shadow-xl border border-[#9FB2AC]/40 flex items-center gap-2.5 text-xs font-bold"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] rounded-[28px] p-6 md:p-10 text-[#FFF9EB] shadow-xl relative overflow-hidden border border-[#5D0D1A]">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#FFF9EB]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF9EB]/15 text-[#FFF9EB] text-xs font-extrabold border border-[#FFF9EB]/20">
            <TrendingUp size={14} className="text-[#FFF9EB]" />
            <span>Mentor-Based Student Progress Monitoring & Intervention</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Student Progress & Performance
          </h1>
          <p className="text-[#FFF9EB]/80 text-sm md:text-base font-medium leading-relaxed">
            Monitor real lesson completion percentages, quiz scores, assignment submissions, and send personalized intervention messages to support enrolled students.
          </p>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Enrolled Students */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs flex items-start justify-between relative overflow-hidden group hover:border-[#5D0D1A]/50 transition-all">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#5A6C66] uppercase tracking-wider">
              Total Enrolled Students
            </span>
            <div className="text-3xl font-black text-[#5D0D1A]">
              {loading ? '...' : stats.totalEnrolledStudents}
            </div>
            <p className="text-[11px] font-semibold text-[#5A6C66]">
              Across {mentorCourses.length} course{mentorCourses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users size={22} />
          </div>
        </div>

        {/* Card 2: Students Needing Attention */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs flex items-start justify-between relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#5A6C66] uppercase tracking-wider">
              Needs Attention
            </span>
            <div className="text-3xl font-black text-rose-600">
              {loading ? '...' : stats.needsAttentionCount || needsAttentionList.length}
            </div>
            <p className="text-[11px] font-semibold text-[#5A6C66]">
              Require mentor guidance
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Card 3: Completed Courses */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs flex items-start justify-between relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#5A6C66] uppercase tracking-wider">
              Completed Courses
            </span>
            <div className="text-3xl font-black text-amber-600">
              {loading ? '...' : stats.completedCourses}
            </div>
            <p className="text-[11px] font-semibold text-[#5A6C66]">
              100% course completion
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Award size={22} />
          </div>
        </div>

        {/* Card 4: Average Course Progress */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs flex items-start justify-between relative overflow-hidden group hover:border-[#5D0D1A]/50 transition-all">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#5A6C66] uppercase tracking-wider">
              Average Progress
            </span>
            <div className="text-3xl font-black text-[#5D0D1A]">
              {loading ? '...' : `${stats.averageProgress}%`}
            </div>
            <p className="text-[11px] font-semibold text-[#5A6C66]">
              Actual lesson completion rate
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BarChart3 size={22} />
          </div>
        </div>
      </div>

      {/* SECTION: AUTOMATIC STUDENT ATTENTION INDICATORS */}
      {needsAttentionList.length > 0 && (
        <section className="bg-rose-50/70 border-2 border-rose-200 rounded-[24px] p-6 space-y-4 shadow-xs animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">
                  Students Requiring Attention ({needsAttentionList.length})
                </h3>
                <p className="text-xs text-rose-700 font-medium">
                  Identified based on lesson completion schedules, inactivity, or quiz performance
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white text-rose-800 px-3 py-1 rounded-full border border-rose-200 self-start sm:self-auto">
              Intervention Recommended
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {needsAttentionList.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl p-4 border border-rose-200 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-black text-[#5D0D1A] text-sm truncate">
                        {item.student?.name}
                      </h4>
                      <p className="text-[11px] text-[#5A6C66] truncate font-mono">
                        {item.student?.email}
                      </p>
                    </div>
                    {renderProgressStatusBadge(item.progressStatus)}
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11px] font-bold text-rose-900 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-rose-600 block font-black">
                      Attention Reason:
                    </span>
                    <p className="line-clamp-2">
                      {item.attentionReasons?.[0] || 'Behind expected learning schedule'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#5A6C66]">
                    <div>
                      <span className="text-[10px] text-[#5A6C66]/80 block">Course:</span>
                      <p className="font-bold text-[#2D060D] truncate">{item.course?.title}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5A6C66]/80 block">Progress:</span>
                      <p className="font-bold text-[#5D0D1A]">{item.progress?.progressPercentage || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 border-t border-rose-100">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setActiveModalTab('overview');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#5D0D1A] text-xs font-bold border border-gray-200 transition-colors text-center"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() =>
                      handleOpenMessageComposer(
                        item.student,
                        item.course,
                        item.progressStatus === 'Low Progress' ? 'low_progress' : 'inactive'
                      )
                    }
                    className="flex-1 py-2 px-3 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Send size={12} />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search and Filters Section */}
      <div className="bg-white rounded-[22px] p-5 md:p-6 border border-[#9FB2AC] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6C66]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, email, college or course title..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-[#9FB2AC] bg-[#FFF9EB]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D0D1A] text-sm text-[#2D060D] placeholder-[#5A6C66] font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66] hover:text-[#5D0D1A] p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Course */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedCourseFilter}
                onChange={(e) => {
                  setSelectedCourseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-3.5 pr-9 py-3 rounded-xl border border-[#9FB2AC] bg-white text-xs font-bold text-[#5D0D1A] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A] cursor-pointer"
              >
                <option value="All">All Courses</option>
                {mentorCourses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <Filter
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5D0D1A] pointer-events-none"
              />
            </div>

            {/* Filter by Progress Status (On Track, Needs Attention, Low Progress, Not Started) */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedProgressStatusFilter}
                onChange={(e) => {
                  setSelectedProgressStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-3.5 pr-9 py-3 rounded-xl border border-[#9FB2AC] bg-white text-xs font-bold text-[#5D0D1A] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A] cursor-pointer"
              >
                <option value="All">All Progress Statuses</option>
                <option value="On Track">On Track</option>
                <option value="Needs Attention">Needs Attention</option>
                <option value="Low Progress">Low Progress</option>
                <option value="Not Started">Not Started</option>
              </select>
              <Filter
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5D0D1A] pointer-events-none"
              />
            </div>

            {/* Filter by Progress Percentage */}
            <div className="relative min-w-[160px]">
              <select
                value={selectedProgressFilter}
                onChange={(e) => {
                  setSelectedProgressFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-3.5 pr-9 py-3 rounded-xl border border-[#9FB2AC] bg-white text-xs font-bold text-[#5D0D1A] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A] cursor-pointer"
              >
                <option value="All">All Progress %</option>
                <option value="not_started">Not Started (0%)</option>
                <option value="in_progress">In Progress (1-99%)</option>
                <option value="completed">Completed (100%)</option>
              </select>
              <Filter
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5D0D1A] pointer-events-none"
              />
            </div>

            {/* Clear Filters */}
            {isFilterActive && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 rounded-xl bg-[#FFF9EB] hover:bg-red-50 text-red-600 text-xs font-extrabold border border-red-200 transition-colors flex items-center gap-1.5"
              >
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Student Progress Table Card */}
      <div className="bg-white rounded-[22px] border border-[#9FB2AC] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#5D0D1A]">Fetching student progress records from MongoDB...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#5D0D1A]">Unable to load progress data</h3>
              <p className="text-xs text-[#5A6C66]">{error}</p>
            </div>
            <button
              onClick={fetchStudentProgress}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold transition-all"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 md:p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center mx-auto shadow-2xs">
              <GraduationCap size={32} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-xl font-extrabold text-[#5D0D1A]">
                {studentProgressList.length === 0 ? 'No Enrolled Students Yet' : 'No Matching Students Found'}
              </h3>
              <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                {studentProgressList.length === 0
                  ? 'No students are enrolled in your courses yet. Once students enroll, actual progress percentages and learning records will appear here.'
                  : 'Try adjusting your search query or status filters to view student records.'}
              </p>
            </div>
            {isFilterActive && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold transition-all"
              >
                <X size={14} />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF9EB]/70 border-b border-[#9FB2AC]/70 text-[11px] font-extrabold uppercase tracking-wider text-[#5A6C66]">
                  <th className="py-4 px-5">Student</th>
                  <th className="py-4 px-5">Email</th>
                  <th className="py-4 px-5">Course</th>
                  <th className="py-4 px-5">Progress %</th>
                  <th className="py-4 px-5">Lessons</th>
                  <th className="py-4 px-5">Quiz Score</th>
                  <th className="py-4 px-5">Assignments</th>
                  <th className="py-4 px-5">Last Activity</th>
                  <th className="py-4 px-5">Progress Status</th>
                  <th className="py-4 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9FB2AC]/40 text-xs font-medium text-[#2D060D]">
                {paginatedList.map((item) => {
                  const pct = item.progress?.overallPercentage ?? item.progress?.progressPercentage ?? 0;
                  const quizScore = item.progress?.avgQuizScorePct;
                  const assignmentText = item.progress?.assignmentStatusText || 'None';

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-[#FFF9EB]/50 transition-colors group"
                    >
                      {/* Student Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {isRealProfileImage(item.student?.profilePhoto) ? (
                            <img
                              src={item.student.profilePhoto}
                              alt={item.student.name}
                              className="w-9 h-9 rounded-xl object-cover border border-[#9FB2AC] shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {getInitials(item.student?.name)}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-[#5D0D1A] text-sm truncate">
                              {item.student?.name}
                            </span>
                            <span className="text-[11px] text-[#5A6C66] font-medium truncate">
                              {item.student?.college !== 'N/A' ? item.student?.college : item.student?.targetCareer}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-5 text-[#5A6C66] font-mono text-[11px]">
                        {item.student?.email}
                      </td>

                      {/* Course */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5 max-w-[190px]">
                          <span className="font-bold text-[#5D0D1A] block truncate" title={item.course?.title}>
                            {item.course?.title}
                          </span>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]">
                            {item.course?.category || 'Development'}
                          </span>
                        </div>
                      </td>

                      {/* Progress Percentage */}
                      <td className="py-4 px-5 min-w-[140px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-extrabold">
                            <span
                              className={
                                pct === 100
                                  ? 'text-emerald-700'
                                  : pct > 40
                                  ? 'text-[#5D0D1A]'
                                  : 'text-amber-700'
                              }
                            >
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-[#9FB2AC]/40">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct === 100
                                  ? 'bg-emerald-500'
                                  : pct >= 50
                                  ? 'bg-gradient-to-r from-[#5D0D1A] to-[#7A1424]'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Lessons Completed / Total */}
                      <td className="py-4 px-5 font-bold text-[#5D0D1A] whitespace-nowrap">
                        {item.progress?.completedLessonsCount} / {item.progress?.totalLessonsCount}
                      </td>

                      {/* Quiz Score */}
                      <td className="py-4 px-5">
                        {quizScore !== null && quizScore !== undefined ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border ${
                              quizScore >= 80
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : quizScore >= 60
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {quizScore}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-200 text-[11px] font-semibold">
                            N/A
                          </span>
                        )}
                      </td>

                      {/* Assignment Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            assignmentText.includes('No Assignments')
                              ? 'bg-gray-50 text-gray-500 border-gray-200'
                              : assignmentText.startsWith('0/')
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {assignmentText}
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="py-4 px-5 text-[#5A6C66] text-[11px] font-medium whitespace-nowrap">
                        {formatTimeAgo(item.lastActivity)}
                      </td>

                      {/* Progress Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {renderProgressStatusBadge(item.progressStatus)}
                      </td>

                      {/* Actions: View Details & Send Message */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setActiveModalTab('overview');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF9EB] hover:bg-[#5D0D1A] text-[#5D0D1A] hover:text-[#FFF9EB] border border-[#5D0D1A] text-xs font-bold transition-all shadow-2xs hover:scale-[1.02]"
                            title="View Student Progress Details"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() =>
                              handleOpenMessageComposer(
                                item.student,
                                item.course,
                                item.progressStatus === 'Low Progress'
                                  ? 'low_progress'
                                  : item.progressStatus === 'Needs Attention'
                                  ? 'inactive'
                                  : 'encouragement'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold transition-all shadow-2xs hover:scale-[1.02]"
                            title="Send Intervention Message"
                          >
                            <MessageSquare size={13} />
                            <span>Message</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-[#FFF9EB]/40 border-t border-[#9FB2AC]/50 flex items-center justify-between text-xs text-[#5A6C66]">
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} students
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-[#9FB2AC] hover:bg-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="font-bold text-[#5D0D1A]">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-[#9FB2AC] hover:bg-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Individual Student Progress Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-[#2D060D]/60 backdrop-blur-xs"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl bg-white rounded-[28px] border border-[#9FB2AC] shadow-2xl overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] p-6 text-[#FFF9EB] flex items-start justify-between shrink-0">
                <div className="flex items-center gap-4">
                  {isRealProfileImage(selectedItem.student?.profilePhoto) ? (
                    <img
                      src={selectedItem.student.profilePhoto}
                      alt={selectedItem.student.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[#FFF9EB]/40 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] font-black text-lg flex items-center justify-center shrink-0 border-2 border-[#FFF9EB]/40 shadow-md">
                      {getInitials(selectedItem.student?.name)}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-black">
                        {selectedItem.student?.name}
                      </h2>
                      {renderProgressStatusBadge(selectedItem.progressStatus)}
                    </div>
                    <p className="text-xs text-[#FFF9EB]/80 font-mono">
                      {selectedItem.student?.email}
                    </p>
                    <p className="text-xs text-[#FFF9EB]/90 font-medium">
                      Course: <strong>{selectedItem.course?.title}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 text-[#FFF9EB]/80 hover:text-[#FFF9EB] hover:bg-[#FFF9EB]/15 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="bg-[#FFF9EB] border-b border-[#9FB2AC]/70 px-6 pt-3 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                {[
                  { id: 'overview', label: 'Overview & Profile', icon: User },
                  { id: 'lessons', label: `Lessons (${selectedItem.progress?.completedLessonsCount}/${selectedItem.progress?.totalLessonsCount})`, icon: BookOpen },
                  { id: 'modules', label: `Modules (${selectedItem.progress?.completedModulesCount || 0}/${selectedItem.progress?.totalModulesCount || 0})`, icon: Layers },
                  { id: 'quizzes', label: `Quizzes (${selectedItem.progress?.quizzesList?.length || 0})`, icon: HelpCircle },
                  { id: 'assignments', label: `Assignments (${selectedItem.progress?.submittedAssignmentsCount}/${selectedItem.progress?.totalAssignmentsCount})`, icon: FileText },
                  { id: 'timeline', label: 'Progress History', icon: Clock },
                  { id: 'messages', label: `Messages (${selectedItem.progress?.messageHistory?.length || 0})`, icon: MessageSquare },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeModalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveModalTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition-all border-t border-x border-transparent whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-[#5D0D1A] border-[#9FB2AC] shadow-2xs'
                          : 'text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-white/60'
                      }`}
                    >
                      <Icon size={15} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modal Body Scroll Area */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                {/* Tab 1: Overview & Profile */}
                {activeModalTab === 'overview' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Attention alert if applicable */}
                    {selectedItem.needsAttention && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                        <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wide">
                          <AlertTriangle size={15} />
                          <span>Student Requires Attention</span>
                        </div>
                        <ul className="text-xs list-disc list-inside space-y-1 font-semibold text-rose-700">
                          {selectedItem.attentionReasons?.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Progress Bar Header Card */}
                    <div className="bg-[#FFF9EB]/60 rounded-2xl p-6 border border-[#9FB2AC]/70 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#5A6C66] uppercase tracking-wider">
                          Course Progress Formula: (Completed Lessons / Total Published Lessons) × 100
                        </span>
                        <span className="text-2xl font-black text-[#5D0D1A]">
                          {selectedItem.progress?.overallPercentage ?? selectedItem.progress?.progressPercentage}%
                        </span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden border border-[#9FB2AC]/50">
                        <div
                          className="h-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] rounded-full transition-all duration-500"
                          style={{ width: `${selectedItem.progress?.overallPercentage ?? selectedItem.progress?.progressPercentage}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-center">
                        <div className="bg-white p-3 rounded-xl border border-[#9FB2AC]/50">
                          <span className="text-[10px] font-bold text-[#5A6C66] uppercase block">
                            Lessons Completed
                          </span>
                          <span className="text-sm font-extrabold text-[#5D0D1A]">
                            {selectedItem.progress?.completedLessonsCount} / {selectedItem.progress?.totalLessonsCount}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-[#9FB2AC]/50">
                          <span className="text-[10px] font-bold text-[#5A6C66] uppercase block">
                            Avg Quiz Score
                          </span>
                          <span className="text-sm font-extrabold text-emerald-700">
                            {selectedItem.progress?.avgQuizScorePct !== null && selectedItem.progress?.avgQuizScorePct !== undefined
                              ? `${selectedItem.progress?.avgQuizScorePct}%`
                              : 'N/A'}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-[#9FB2AC]/50">
                          <span className="text-[10px] font-bold text-[#5A6C66] uppercase block">
                            Assignments
                          </span>
                          <span className="text-sm font-extrabold text-purple-700">
                            {selectedItem.progress?.submittedAssignmentsCount} / {selectedItem.progress?.totalAssignmentsCount}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-[#9FB2AC]/50">
                          <span className="text-[10px] font-bold text-[#5A6C66] uppercase block">
                            Last Active
                          </span>
                          <span className="text-xs font-bold text-[#5D0D1A]">
                            {formatTimeAgo(selectedItem.lastActivity)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Student Academic & Profile Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-[#5D0D1A] uppercase tracking-wider flex items-center gap-2">
                        <User size={16} />
                        Student Profile Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Phone</span>
                          <p className="text-xs font-bold text-gray-800">
                            {selectedItem.student?.phone || 'Not provided'}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Enrollment Date</span>
                          <p className="text-xs font-bold text-gray-800">
                            {formatDate(selectedItem.enrolledAt)}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">College / University</span>
                          <p className="text-xs font-bold text-gray-800">
                            {selectedItem.student?.college || 'Not provided'}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Degree & Specialization</span>
                          <p className="text-xs font-bold text-gray-800">
                            {selectedItem.student?.degree
                              ? `${selectedItem.student.degree} ${selectedItem.student.specialization ? `(${selectedItem.student.specialization})` : ''}`
                              : 'Not provided'}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Target Career</span>
                          <p className="text-xs font-bold text-[#5D0D1A]">
                            {selectedItem.student?.targetCareer}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                          <span className="text-[11px] font-semibold text-gray-500">Course Duration</span>
                          <p className="text-xs font-bold text-gray-800">
                            {selectedItem.course?.duration || 'Self-paced'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Lessons Breakdown (Completed & Pending) */}
                {activeModalTab === 'lessons' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Pending Lessons (What the student needs to complete next) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={14} className="text-amber-600" />
                          <span>Pending Lessons ({selectedItem.progress?.pendingLessons?.length || 0})</span>
                        </h4>
                        <span className="text-[11px] text-[#5A6C66] font-semibold">
                          What the student needs to complete next
                        </span>
                      </div>

                      {selectedItem.progress?.pendingLessons?.length === 0 ? (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span>All lessons in this course have been completed!</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedItem.progress?.pendingLessons?.map((les, index) => (
                            <div
                              key={les._id || index}
                              className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-white border border-amber-300 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {index + 1}
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-[#2D060D]">{les.title}</h5>
                                  <span className="text-[10px] text-[#5A6C66]">
                                    Module: {les.moduleTitle} • Duration: {les.duration}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Incomplete
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Completed Lessons */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Completed Lessons ({selectedItem.progress?.completedLessons?.length || 0})</span>
                        </h4>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          Successfully verified
                        </span>
                      </div>

                      {selectedItem.progress?.completedLessons?.length === 0 ? (
                        <p className="text-xs text-[#5A6C66] italic py-2">
                          No lessons have been completed yet by this student.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedItem.progress?.completedLessons?.map((les, index) => (
                            <div
                              key={les._id || index}
                              className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                  <Check size={13} />
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-[#2D060D]">{les.title}</h5>
                                  <span className="text-[10px] text-[#5A6C66]">
                                    Module: {les.moduleTitle} • Duration: {les.duration}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Completed
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Completed Modules */}
                {activeModalTab === 'modules' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#9FB2AC]/40 pb-3">
                      <h3 className="text-sm font-black text-[#5D0D1A] flex items-center gap-2">
                        <Layers size={16} />
                        Course Modules Progression
                      </h3>
                      <span className="text-xs font-bold text-[#5A6C66]">
                        {selectedItem.progress?.completedModulesCount || 0} of{' '}
                        {selectedItem.progress?.totalModulesCount || 0} Modules Completed
                      </span>
                    </div>

                    {selectedItem.progress?.completedModules?.length === 0 ? (
                      <p className="text-xs text-[#5A6C66] italic py-4">
                        No modules created for this course yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedItem.progress?.completedModules?.map((mod, idx) => (
                          <div
                            key={mod._id || idx}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                              mod.isCompleted
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  mod.isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-gray-500 border border-gray-300'
                                }`}
                              >
                                {mod.isCompleted ? <Check size={16} /> : idx + 1}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-[#2D060D]">{mod.title}</h4>
                                <span className="text-[10px] text-[#5A6C66]">Module Order: {mod.order}</span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                                mod.isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {mod.isCompleted ? 'Module Completed' : 'In Progress'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Quiz Scores */}
                {activeModalTab === 'quizzes' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#9FB2AC]/40 pb-3">
                      <h3 className="text-sm font-black text-[#5D0D1A] flex items-center gap-2">
                        <HelpCircle size={16} />
                        Quiz Performance & Scores
                      </h3>
                      {selectedItem.progress?.avgQuizScorePct !== null && (
                        <span className="text-xs font-bold text-emerald-700">
                          Average Score: {selectedItem.progress?.avgQuizScorePct}%
                        </span>
                      )}
                    </div>

                    {selectedItem.progress?.quizzesList?.length === 0 ? (
                      <p className="text-xs text-[#5A6C66] italic py-4">
                        No quizzes have been created for this course yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {selectedItem.progress?.quizzesList?.map((qz) => (
                          <div
                            key={qz._id}
                            className="p-4 rounded-xl border border-[#9FB2AC]/60 bg-[#FFF9EB]/30 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-xs font-bold text-[#5D0D1A]">{qz.title}</h4>
                                <span className="text-[10px] text-[#5A6C66]">
                                  Total Questions: {qz.totalQuestions} • Attempts: {qz.attemptsCount}
                                </span>
                              </div>

                              <span
                                className={`text-xs font-black px-3 py-1 rounded-full border ${
                                  qz.attemptsCount === 0
                                    ? 'bg-gray-100 text-gray-500 border-gray-200'
                                    : qz.percentage >= 70
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {qz.attemptsCount === 0 ? 'Not Attempted' : `${qz.percentage}% Score`}
                              </span>
                            </div>

                            {qz.attemptsCount > 0 && (
                              <div className="flex items-center justify-between text-[11px] font-semibold text-[#5A6C66] pt-1 border-t border-[#9FB2AC]/30">
                                <span>
                                  Marks: <strong>{qz.score} / {qz.maxScore}</strong>
                                </span>
                                <span>Attempted: {formatDate(qz.lastAttemptedAt)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 5: Assignment Submissions */}
                {activeModalTab === 'assignments' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#9FB2AC]/40 pb-3">
                      <h3 className="text-sm font-black text-[#5D0D1A] flex items-center gap-2">
                        <FileText size={16} />
                        Assignment Submissions & Status
                      </h3>
                    </div>

                    {selectedItem.progress?.assignmentsList?.length === 0 ? (
                      <p className="text-xs text-[#5A6C66] italic py-4">
                        No assignments have been assigned in this course.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedItem.progress?.assignmentsList?.map((asg) => (
                          <div
                            key={asg._id}
                            className={`p-4 rounded-xl border ${
                              asg.isSubmitted ? 'bg-purple-50/40 border-purple-200' : 'bg-gray-50 border-gray-200'
                            } space-y-3`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-[#2D060D]">{asg.title}</h4>
                                <span className="text-[10px] text-[#5A6C66]">Module: {asg.moduleTitle}</span>
                              </div>

                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                                  asg.isSubmitted
                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                              >
                                {asg.status}
                              </span>
                            </div>

                            {asg.isSubmitted ? (
                              <div className="p-3 bg-white rounded-lg border border-purple-200 space-y-2 text-xs">
                                {asg.submissionText && (
                                  <div>
                                    <span className="text-[10px] font-bold text-purple-700 uppercase block">
                                      Submission Text:
                                    </span>
                                    <p className="text-gray-700 font-medium whitespace-pre-wrap">{asg.submissionText}</p>
                                  </div>
                                )}

                                {asg.submissionUrl && (
                                  <a
                                    href={asg.submissionUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"
                                  >
                                    <ExternalLink size={13} />
                                    <span>View Document / Repository Link</span>
                                  </a>
                                )}

                                <div className="text-[10px] text-gray-400 text-right pt-1">
                                  Submitted on {formatDate(asg.submittedAt)}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-500 italic">
                                Student has not submitted this assignment yet.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 6: Progress Timeline */}
                {activeModalTab === 'timeline' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#9FB2AC]/40 pb-3">
                      <h3 className="text-sm font-black text-[#5D0D1A] flex items-center gap-2">
                        <Clock size={16} />
                        Chronological Learning Activity Log
                      </h3>
                    </div>

                    {selectedItem.progress?.timeline?.length === 0 ? (
                      <p className="text-xs text-[#5A6C66] italic py-4">
                        No activity recorded yet for this enrollment.
                      </p>
                    ) : (
                      <div className="relative pl-6 border-l-2 border-[#9FB2AC]/60 space-y-6 my-2">
                        {selectedItem.progress?.timeline?.map((evt, idx) => (
                          <div key={evt.id || idx} className="relative group">
                            <div
                              className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white ${
                                evt.type === 'completion'
                                  ? 'border-amber-500 bg-amber-500'
                                  : evt.type === 'quiz'
                                  ? 'border-emerald-500'
                                  : evt.type === 'assignment'
                                  ? 'border-purple-500'
                                  : 'border-[#5D0D1A]'
                              }`}
                            />

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-[#5D0D1A]">{evt.title}</h4>
                                <span className="text-[10px] text-[#5A6C66] font-mono">
                                  {formatDate(evt.timestamp)}
                                </span>
                              </div>
                              {evt.description && (
                                <p className="text-[11px] text-[#5A6C66] font-medium">{evt.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 7: Message History */}
                {activeModalTab === 'messages' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#9FB2AC]/40 pb-3">
                      <h3 className="text-sm font-black text-[#5D0D1A] flex items-center gap-2">
                        <MessageSquare size={16} />
                        Intervention Message History
                      </h3>
                      <button
                        onClick={() =>
                          handleOpenMessageComposer(
                            selectedItem.student,
                            selectedItem.course,
                            'encouragement'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold hover:bg-[#7A1424] transition-all"
                      >
                        <Send size={12} />
                        <span>New Message</span>
                      </button>
                    </div>

                    {!selectedItem.progress?.messageHistory || selectedItem.progress?.messageHistory.length === 0 ? (
                      <div className="p-8 text-center bg-[#FFF9EB]/50 rounded-2xl border border-[#9FB2AC]/60 space-y-2">
                        <p className="text-xs font-bold text-[#5D0D1A]">No messages have been sent to this student yet.</p>
                        <p className="text-[11px] text-[#5A6C66]">
                          Send personalized advice or encouragement to guide them through the course.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedItem.progress.messageHistory.map((msg) => (
                          <div
                            key={msg._id}
                            className={`p-4 rounded-xl border space-y-2 ${
                              msg.messageType === 'student_reply'
                                ? 'bg-blue-50/60 border-blue-200'
                                : 'bg-[#FFF9EB]/60 border-[#9FB2AC]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#5D0D1A]">
                                {msg.subject}
                              </span>
                              <span className="text-[10px] text-[#5A6C66]">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs text-[#2D060D] whitespace-pre-wrap leading-relaxed">
                              {msg.body}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] text-[#5A6C66]">
                              <span>
                                {msg.messageType === 'student_reply' ? 'Student Reply' : 'Mentor Message'}
                              </span>
                              <span className={msg.isRead ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                                {msg.isRead ? 'Read by recipient' : 'Unread'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-[#FFF9EB] p-4 border-t border-[#9FB2AC]/70 flex items-center justify-between shrink-0">
                <button
                  onClick={() =>
                    handleOpenMessageComposer(
                      selectedItem.student,
                      selectedItem.course,
                      selectedItem.progressStatus === 'Low Progress'
                        ? 'low_progress'
                        : selectedItem.progressStatus === 'Needs Attention'
                        ? 'inactive'
                        : 'encouragement'
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-md transition-all hover:scale-[1.02]"
                >
                  <Send size={14} />
                  <span>Send Personalized Message</span>
                </button>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-extrabold transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Composer Modal */}
      <MentorMessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        student={activeMessageTarget.student}
        course={activeMessageTarget.course}
        defaultTemplateKey={activeMessageTarget.defaultTemplateKey}
        onMessageSent={handleMessageSentSuccess}
      />
    </div>
  );
};

export default MentorStudentProgress;
