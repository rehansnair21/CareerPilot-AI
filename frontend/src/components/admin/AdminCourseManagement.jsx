import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  Eye,
  Trash2,
  BookOpen,
  HelpCircle,
  FileCheck,
  RefreshCw,
  X,
  Download,
  Users,
  ExternalLink,
  Ban,
  Check,
  UserCheck,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export const AdminCourseManagement = () => {
  // Main Sub-Tab State
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all', 'published', 'draft', 'deactivated', 'resources', 'quizzes_assignments'

  // Data States
  const [courses, setCourses] = useState([]);
  const [resources, setResources] = useState([]);
  const [quizzesAssignments, setQuizzesAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [quizAssignmentTypeFilter, setQuizAssignmentTypeFilter] = useState('all');

  // Modal States
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState('overview'); // 'overview', 'students', 'curriculum', 'resources', 'quizzes'
  const [studentSearch, setStudentSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Review Quiz/Assignment Details Modal State
  const [previewItem, setPreviewItem] = useState(null);

  // Fetch Courses Data
  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/admin/courses');
      if (res.data && res.data.success) {
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error('Error fetching admin courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses');
    }
  }, []);

  // Fetch Resources Data
  const fetchResources = useCallback(async () => {
    try {
      const res = await api.get('/admin/resources');
      if (res.data && res.data.success) {
        setResources(res.data.resources || []);
      }
    } catch (err) {
      console.error('Error fetching admin course resources:', err);
    }
  }, []);

  // Fetch Quizzes & Assignments Data
  const fetchQuizzesAssignments = useCallback(async () => {
    try {
      const res = await api.get('/admin/quizzes-assignments');
      if (res.data && res.data.success) {
        setQuizzesAssignments(res.data.items || []);
      }
    } catch (err) {
      console.error('Error fetching admin quizzes & assignments:', err);
    }
  }, []);

  // Initial Fetch
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchCourses(), fetchResources(), fetchQuizzesAssignments()]);
    setLoading(false);
  }, [fetchCourses, fetchResources, fetchQuizzesAssignments]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Fetch Single Course Details for Modal View
  const handleOpenCourseDetails = async (courseId, defaultTab = 'overview') => {
    setSelectedCourseId(courseId);
    setLoadingDetails(true);
    setCourseDetails(null);
    setModalActiveTab(defaultTab);
    setStudentSearch('');
    try {
      const res = await api.get(`/admin/courses/${courseId}`);
      if (res.data && res.data.success) {
        setCourseDetails(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
      alert('Failed to load complete course details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle Course Active / Deactivated Status
  const handleToggleCourseStatus = async (courseId, targetStatus) => {
    const actionText = targetStatus === 'deactivated' ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionText} this course?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/courses/${courseId}/status`, {
        status: targetStatus,
      });

      if (res.data && res.data.success) {
        const msg = `Course successfully ${targetStatus === 'deactivated' ? 'deactivated' : 'activated'}.`;
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 4500);

        // Update local list
        setCourses((prev) =>
          prev.map((c) => (c._id === courseId ? { ...c, status: targetStatus } : c))
        );

        if (courseDetails && courseDetails.course._id === courseId) {
          setCourseDetails((prev) => ({
            ...prev,
            course: { ...prev.course, status: targetStatus },
          }));
        }
      }
    } catch (err) {
      console.error('Error updating course status:', err);
      alert(err.response?.data?.message || 'Failed to update course status');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Resource Action
  const handleDeleteResource = async (resource) => {
    if (
      !window.confirm(
        `Are you sure you want to remove resource "${resource.title}" from this course?`
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/admin/resources/${resource.sourceCollection}/${resource._id}`);
      if (res.data && res.data.success) {
        setSuccessMsg('Resource removed successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        setResources((prev) => prev.filter((r) => r._id !== resource._id));
      }
    } catch (err) {
      console.error('Error removing resource:', err);
      alert(err.response?.data?.message || 'Failed to delete course resource');
    }
  };

  // Delete Quiz or Assignment Action
  const handleDeleteQuizOrAssignment = async (item) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${item.itemType} "${item.title}"?`
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(
        `/admin/quizzes-assignments/${item.itemType}/${item._id}`
      );
      if (res.data && res.data.success) {
        setSuccessMsg(`${item.itemType === 'quiz' ? 'Quiz' : 'Assignment'} deleted successfully.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setQuizzesAssignments((prev) => prev.filter((i) => i._id !== item._id));
      }
    } catch (err) {
      console.error('Error deleting quiz/assignment:', error);
      alert(err.response?.data?.message || 'Failed to delete item');
    }
  };

  // Derived Filtered Lists
  const publishedCoursesList = courses.filter((c) => c.status === 'published');
  const draftCoursesList = courses.filter((c) => c.status === 'draft');
  const deactivatedCoursesList = courses.filter((c) => c.status === 'deactivated');

  const getFilteredCourses = () => {
    let list = courses;
    if (activeSubTab === 'published') list = publishedCoursesList;
    else if (activeSubTab === 'draft') list = draftCoursesList;
    else if (activeSubTab === 'deactivated') list = deactivatedCoursesList;

    return list.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.mentor?.fullName && c.mentor.fullName.toLowerCase().includes(q)) ||
        (c.mentor?.email && c.mentor.email.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'all' || c.difficulty === difficultyFilter;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  };

  const filteredCourses = getFilteredCourses();

  // Filtered Resources
  const filteredResources = resources.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.course?.title && r.course.title.toLowerCase().includes(q)) ||
      (r.mentor?.name && r.mentor.name.toLowerCase().includes(q));

    const matchesType =
      resourceTypeFilter === 'all' || r.resourceType === resourceTypeFilter;

    return matchesSearch && matchesType;
  });

  // Filtered Quizzes & Assignments
  const filteredQuizzesAssignments = quizzesAssignments.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.course?.title && item.course.title.toLowerCase().includes(q)) ||
      (item.mentor?.name && item.mentor.name.toLowerCase().includes(q));

    const matchesType =
      quizAssignmentTypeFilter === 'all' || item.itemType === quizAssignmentTypeFilter;

    return matchesSearch && matchesType;
  });

  // Unique Categories
  const categoriesList = Array.from(new Set(courses.map((c) => c.category || 'Software Development')));

  // Filtered Enrolled Students for Modal
  const getFilteredModalStudents = () => {
    if (!courseDetails?.enrolledStudents) return [];
    const q = studentSearch.toLowerCase().trim();
    if (!q) return courseDetails.enrolledStudents;
    return courseDetails.enrolledStudents.filter(
      (s) =>
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#2D060D] p-6 text-[#FFF9EB] shadow-lg border border-[#9FB2AC]/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/10 text-[10px] font-extrabold uppercase tracking-wider text-amber-200 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Admin Management Hub</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center shadow-md shrink-0">
                <GraduationCap size={20} />
              </div>
              Course Management Console
            </h1>

            <p className="text-xs text-[#FFF9EB]/80 font-medium max-w-xl">
              Overview of mentor-published courses, enrolled student details, draft content, system resources, and access controls.
            </p>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFF9EB] text-xs font-extrabold border border-white/20 transition-all shadow-sm shrink-0 self-start md:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Courses */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-[20px] p-4.5 border border-[#9FB2AC] shadow-2xs flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <BookOpen size={18} />
            </div>
            <span className="text-[10px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] px-2.5 py-0.5 rounded-full border border-[#9FB2AC] whitespace-nowrap">
              All Courses
            </span>
          </div>

          <div>
            <p className="text-[10.5px] font-bold text-[#5A6C66] uppercase tracking-wider">Total Courses</p>
            <h3 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight mt-0.5">{courses.length}</h3>
          </div>
        </motion.div>

        {/* Card 2: Published Courses */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-[20px] p-4.5 border border-emerald-200 shadow-2xs flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 size={18} />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Online
            </span>
          </div>

          <div>
            <p className="text-[10.5px] font-bold text-[#5A6C66] uppercase tracking-wider">Published</p>
            <h3 className="text-xl font-extrabold text-emerald-700 tracking-tight mt-0.5">
              {publishedCoursesList.length}
            </h3>
          </div>
        </motion.div>

        {/* Card 3: Mentor Drafts */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-[20px] p-4.5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-300">
              <FileText size={18} />
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300 whitespace-nowrap">
              Draft Mode
            </span>
          </div>

          <div>
            <p className="text-[10.5px] font-bold text-[#5A6C66] uppercase tracking-wider">Mentor Drafts</p>
            <h3 className="text-xl font-extrabold text-slate-700 tracking-tight mt-0.5">
              {draftCoursesList.length}
            </h3>
          </div>
        </motion.div>

        {/* Card 4: Deactivated Courses */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-[20px] p-4.5 border border-rose-200 shadow-2xs flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <Ban size={18} />
            </div>
            <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 whitespace-nowrap">
              Disabled
            </span>
          </div>

          <div>
            <p className="text-[10.5px] font-bold text-[#5A6C66] uppercase tracking-wider">Deactivated</p>
            <h3 className="text-xl font-extrabold text-rose-700 tracking-tight mt-0.5">
              {deactivatedCoursesList.length}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="bg-white rounded-[20px] p-1.5 border border-[#9FB2AC] shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'all', label: 'All Courses', count: courses.length },
            { id: 'published', label: 'Published Courses', count: publishedCoursesList.length },
            { id: 'draft', label: 'Draft Courses', count: draftCoursesList.length },
            { id: 'deactivated', label: 'Deactivated Courses', count: deactivatedCoursesList.length },
            { id: 'resources', label: 'Manage Resources', count: resources.length },
            { id: 'quizzes_assignments', label: 'Quizzes & Assignments', count: quizzesAssignments.length },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-2xs'
                    : 'bg-transparent text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl p-3.5 text-xs font-bold flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN VIEW 1: COURSES */}
      {['all', 'published', 'draft', 'deactivated'].includes(activeSubTab) && (
        <div className="space-y-4">
          {/* Search & Filtering Bar */}
          <div className="bg-white rounded-[20px] p-4 border border-[#9FB2AC] shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Bar Input */}
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
                <input
                  type="text"
                  placeholder="Search by course title, mentor name, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-9 pr-8 py-2 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6C66] hover:text-[#5D0D1A]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full md:w-auto bg-[#FFF9EB] border border-[#9FB2AC] text-[#5D0D1A] text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/20 cursor-pointer whitespace-nowrap"
                >
                  <option value="all">All Categories</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full md:w-auto bg-[#FFF9EB] border border-[#9FB2AC] text-[#5D0D1A] text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/20 cursor-pointer whitespace-nowrap"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>
          </div>

          {/* Courses List Table */}
          <div className="bg-white rounded-[20px] border border-[#9FB2AC] shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-extrabold text-[#5D0D1A]">Loading course records...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
                  <AlertCircle size={22} />
                </div>
                <h4 className="text-xs font-extrabold text-[#5D0D1A]">No courses found</h4>
                <p className="text-xs text-[#5A6C66] max-w-sm mx-auto">
                  No courses match your active tab or search filter options.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold uppercase tracking-wider text-[10.5px] whitespace-nowrap">
                      <th className="py-3.5 px-4 min-w-[240px]">Course Title & Category</th>
                      <th className="py-3.5 px-4 min-w-[170px]">Mentor Author</th>
                      <th className="py-3.5 px-4 min-w-[110px]">Difficulty</th>
                      <th className="py-3.5 px-4 min-w-[120px]">Status</th>
                      <th className="py-3.5 px-4 min-w-[170px]">Enrolled Students</th>
                      <th className="py-3.5 px-4 min-w-[110px]">Last Updated</th>
                      <th className="py-3.5 px-4 text-center min-w-[170px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#9FB2AC]/60">
                    {filteredCourses.map((c) => (
                      <tr key={c._id} className="hover:bg-[#FFF9EB]/60 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden border border-[#9FB2AC]/40">
                              {c.thumbnail ? (
                                <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                              ) : (
                                <BookOpen size={18} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-[#5D0D1A] group-hover:text-[#7A1424] transition-colors truncate text-xs">
                                {c.title}
                              </p>
                              <p className="text-[10px] text-[#5A6C66] font-semibold truncate">
                                {c.category || 'Software Development'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div>
                            <p className="font-extrabold text-[#2D060D] text-xs truncate">
                              {c.mentor?.fullName || c.mentor?.name || 'Mentor'}
                            </p>
                            <p className="text-[10px] text-[#5A6C66] truncate">{c.mentor?.email || 'N/A'}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block whitespace-nowrap bg-[#FFF9EB] text-[#5D0D1A] px-2.5 py-1 rounded-md border border-[#9FB2AC] text-[10.5px] font-extrabold">
                            {c.difficulty || 'All Levels'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {c.status === 'published' && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 uppercase tracking-wider whitespace-nowrap">
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                              Published
                            </span>
                          )}
                          {c.status === 'draft' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-300 uppercase tracking-wider whitespace-nowrap">
                              <FileText size={12} />
                              Draft
                            </span>
                          )}
                          {c.status === 'deactivated' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 uppercase tracking-wider whitespace-nowrap">
                              <Ban size={12} />
                              Deactivated
                            </span>
                          )}
                        </td>

                        {/* Enrolled Students Column with Clickable Student List Modal Trigger */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenCourseDetails(c._id, 'students')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF9EB] hover:bg-[#F7EED8] border border-[#9FB2AC] text-[#5D0D1A] font-extrabold transition-all group/btn"
                            title="Click to view enrolled student names"
                          >
                            <Users size={13} className="text-[#5A6C66] group-hover/btn:text-[#5D0D1A]" />
                            <span>{c.studentsEnrolled || 0} Enrolled</span>
                            <Eye size={11} className="text-[#5A6C66] group-hover/btn:text-[#5D0D1A] opacity-70" />
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-[#5A6C66] text-[11px] whitespace-nowrap">
                          {c.updatedAt
                            ? new Date(c.updatedAt).toLocaleDateString()
                            : c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* View Details Action */}
                            <button
                              onClick={() => handleOpenCourseDetails(c._id, 'overview')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold transition-all shadow-2xs shrink-0"
                            >
                              <Eye size={13} />
                              <span>View Details</span>
                            </button>

                            {/* Deactivate Button for Published courses */}
                            {c.status === 'published' && (
                              <button
                                onClick={() => handleToggleCourseStatus(c._id, 'deactivated')}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-extrabold border border-rose-200 transition-colors shrink-0"
                                title="Deactivate Course"
                              >
                                <Ban size={12} />
                                <span>Deactivate</span>
                              </button>
                            )}

                            {/* Activate Button for Deactivated courses */}
                            {c.status === 'deactivated' && (
                              <button
                                onClick={() => handleToggleCourseStatus(c._id, 'published')}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-extrabold border border-emerald-200 transition-colors shrink-0"
                                title="Activate Course"
                              >
                                <Check size={12} />
                                <span>Activate</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN VIEW 2: MANAGE COURSE RESOURCES */}
      {activeSubTab === 'resources' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[20px] p-4 border border-[#9FB2AC] shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
                <input
                  type="text"
                  placeholder="Search resources by title, course name, mentor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-9 pr-4 py-2 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] font-medium"
                />
              </div>

              <select
                value={resourceTypeFilter}
                onChange={(e) => setResourceTypeFilter(e.target.value)}
                className="bg-[#FFF9EB] border border-[#9FB2AC] text-[#5D0D1A] text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/20 w-full md:w-auto whitespace-nowrap cursor-pointer"
              >
                <option value="all">All Resource Types</option>
                <option value="pdf">PDF Documents</option>
                <option value="article">Articles</option>
                <option value="documentation">Documentation Links</option>
                <option value="practice_website">Practice Websites</option>
                <option value="note">Notes & Cheat Sheets</option>
                <option value="reference_link">Reference Links</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#9FB2AC] shadow-2xs overflow-hidden">
            {filteredResources.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
                  <FileText size={22} />
                </div>
                <h4 className="text-xs font-extrabold text-[#5D0D1A]">No course resources found</h4>
                <p className="text-xs text-[#5A6C66] max-w-sm mx-auto">
                  No resources match your current search or type filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold uppercase tracking-wider text-[10.5px] whitespace-nowrap">
                      <th className="py-3.5 px-4 min-w-[200px]">Resource Title</th>
                      <th className="py-3.5 px-4 min-w-[120px]">Type</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Associated Course & Module</th>
                      <th className="py-3.5 px-4 min-w-[150px]">Mentor Author</th>
                      <th className="py-3.5 px-4 min-w-[180px]">Attachment Details</th>
                      <th className="py-3.5 px-4 text-center min-w-[90px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#9FB2AC]/60">
                    {filteredResources.map((r) => (
                      <tr key={r._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] max-w-xs truncate">
                          {r.title}
                          {r.description && (
                            <p className="text-[10px] text-[#5A6C66] font-normal truncate">
                              {r.description}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block bg-[#FFF9EB] text-[#5D0D1A] px-2.5 py-1 rounded-md border border-[#9FB2AC] text-[10.5px] font-extrabold capitalize whitespace-nowrap">
                            {r.resourceType.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-[#2D060D] truncate">{r.course?.title || 'Course'}</p>
                          <p className="text-[10px] text-[#5A6C66] truncate">{r.module?.title || 'General Module'}</p>
                        </td>

                        <td className="py-3.5 px-4 text-[#5A6C66] whitespace-nowrap">
                          {r.mentor?.name || 'Mentor'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {r.filePath ? (
                            <span className="text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1">
                              <Download size={13} /> PDF ({Math.round((r.fileSize || 0) / 1024)} KB)
                            </span>
                          ) : r.url ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 truncate max-w-xs"
                            >
                              <ExternalLink size={13} /> {r.url}
                            </a>
                          ) : (
                            <span className="text-[#5A6C66] italic">Text Resource</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteResource(r)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                            title="Remove Resource"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN VIEW 3: MANAGE QUIZZES & ASSIGNMENTS */}
      {activeSubTab === 'quizzes_assignments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[20px] p-4 border border-[#9FB2AC] shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
                <input
                  type="text"
                  placeholder="Search quizzes & assignments by title, course, mentor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-9 pr-4 py-2 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] font-medium"
                />
              </div>

              <select
                value={quizAssignmentTypeFilter}
                onChange={(e) => setQuizAssignmentTypeFilter(e.target.value)}
                className="bg-[#FFF9EB] border border-[#9FB2AC] text-[#5D0D1A] text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/20 w-full md:w-auto whitespace-nowrap cursor-pointer"
              >
                <option value="all">All Evaluation Items</option>
                <option value="quiz">Quizzes Only</option>
                <option value="assignment">Assignments Only</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#9FB2AC] shadow-2xs overflow-hidden">
            {filteredQuizzesAssignments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
                  <HelpCircle size={22} />
                </div>
                <h4 className="text-xs font-extrabold text-[#5D0D1A]">No quizzes or assignments found</h4>
                <p className="text-xs text-[#5A6C66] max-w-sm mx-auto">
                  No items match your search or filter options.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold uppercase tracking-wider text-[10.5px] whitespace-nowrap">
                      <th className="py-3.5 px-4 min-w-[200px]">Title & Description</th>
                      <th className="py-3.5 px-4 min-w-[110px]">Type</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Course & Module</th>
                      <th className="py-3.5 px-4 min-w-[150px]">Mentor Author</th>
                      <th className="py-3.5 px-4 min-w-[160px]">Questions / Specs</th>
                      <th className="py-3.5 px-4 text-center min-w-[160px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#9FB2AC]/60">
                    {filteredQuizzesAssignments.map((item) => (
                      <tr key={item._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] max-w-xs">
                          {item.title}
                          {item.description && (
                            <p className="text-[10px] text-[#5A6C66] font-normal truncate">
                              {item.description}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              item.itemType === 'quiz'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.itemType === 'quiz' ? <HelpCircle size={12} /> : <FileCheck size={12} />}
                            {item.itemType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-[#2D060D] truncate">{item.course?.title || 'Course'}</p>
                          <p className="text-[10px] text-[#5A6C66] truncate">{item.module?.title || 'Module'}</p>
                        </td>

                        <td className="py-3.5 px-4 text-[#5A6C66] whitespace-nowrap">
                          {item.mentor?.name || 'Mentor'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.itemType === 'quiz' ? (
                            <span className="text-[#5D0D1A] font-extrabold">
                              {item.questionsCount || 0} Questions ({item.totalMarks || 0} Marks)
                            </span>
                          ) : (
                            <span className="text-[#5A6C66] font-semibold">
                              Assignment Prompt ({item.content ? `${item.content.length} chars` : 'Link'})
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewItem(item)}
                              className="px-3 py-1.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold transition-all shadow-2xs"
                            >
                              Inspect Content
                            </button>

                            <button
                              onClick={() => handleDeleteQuizOrAssignment(item)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                              title="Delete Item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL COURSE DETAILS & INSPECTION MODAL */}
      <AnimatePresence>
        {selectedCourseId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D060D]/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[#9FB2AC] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Top Header */}
              <div className="p-5 bg-gradient-to-r from-[#FFF9EB] via-[#F7EED8] to-[#FFF9EB] border-b border-[#9FB2AC] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold flex items-center justify-center overflow-hidden shadow-md shrink-0">
                    {courseDetails?.course?.thumbnail ? (
                      <img
                        src={courseDetails.course.thumbnail}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <GraduationCap size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#5D0D1A] tracking-tight">
                      {courseDetails?.course?.title || 'Loading Course Details...'}
                    </h3>
                    <p className="text-xs text-[#5A6C66] font-medium flex items-center gap-2 mt-0.5 whitespace-nowrap">
                      <span>Mentor: <strong>{courseDetails?.course?.mentor?.fullName || 'Mentor'}</strong></span>
                      <span>•</span>
                      <span>Category: <strong>{courseDetails?.course?.category || 'Software'}</strong></span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCourseId(null)}
                  className="p-2 text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-white rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDetails ? (
                <div className="p-16 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-extrabold text-[#5D0D1A]">Fetching course details...</p>
                </div>
              ) : courseDetails ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Modal Sub-Tabs */}
                  <div className="flex items-center gap-2 border-b border-[#9FB2AC]/60 pb-3 overflow-x-auto scrollbar-none">
                    {[
                      { id: 'overview', label: 'Overview & Specs' },
                      { id: 'students', label: `Enrolled Students (${courseDetails.enrolledStudents?.length || courseDetails.course?.studentsEnrolled || 0})` },
                      { id: 'curriculum', label: `Curriculum (${courseDetails.modules?.length || 0} Modules)` },
                      { id: 'resources', label: `Resources (${(courseDetails.pdfResources?.length || 0) + (courseDetails.textResources?.length || 0)})` },
                      { id: 'quizzes', label: `Quizzes (${courseDetails.quizzes?.length || 0})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setModalActiveTab(tab.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border whitespace-nowrap ${
                          modalActiveTab === tab.id
                            ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-2xs'
                            : 'bg-[#FFF9EB] text-[#5A6C66] border-[#9FB2AC] hover:text-[#5D0D1A]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab 1: Overview */}
                  {modalActiveTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC]">
                          <p className="text-[10px] font-extrabold text-[#5A6C66] uppercase">Difficulty</p>
                          <p className="text-xs font-extrabold text-[#5D0D1A] mt-0.5 whitespace-nowrap">{courseDetails.course.difficulty}</p>
                        </div>
                        <div className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC]">
                          <p className="text-[10px] font-extrabold text-[#5A6C66] uppercase">Duration</p>
                          <p className="text-xs font-extrabold text-[#5D0D1A] mt-0.5 whitespace-nowrap">{courseDetails.course.duration}</p>
                        </div>
                        <div className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC]">
                          <p className="text-[10px] font-extrabold text-[#5A6C66] uppercase">Price Model</p>
                          <p className="text-xs font-extrabold text-[#5D0D1A] mt-0.5 whitespace-nowrap">
                            {courseDetails.course.priceType === 'Paid' ? `₹${courseDetails.course.price}` : 'Free'}
                          </p>
                        </div>
                        <div className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC]">
                          <p className="text-[10px] font-extrabold text-[#5A6C66] uppercase">Students Enrolled</p>
                          <p className="text-xs font-extrabold text-[#5D0D1A] mt-0.5 whitespace-nowrap">{courseDetails.course.studentsEnrolled || 0}</p>
                        </div>
                      </div>

                      <div className="bg-white p-4.5 rounded-2xl border border-[#9FB2AC] space-y-2">
                        <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider">Detailed Description</h4>
                        <p className="text-xs text-[#2D060D] leading-relaxed whitespace-pre-line">
                          {courseDetails.course.detailedDescription || courseDetails.course.shortDescription || courseDetails.course.description || 'No detailed description provided.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4.5 rounded-2xl border border-[#9FB2AC] space-y-2">
                          <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider">Skills Covered</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {courseDetails.course.skills?.length > 0 ? (
                              courseDetails.course.skills.map((s, idx) => (
                                <span key={idx} className="inline-block whitespace-nowrap bg-[#FFF9EB] text-[#5D0D1A] px-2.5 py-1 rounded-md text-[10.5px] font-bold border border-[#9FB2AC]">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[#5A6C66] italic">None specified</span>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-4.5 rounded-2xl border border-[#9FB2AC] space-y-2">
                          <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider">Prerequisites</h4>
                          <ul className="list-disc list-inside text-xs text-[#5A6C66] space-y-1">
                            {courseDetails.course.prerequisites?.length > 0 ? (
                              courseDetails.course.prerequisites.map((p, idx) => <li key={idx}>{p}</li>)
                            ) : (
                              <li className="italic">None specified</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Enrolled Students List */}
                  {modalActiveTab === 'students' && (
                    <div className="space-y-4">
                      {/* Search Student Filter */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-sm">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
                          <input
                            type="text"
                            placeholder="Filter enrolled students by name or email..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none font-medium"
                          />
                        </div>

                        <span className="text-xs font-extrabold text-[#5D0D1A] bg-[#FFF9EB] px-3 py-1 rounded-xl border border-[#9FB2AC]">
                          Total Enrolled: {courseDetails.enrolledStudents?.length || 0}
                        </span>
                      </div>

                      {getFilteredModalStudents().length === 0 ? (
                        <div className="p-10 text-center space-y-2 bg-[#FFF9EB]/40 rounded-2xl border border-[#9FB2AC]/40">
                          <User size={24} className="mx-auto text-[#5A6C66]" />
                          <p className="text-xs font-extrabold text-[#5D0D1A]">No students found</p>
                          <p className="text-[11px] text-[#5A6C66]">No student accounts match the search or have enrolled in this course yet.</p>
                        </div>
                      ) : (
                        <div className="border border-[#9FB2AC] rounded-2xl overflow-hidden bg-white">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                <th className="py-3 px-4">Student Name</th>
                                <th className="py-3 px-4">Email Address</th>
                                <th className="py-3 px-4">Enrolled Date</th>
                                <th className="py-3 px-4 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#9FB2AC]/50">
                              {getFilteredModalStudents().map((s) => (
                                <tr key={s._id} className="hover:bg-[#FFF9EB]/50 transition-colors">
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {(s.fullName || 'S').substring(0, 2).toUpperCase()}
                                      </div>
                                      <span className="font-extrabold text-[#5D0D1A]">{s.fullName}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-[#5A6C66] whitespace-nowrap font-medium">{s.email}</td>
                                  <td className="py-3 px-4 text-[#5A6C66] whitespace-nowrap">
                                    {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : 'Recently'}
                                  </td>
                                  <td className="py-3 px-4 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                                      <UserCheck size={11} /> {s.status || 'Active'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Curriculum */}
                  {modalActiveTab === 'curriculum' && (
                    <div className="space-y-4">
                      {courseDetails.modules?.length === 0 ? (
                        <p className="text-xs text-[#5A6C66] italic text-center py-6">No modules created yet for this course.</p>
                      ) : (
                        courseDetails.modules.map((mod, idx) => {
                          const moduleLessons = courseDetails.lessons?.filter(
                            (l) => l.moduleId?.toString() === mod._id?.toString()
                          );

                          return (
                            <div key={mod._id} className="bg-white p-4.5 rounded-2xl border border-[#9FB2AC] space-y-3">
                              <div className="flex items-center justify-between border-b border-[#9FB2AC]/40 pb-2">
                                <h4 className="text-xs font-extrabold text-[#5D0D1A]">
                                  Module {idx + 1}: {mod.title}
                                </h4>
                                <span className="text-[10px] font-extrabold text-[#5A6C66] bg-[#FFF9EB] px-2.5 py-0.5 rounded-md border border-[#9FB2AC] whitespace-nowrap">
                                  {moduleLessons.length} Lessons
                                </span>
                              </div>
                              {mod.description && <p className="text-xs text-[#5A6C66]">{mod.description}</p>}

                              <div className="space-y-2 pl-3 border-l-2 border-[#5D0D1A]/20">
                                {moduleLessons.map((l, lIdx) => (
                                  <div key={l._id} className="bg-[#FFF9EB]/60 p-3 rounded-xl border border-[#9FB2AC]/60 text-xs space-y-1">
                                    <div className="flex items-center justify-between font-extrabold text-[#5D0D1A]">
                                      <span>Lesson {lIdx + 1}: {l.title}</span>
                                      <span className="text-[10px] text-[#5A6C66] whitespace-nowrap">{l.duration || '10 min'}</span>
                                    </div>
                                    {l.content && (
                                      <p className="text-[11px] text-[#2D060D] line-clamp-3 bg-white p-2.5 rounded-lg border border-[#9FB2AC]/30 font-mono">
                                        {l.content}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Tab 4: Resources */}
                  {modalActiveTab === 'resources' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider">PDF & Text Resources</h4>
                      {courseDetails.pdfResources?.length === 0 && courseDetails.textResources?.length === 0 ? (
                        <p className="text-xs text-[#5A6C66] italic text-center py-6">No external resources attached to this course.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {courseDetails.pdfResources?.map((pdf) => (
                            <div key={pdf._id} className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC] space-y-1">
                              <span className="inline-block whitespace-nowrap text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase">
                                PDF Document
                              </span>
                              <p className="text-xs font-extrabold text-[#5D0D1A] truncate">{pdf.title}</p>
                              <p className="text-[10px] text-[#5A6C66] truncate">{pdf.originalName} ({Math.round((pdf.fileSize || 0) / 1024)} KB)</p>
                            </div>
                          ))}

                          {courseDetails.textResources?.map((txt) => (
                            <div key={txt._id} className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC] space-y-1">
                              <span className="inline-block whitespace-nowrap text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 uppercase">
                                {txt.type}
                              </span>
                              <p className="text-xs font-extrabold text-[#5D0D1A] truncate">{txt.title}</p>
                              {txt.url && (
                                <a href={txt.url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline truncate block">
                                  {txt.url}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 5: Quizzes */}
                  {modalActiveTab === 'quizzes' && (
                    <div className="space-y-4">
                      {courseDetails.quizzes?.length === 0 ? (
                        <p className="text-xs text-[#5A6C66] italic text-center py-6">No quizzes created for this course.</p>
                      ) : (
                        courseDetails.quizzes.map((quiz) => (
                          <div key={quiz._id} className="bg-white p-4.5 rounded-2xl border border-[#9FB2AC] space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-extrabold text-[#5D0D1A]">{quiz.title}</h4>
                              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 whitespace-nowrap">
                                {quiz.questions?.length || 0} Questions
                              </span>
                            </div>
                            <div className="space-y-2">
                              {quiz.questions?.map((q, qIdx) => (
                                <div key={q._id || qIdx} className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC]/60 text-xs space-y-1.5">
                                  <p className="font-extrabold text-[#5D0D1A]">
                                    Q{qIdx + 1}: {q.questionText} ({q.marks || 1} mark)
                                  </p>
                                  <div className="grid grid-cols-2 gap-1.5 pl-2">
                                    {q.options?.map((opt, optIdx) => (
                                      <div
                                        key={optIdx}
                                        className={`p-1.5 rounded-lg border text-[11px] font-semibold ${
                                          optIdx === q.correctOptionIndex
                                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold'
                                            : 'bg-white text-[#2D060D] border-[#9FB2AC]/40'
                                        }`}
                                      >
                                        {optIdx === q.correctOptionIndex ? '✓ ' : ''}{opt}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Modal Footer Actions */}
              <div className="p-4 bg-white border-t border-[#9FB2AC] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-xs font-bold text-[#5A6C66]">Current Status:</span>
                  <span className="inline-block whitespace-nowrap text-xs font-extrabold uppercase text-[#5D0D1A] bg-[#FFF9EB] px-2.5 py-1 rounded-md border border-[#9FB2AC]">
                    {courseDetails?.course?.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap">
                  {/* Deactivate Button for Published courses */}
                  {courseDetails?.course?.status === 'published' && (
                    <button
                      onClick={() => handleToggleCourseStatus(selectedCourseId, 'deactivated')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all shadow-2xs whitespace-nowrap"
                    >
                      <Ban size={14} />
                      <span>Deactivate Course</span>
                    </button>
                  )}

                  {/* Activate Button for Deactivated courses */}
                  {courseDetails?.course?.status === 'deactivated' && (
                    <button
                      onClick={() => handleToggleCourseStatus(selectedCourseId, 'published')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-2xs whitespace-nowrap"
                    >
                      <Check size={14} />
                      <span>Activate Course</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedCourseId(null)}
                    className="px-4 py-2 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] text-xs font-extrabold border border-[#9FB2AC] transition-all whitespace-nowrap"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUIZ / ASSIGNMENT CONTENT PREVIEW MODAL */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D060D]/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[22px] border border-[#9FB2AC] shadow-2xl p-5 w-full max-w-2xl max-h-[85vh] flex flex-col space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#9FB2AC]/60 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#5D0D1A]">{previewItem.title}</h3>
                  <p className="text-xs text-[#5A6C66] font-semibold">
                    {previewItem.itemType === 'quiz' ? 'Multiple Choice Quiz' : 'Course Assignment'} • Course: {previewItem.course?.title}
                  </p>
                </div>
                <button onClick={() => setPreviewItem(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {previewItem.itemType === 'quiz' ? (
                  previewItem.questions?.map((q, idx) => (
                    <div key={idx} className="bg-[#FFF9EB] p-4 rounded-xl border border-[#9FB2AC] space-y-2 text-xs">
                      <p className="font-extrabold text-[#5D0D1A]">
                        Question {idx + 1}: {q.questionText} ({q.marks || 1} mark)
                      </p>
                      <div className="space-y-1.5 pl-2">
                        {q.options?.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg border text-xs font-semibold ${
                              oIdx === q.correctOptionIndex
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold'
                                : 'bg-[#FFF9EB] text-[#2D060D] border-[#9FB2AC]/40'
                            }`}
                          >
                            {oIdx === q.correctOptionIndex ? '✓ Correct Option: ' : 'Option: '}{opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-[11px] text-[#5A6C66] italic bg-white p-2.5 rounded-lg border border-[#9FB2AC]/30">
                          Explanation: {q.explanation}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-[#FFF9EB] p-4 rounded-xl border border-[#9FB2AC] space-y-2 text-xs">
                    <h4 className="font-extrabold text-[#5D0D1A] uppercase tracking-wider">Assignment Content & Instructions</h4>
                    <p className="text-xs text-[#2D060D] whitespace-pre-line leading-relaxed">
                      {previewItem.content || previewItem.description || 'No detailed instructions provided.'}
                    </p>
                    {previewItem.url && (
                      <a href={previewItem.url} target="_blank" rel="noreferrer" className="text-blue-600 font-extrabold hover:underline block pt-2">
                        Assignment Resource Link: {previewItem.url}
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#9FB2AC]/60 flex justify-end">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-5 py-2 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCourseManagement;
