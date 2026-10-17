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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MentorEnrollments = ({ filterCourseId = null }) => {
  const [enrollmentsData, setEnrollmentsData] = useState({ enrollments: [], stats: { totalEnrollments: 0, uniqueStudentsCount: 0, courseBreakdown: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState(filterCourseId || 'All');
  const [selectedProgressFilter, setSelectedProgressFilter] = useState('All');

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/enrollments');
      if (res.data && res.data.success) {
        setEnrollmentsData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load enrolled students');
      }
    } catch (err) {
      console.error('Error fetching mentor enrollments:', err);
      setError(err.response?.data?.message || 'Failed to connect to enrollment service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  useEffect(() => {
    if (filterCourseId) {
      setSelectedCourseFilter(filterCourseId);
    }
  }, [filterCourseId]);

  const { enrollments, stats } = enrollmentsData;

  // Filter enrollments based on search query, course filter, and progress filter
  const filteredEnrollments = enrollments.filter((enr) => {
    const matchesSearch =
      enr.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.student.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.student.degree.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.course.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse =
      selectedCourseFilter === 'All' ||
      enr.course._id === selectedCourseFilter ||
      enr.course.title === selectedCourseFilter;

    const pct = enr.progressStats?.percentage || 0;
    let matchesProgress = true;
    if (selectedProgressFilter === 'completed') {
      matchesProgress = pct >= 80;
    } else if (selectedProgressFilter === 'in_progress') {
      matchesProgress = pct > 0 && pct < 80;
    } else if (selectedProgressFilter === 'not_started') {
      matchesProgress = pct === 0;
    }

    return matchesSearch && matchesCourse && matchesProgress;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] rounded-[28px] p-6 md:p-10 text-[#FFF9EB] shadow-xl relative overflow-hidden border border-[#5D0D1A]">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#FFF9EB]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF9EB]/15 text-[#FFF9EB] text-xs font-extrabold border border-[#FFF9EB]/20">
            <GraduationCap size={14} />
            <span>Student Management Portal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Enrolled Students Tracking
          </h1>
          <p className="text-[#FFF9EB]/80 text-sm md:text-base font-medium leading-relaxed">
            Monitor students enrolled in your courses, track their module progress, view academic backgrounds, and contact learners directly.
          </p>
        </div>
      </div>

      {/* Summary Statistics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase text-[#5A6C66] tracking-wider">Total Enrolled Students</span>
            <div className="text-3xl font-black text-[#5D0D1A]">{stats.uniqueStudentsCount}</div>
            <p className="text-[11px] text-[#4A5D57] font-medium">Unique student accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase text-[#5A6C66] tracking-wider">Course Registrations</span>
            <div className="text-3xl font-black text-[#5D0D1A]">{stats.totalEnrollments}</div>
            <p className="text-[11px] text-[#4A5D57] font-medium">Total course enrollments</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shrink-0">
            <GraduationCap size={24} />
          </div>
        </div>

        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase text-[#5A6C66] tracking-wider">Active Courses</span>
            <div className="text-3xl font-black text-[#5D0D1A]">{stats.courseBreakdown?.length || 0}</div>
            <p className="text-[11px] text-[#4A5D57] font-medium">Courses with enrollments</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-[22px] p-5 md:p-6 border border-[#9FB2AC] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5D57]" />
            <input
              type="text"
              placeholder="Search student, college, degree, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#FFF9EB]/50 border border-[#9FB2AC] rounded-xl text-xs font-semibold text-[#2D060D] focus:outline-none focus:border-[#5D0D1A] focus:ring-1 focus:ring-[#5D0D1A]"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[#5D0D1A] shrink-0" />
              <span className="text-xs font-bold text-[#5D0D1A]">Course:</span>
            </div>

            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl text-xs font-bold text-[#5D0D1A] focus:outline-none focus:border-[#5D0D1A]"
            >
              <option value="All">All Enrolled Courses</option>
              {stats.courseBreakdown?.map((cb) => (
                <option key={cb.courseId} value={cb.courseId}>
                  {cb.courseTitle} ({cb.count})
                </option>
              ))}
            </select>

            <select
              value={selectedProgressFilter}
              onChange={(e) => setSelectedProgressFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl text-xs font-bold text-[#5D0D1A] focus:outline-none focus:border-[#5D0D1A]"
            >
              <option value="All">All Completion Status</option>
              <option value="completed">Completed (&ge;80%)</option>
              <option value="in_progress">In Progress (1-79%)</option>
              <option value="not_started">Not Started (0%)</option>
            </select>

            <button
              onClick={fetchEnrollments}
              title="Refresh enrollments"
              className="p-2.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#5D0D1A] hover:text-[#FFF9EB] transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Enrolled Students Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-[#9FB2AC]/20 rounded-[22px] border border-[#9FB2AC]/30" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-[22px] p-8 text-center border border-[#9FB2AC] shadow-xs space-y-4 max-w-lg mx-auto">
          <AlertCircle size={32} className="mx-auto text-red-500" />
          <h3 className="text-lg font-bold text-[#5D0D1A]">Failed to Load Enrollments</h3>
          <p className="text-xs text-[#4A5D57] font-medium">{error}</p>
          <button
            onClick={fetchEnrollments}
            className="px-5 py-2 bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold rounded-xl shadow-xs"
          >
            Retry
          </button>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="bg-white rounded-[22px] p-12 text-center border border-[#9FB2AC] shadow-xs space-y-3">
          <GraduationCap size={44} className="mx-auto text-[#4A5D57]/60" />
          <h3 className="text-lg font-bold text-[#5D0D1A]">No Enrolled Students Found</h3>
          <p className="text-xs text-[#4A5D57] max-w-md mx-auto leading-relaxed font-medium">
            {enrollments.length === 0
              ? "None of your published courses have student enrollments yet. When students click 'Enroll & Start Learning', their profile, college details, and learning progress will appear here in real-time!"
              : "No enrolled students match your search or filter criteria. Try clearing filters to see all enrolled students."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enr) => {
            const s = enr.student;
            const c = enr.course;
            const progress = enr.progressStats || { percentage: 0, completedItemsCount: 0, totalTrackedItems: 0 };

            return (
              <div
                key={enr._id}
                className="bg-white rounded-[24px] border border-[#9FB2AC] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 p-6 space-y-5"
              >
                {/* Student Identity Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {s.profilePhoto ? (
                      <img
                        src={s.profilePhoto}
                        alt={s.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-[#5D0D1A] shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                        {s.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="text-base font-extrabold text-[#5D0D1A] truncate">{s.name}</h3>
                      <p className="text-xs font-semibold text-[#4A5D57] truncate">{s.email}</p>
                      {s.targetCareer && (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#FFF9EB] text-[#5D0D1A] text-[10px] font-black border border-[#9FB2AC]/70 truncate max-w-full">
                          Target: {s.targetCareer}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Enrolled Badge */}
                <div className="p-3 bg-[#FFF9EB]/60 rounded-xl border border-[#9FB2AC]/60 space-y-1">
                  <div className="text-[10px] font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center justify-between">
                    <span>Enrolled Course</span>
                    <span className="text-[9px] font-bold text-[#4A5D57]">{c.category}</span>
                  </div>
                  <div className="text-xs font-black text-[#2D060D] line-clamp-1">{c.title}</div>
                </div>

                {/* Academic & College Background */}
                <div className="space-y-2 text-xs text-[#4A5D57] font-medium border-t border-[#9FB2AC]/30 pt-3">
                  <div className="flex items-center gap-2 truncate">
                    <Building size={14} className="text-[#5D0D1A] shrink-0" />
                    <span className="truncate">{s.college || 'College details not specified'}</span>
                  </div>
                  {(s.degree || s.specialization) && (
                    <div className="flex items-center gap-2 truncate text-[11px] font-semibold text-[#2D060D]">
                      <GraduationCap size={14} className="text-[#5D0D1A] shrink-0" />
                      <span className="truncate">
                        {s.degree} {s.specialization ? `(${s.specialization})` : ''} {s.graduationYear ? `'${s.graduationYear.slice(-2)}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Enrolled Date Footer */}
                <div className="border-t border-[#9FB2AC]/30 pt-3 flex items-center justify-between text-[11px] font-semibold text-[#4A5D57]">
                  <span>Enrolled Date</span>
                  <span className="text-[#2D060D] font-bold">{new Date(enr.enrolledAt).toLocaleDateString()}</span>
                </div>


              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
