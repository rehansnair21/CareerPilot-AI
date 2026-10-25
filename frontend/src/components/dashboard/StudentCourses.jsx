import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StudentPDFViewerModal } from './StudentPDFViewerModal';
import { StudentQuizModal } from './StudentQuizModal';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Layers,
  FileText,
  User,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Award,
  CheckCircle2,
  Circle,
  AlertCircle,
  Eye,
  Loader2,
  Lock,
  Tag,
  Link as LinkIcon,
  ExternalLink,
  Send,
  Check,
  FileCheck,
  BookmarkCheck,
  PieChart,
  IndianRupee,
  CreditCard,
  Calendar,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StudentCourses = ({ initialOpenCourseId }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState(null);

  // Student Enrollments State (course_enrollments MongoDB Collection)
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);

  // Coursera-Style Active Learning Experience State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [progressStats, setProgressStats] = useState({
    totalTrackedItems: 0,
    completedItemsCount: 0,
    percentage: 0,
    totalLessonsCount: 0,
    completedLessonsCount: 0,
    lessonsSummary: '0 / 0',
    totalQuizzesCount: 0,
    completedQuizzesCount: 0,
    averageQuizScore: 0,
    quizScoreSummary: '0%',
    totalAssignmentsCount: 0,
    completedAssignmentsCount: 0,
    totalModulesCount: 0,
    completedModulesCount: 0,
    modulesSummary: '0 / 0',
    moduleStatsMap: {},
  });

  const [courseDetailsLoading, setCourseDetailsLoading] = useState(false);
  const [courseDetailsError, setCourseDetailsError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Active Item displayed in Main Reader Canvas
  const [activeItem, setActiveItem] = useState(null);

  // Assignment text submission form state
  const [assignmentForm, setAssignmentForm] = useState({ text: '', url: '', submitting: false, successMsg: '' });

  // Quiz Modal State
  const [activeQuizState, setActiveQuizState] = useState({
    isOpen: false,
    quiz: null,
    moduleTitle: '',
    courseId: '',
  });

  // In-App PDF Viewer Modal State
  const [pdfViewerState, setPdfViewerState] = useState({
    isOpen: false,
    pdfResource: null,
    courseTitle: '',
    moduleTitle: '',
    lessonTitle: '',
    courseId: '',
  });

  const categories = ['All', 'Development', 'Design', 'Data Science', 'Product', 'Marketing', 'Business', 'AI & ML'];

  // 1. Fetch all published courses for catalog
  const fetchPublishedCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/student/courses');
      if (res.data && res.data.success) {
        setCourses(res.data.data);
      } else {
        setError(res.data?.message || 'Unable to load published courses.');
      }
    } catch (err) {
      console.error('Error fetching published courses:', err);
      setError(err.response?.data?.message || 'Failed to connect to course server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch student active course enrollments (mapped to course_enrollments MongoDB collection)
  const fetchStudentEnrollments = useCallback(async () => {
    try {
      const res = await api.get('/student/enrollments');
      if (res.data && res.data.success) {
        const enrollmentsData = res.data.data || [];
        setStudentEnrollments(enrollmentsData);
        const ids = new Set(enrollmentsData.map((e) => e.courseId?._id || e.courseId));
        setEnrolledCourseIds(ids);
      }
    } catch (err) {
      console.error('Error fetching student enrollments:', err);
    }
  }, []);

  useEffect(() => {
    fetchPublishedCourses();
    fetchStudentEnrollments();
  }, [fetchPublishedCourses, fetchStudentEnrollments]);

  useEffect(() => {
    if (initialOpenCourseId) {
      handleOpenCourse(initialOpenCourseId);
    }
  }, [initialOpenCourseId]);

  // Helper to dynamically load Razorpay Checkout script if window.Razorpay is undefined
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 3. Enroll authenticated student in course (Paid via Razorpay / Free direct) & open learning workspace
  const handleEnrollAndOpenCourse = async (targetCourse) => {
    const courseId = typeof targetCourse === 'object' ? targetCourse._id : targetCourse;
    const courseObj = typeof targetCourse === 'object'
      ? targetCourse
      : courses.find((c) => c._id === courseId);

    // Step 1: Check whether the student is already enrolled
    if (enrolledCourseIds.has(courseId)) {
      handleOpenCourse(courseId);
      return;
    }

    setEnrollingCourseId(courseId);
    setPaymentStatusMessage(null);

    const isPaid = courseObj?.isPaid || courseObj?.priceType === 'Paid' || (courseObj?.price || 0) > 0;

    if (isPaid && (courseObj?.price || 0) > 0) {
      // PAID COURSE -> Razorpay Payment Flow
      try {
        // Step 3: Create Razorpay Order from backend
        const orderRes = await api.post(`/student/courses/${courseId}/create-order`);
        
        if (!orderRes.data || !orderRes.data.success) {
          if (orderRes.data?.alreadyEnrolled) {
            setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
            handleOpenCourse(courseId);
            return;
          }
          setPaymentStatusMessage({ type: 'error', text: orderRes.data?.message || 'Failed to create payment order.' });
          setEnrollingCourseId(null);
          return;
        }

        if (orderRes.data.isFree) {
          await handleFreeEnrollment(courseId);
          return;
        }

        const { orderId, amount, currency, keyId, courseTitle } = orderRes.data;

        // Step 4: Open Razorpay Checkout on frontend
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert('Failed to load Razorpay SDK. Please check your network connection.');
          setEnrollingCourseId(null);
          return;
        }

        const razorpayKey = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_enBJVcajFSH1Ci';

        const options = {
          key: razorpayKey,
          amount: amount,
          currency: currency || 'INR',
          name: 'CareerPilot AI',
          description: courseTitle || courseObj?.title || 'Paid Course Enrollment',
          order_id: orderId,
          // Step 5 & 6: Student completes payment window
          handler: async function (response) {
            try {
              // Step 7: After payment, send Razorpay payment details to backend
              // Step 8: Verify Razorpay payment signature on backend using RAZORPAY_KEY_SECRET
              // Step 9: Only after successful server-side verification, enrollment is created
              const verifyRes = await api.post(`/student/courses/${courseId}/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data && verifyRes.data.success) {
                // Step 11: Course automatically appears in Student -> Enrollments
                setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
                fetchStudentEnrollments();
                window.dispatchEvent(new CustomEvent('enrollmentUpdated'));
                setPaymentStatusMessage({
                  type: 'success',
                  text: `Payment of ₹${courseObj?.price || 0} verified successfully! Course unlocked.`,
                });
                // Step 10: Redirect student to course learning page
                handleOpenCourse(courseId);
              } else {
                setPaymentStatusMessage({
                  type: 'error',
                  text: verifyRes.data?.message || 'Payment verification failed.',
                });
                alert(verifyRes.data?.message || 'Payment verification failed on server.');
              }
            } catch (err) {
              console.error('Payment verification error:', err);
              setPaymentStatusMessage({
                type: 'error',
                text: err.response?.data?.message || 'Payment verification failed.',
              });
              alert(err.response?.data?.message || 'Payment verification failed.');
            } finally {
              setEnrollingCourseId(null);
            }
          },
          modal: {
            ondismiss: function () {
              // Payment cancelled: No enrollment created -> Allow student to try again
              setEnrollingCourseId(null);
              setPaymentStatusMessage({
                type: 'warning',
                text: 'Payment cancelled. No enrollment was created. You can try again whenever ready.',
              });
            },
          },
          prefill: {
            name: user?.fullName || user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#5D0D1A',
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (response) {
          // Payment failed: No enrollment created -> Show failure message
          setEnrollingCourseId(null);
          setPaymentStatusMessage({
            type: 'error',
            text: response.error?.description || 'Payment failed. No enrollment created.',
          });
        });
        razorpayInstance.open();
      } catch (err) {
        console.error('Razorpay order creation error:', err);
        setPaymentStatusMessage({
          type: 'error',
          text: err.response?.data?.message || 'Failed to initiate payment order.',
        });
        setEnrollingCourseId(null);
      }
    } else {
      // FREE COURSE -> Direct Enrollment
      await handleFreeEnrollment(courseId);
    }
  };

  const handleFreeEnrollment = async (courseId) => {
    try {
      const res = await api.post(`/student/courses/${courseId}/enroll`);
      if (res.data && res.data.success) {
        setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
        fetchStudentEnrollments();
        window.dispatchEvent(new CustomEvent('enrollmentUpdated'));
        handleOpenCourse(courseId);
      } else {
        alert(res.data?.message || 'Failed to enroll in course');
      }
    } catch (err) {
      console.error('Free course enrollment error:', err);
      alert(err.response?.data?.message || 'Failed to enroll in course.');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // 4. Fetch full learning experience data for a specific course
  const handleOpenCourse = async (courseId) => {
    setCourseDetailsLoading(true);
    setCourseDetailsError(null);
    try {
      const res = await api.get(`/student/courses/${courseId}/learning`);
      if (res.data && res.data.success) {
        const { course, progress, stats } = res.data.data;
        setSelectedCourse(course);
        setStudentProgress(progress);
        if (stats) setProgressStats(stats);

        // Expand all modules by default
        const initialExpanded = {};
        let defaultActiveItem = null;

        if (course.modules && course.modules.length > 0) {
          course.modules.forEach((mod, idx) => {
            initialExpanded[mod._id] = true;

            if (idx === 0 && !defaultActiveItem) {
              if (mod.lessons && mod.lessons.length > 0) {
                defaultActiveItem = {
                  id: mod.lessons[0]._id,
                  type: 'lesson',
                  title: mod.lessons[0].title,
                  description: mod.lessons[0].duration ? `${mod.lessons[0].duration} estimated read` : '',
                  moduleTitle: mod.title,
                  moduleId: mod._id,
                  data: mod.lessons[0],
                };
              } else if (mod.pdfResources && mod.pdfResources.length > 0) {
                defaultActiveItem = {
                  id: mod.pdfResources[0]._id,
                  type: 'pdf',
                  title: mod.pdfResources[0].title,
                  description: mod.pdfResources[0].description,
                  moduleTitle: mod.title,
                  moduleId: mod._id,
                  data: mod.pdfResources[0],
                };
              } else if (mod.textResources && mod.textResources.length > 0) {
                const resItem = mod.textResources[0];
                defaultActiveItem = {
                  id: resItem._id,
                  type: resItem.type === 'assignment' ? 'assignment' : 'resource',
                  title: resItem.title,
                  description: resItem.description,
                  moduleTitle: mod.title,
                  moduleId: mod._id,
                  data: resItem,
                };
              } else if (mod.quizzes && mod.quizzes.length > 0) {
                defaultActiveItem = {
                  id: mod.quizzes[0]._id,
                  type: 'quiz',
                  title: mod.quizzes[0].title,
                  description: mod.quizzes[0].description,
                  moduleTitle: mod.title,
                  moduleId: mod._id,
                  data: mod.quizzes[0],
                };
              }
            }
          });
        }

        setExpandedModules(initialExpanded);
        setActiveItem(defaultActiveItem);
      } else {
        setCourseDetailsError(res.data?.message || 'Failed to load course content.');
      }
    } catch (err) {
      console.error('Error fetching course learning data:', err);
      setCourseDetailsError(err.response?.data?.message || 'Failed to load course learning experience.');
    } finally {
      setCourseDetailsLoading(false);
    }
  };

  const toggleModuleExpand = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Helper checks for item completion
  const isLessonCompleted = (lessonId) => {
    return studentProgress?.completedLessons?.some((id) => id.toString() === lessonId.toString());
  };

  const isPDFCompleted = (pdfId) => {
    return studentProgress?.completedPDFs?.some((id) => id.toString() === pdfId.toString());
  };

  const isResourceCompleted = (resId) => {
    return studentProgress?.completedResources?.some((id) => id.toString() === resId.toString());
  };

  const getAssignmentSubmission = (resourceId) => {
    return studentProgress?.completedAssignments?.find((a) => a.resourceId?.toString() === resourceId.toString());
  };

  // Toggle item completion state
  const handleToggleItemCompletion = async (itemId, itemType) => {
    if (!selectedCourse) return;
    try {
      const res = await api.post(`/student/courses/${selectedCourse._id}/progress/toggle-item`, {
        itemId,
        itemType,
      });

      if (res.data && res.data.success) {
        const updatedProgress = res.data.data.progress;
        setStudentProgress(updatedProgress);

        // Refresh learning stats
        if (selectedCourse._id) {
          const learningRes = await api.get(`/student/courses/${selectedCourse._id}/learning`);
          if (learningRes.data?.data?.stats) {
            setProgressStats(learningRes.data.data.stats);
          }
        }
      }
    } catch (err) {
      console.error('Error toggling item progress:', err);
    }
  };

  // Submit Text Assignment Response
  const handleSubmitAssignmentResponse = async (resourceId) => {
    if (!assignmentForm.text.trim()) return;
    setAssignmentForm((prev) => ({ ...prev, submitting: true, successMsg: '' }));
    try {
      const res = await api.post(`/student/courses/${selectedCourse._id}/assignments/${resourceId}/submit`, {
        submissionText: assignmentForm.text,
        submissionUrl: assignmentForm.url,
      });

      if (res.data && res.data.success) {
        const updatedProgress = res.data.data.progress;
        setStudentProgress(updatedProgress);
        setAssignmentForm({ text: '', url: '', submitting: false, successMsg: 'Assignment response submitted successfully!' });

        if (selectedCourse._id) {
          const learningRes = await api.get(`/student/courses/${selectedCourse._id}/learning`);
          if (learningRes.data?.data?.stats) {
            setProgressStats(learningRes.data.data.stats);
          }
        }
      } else {
        setAssignmentForm((prev) => ({ ...prev, submitting: false, successMsg: res.data?.message || 'Submission failed.' }));
      }
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setAssignmentForm((prev) => ({ ...prev, submitting: false, successMsg: 'Failed to submit response.' }));
    }
  };

  // Open PDF viewer for resource
  const handleOpenPDFResource = (resource, moduleTitle) => {
    setPdfViewerState({
      isOpen: true,
      pdfResource: resource,
      courseTitle: selectedCourse?.title || '',
      moduleTitle: moduleTitle || '',
      lessonTitle: activeItem?.title || '',
      courseId: selectedCourse?._id || '',
    });
  };

  // Filter courses by search, category & enrollment status
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.skills && c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter student enrollments by search query and category
  const filteredStudentEnrollments = studentEnrollments.filter((enr) => {
    const course = enr.courseId;
    if (!course || typeof course !== 'object') return false;

    const matchesSearch =
      !searchQuery ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.skills && course.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------
          A. COURSE CATALOG VIEW (If no course selected)
      ---------------------------------------------------- */}
      {!selectedCourse ? (
        <div className="space-y-8">
          {/* Payment Status Notification Banner */}
          <AnimatePresence>
            {paymentStatusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl flex items-center justify-between shadow-xs border ${
                  paymentStatusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : paymentStatusMessage.type === 'warning'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs font-bold">
                  {paymentStatusMessage.type === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="shrink-0" />
                  )}
                  <span>{paymentStatusMessage.text}</span>
                </div>
                <button
                  onClick={() => setPaymentStatusMessage(null)}
                  className="p-1 hover:opacity-80 transition-opacity"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] rounded-[28px] p-6 md:p-10 text-[#FFF9EB] shadow-xl relative overflow-hidden border border-[#5D0D1A]">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#FFF9EB]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF9EB]/15 text-[#FFF9EB] text-xs font-extrabold border border-[#FFF9EB]/20">
                <Sparkles size={14} />
                <span>Mentor Learning Platform</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Learn. Build. Grow.
              </h1>
              <p className="text-[#FFF9EB]/80 text-sm md:text-base font-medium leading-relaxed">
                Explore mentor-curated courses, strengthen your skills through text-based lessons and resources, complete assessments, and make progress toward your career goals.
              </p>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-white rounded-[22px] p-4 md:p-6 border border-[#9FB2AC] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5D57]" />
                <input
                  type="text"
                  placeholder="Search courses, skills, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#FFF9EB]/50 border border-[#9FB2AC] rounded-xl text-xs font-semibold text-[#2D060D] focus:outline-none focus:border-[#5D0D1A] focus:ring-1 focus:ring-[#5D0D1A] transition-all"
                />
              </div>

              {/* My Enrolled Courses Toggle */}
              <button
                onClick={() => setShowEnrolledOnly((prev) => !prev)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 border ${
                  showEnrolledOnly
                    ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-sm'
                    : 'bg-[#FFF9EB] text-[#5D0D1A] border-[#9FB2AC] hover:bg-[#5D0D1A]/10'
                }`}
              >
                <BookmarkCheck size={16} />
                <span>My Enrollments ({studentEnrollments.length})</span>
              </button>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                <Filter size={16} className="text-[#5D0D1A] shrink-0 mr-1" />
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-sm shadow-[#5D0D1A]/20'
                        : 'bg-[#FFF9EB] text-[#4A5D57] hover:text-[#5D0D1A] border border-[#9FB2AC]/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Render View: Student Enrollments vs Catalog Cards */}
          {showEnrolledOnly ? (
            /* ================= STUDENT ENROLLMENTS VIEW ================= */
            filteredStudentEnrollments.length === 0 ? (
              <div className="bg-white rounded-[22px] p-12 text-center border border-[#9FB2AC] shadow-xs space-y-3">
                <BookmarkCheck size={40} className="mx-auto text-[#4A5D57]/60" />
                <h3 className="text-lg font-bold text-[#5D0D1A]">No Course Enrollments Found</h3>
                <p className="text-xs text-[#4A5D57] max-w-md mx-auto">
                  {studentEnrollments.length === 0
                    ? "You haven't enrolled in any courses yet. Switch to the catalog view to browse published courses and click 'Enroll Now'!"
                    : "No enrolled courses match your current filter or search term."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudentEnrollments.map((enr) => {
                  const course = enr.courseId;
                  if (!course || typeof course !== 'object') return null;
                  const progressStatsData = enr.progressStats || {};
                  const percentage = progressStatsData.percentage !== undefined ? progressStatsData.percentage : (enr.progressPercentage || 0);
                  const enrolledDate = enr.enrolledAt
                    ? new Date(enr.enrolledAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recently';

                  return (
                    <div
                      key={enr._id || course._id}
                      className="bg-white rounded-[22px] border border-[#9FB2AC] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
                    >
                      {/* Thumbnail Header */}
                      <div className="relative w-full overflow-hidden bg-[#f5f5f5] flex items-center justify-center border-b border-[#9FB2AC]/30">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-auto max-h-[260px] object-contain object-center block"
                          />
                        ) : (
                          <div className="w-full h-44 flex flex-col items-center justify-center text-center text-[#FFF9EB] space-y-2 p-4 bg-gradient-to-br from-[#5D0D1A] to-[#420912]">
                            <BookOpen size={36} className="mx-auto opacity-80" />
                            <span className="text-xs font-extrabold line-clamp-1">{course.title}</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#FFF9EB]/90 backdrop-blur-md text-[#5D0D1A] text-[10px] font-black shadow-xs border border-[#9FB2AC] z-10 pointer-events-none">
                          {course.category || 'General'}
                        </span>
                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-600/90 text-[#FFF9EB] text-[10px] font-black border border-emerald-300 flex items-center gap-1 shadow-xs z-10 pointer-events-none">
                          <CheckCircle2 size={11} />
                          Enrolled ✓
                        </span>
                      </div>

                      {/* Content Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-base font-extrabold text-[#5D0D1A] leading-snug line-clamp-2">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#2D060D] font-bold pt-1">
                            {course.mentorId?.profilePhoto ? (
                              <img
                                src={course.mentorId.profilePhoto}
                                alt={course.mentorId.name || course.mentorId.fullName}
                                className="w-5 h-5 rounded-full object-cover border border-[#9FB2AC]"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center font-bold text-[9px] border border-[#9FB2AC]">
                                <User size={10} />
                              </div>
                            )}
                            <span className="truncate">{course.mentorId?.name || course.mentorId?.fullName || 'Mentor'}</span>
                          </div>
                        </div>

                        {/* Progress Bar & Payment Status */}
                        <div className="space-y-3 pt-3 border-t border-[#9FB2AC]/30">
                          {/* Course Progress */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-[#5D0D1A]">
                              <span>Course Progress</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/50">
                              <div
                                className="h-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Enrollment Metadata Badges */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#4A5D57] pt-1 items-center">
                            <div className="flex items-center gap-1.5 truncate">
                              <Calendar size={13} className="text-[#5D0D1A] shrink-0" />
                              <span>{enrolledDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate justify-end">
                              <CreditCard size={13} className="text-[#5D0D1A] shrink-0" />
                              <span className="capitalize font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {enr.paymentStatus === 'paid'
                                  ? `Paid (₹${enr.amount || course.price})`
                                  : enr.paymentStatus === 'free'
                                  ? 'Free Course'
                                  : enr.paymentStatus || 'Enrolled'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenCourse(course._id)}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] shadow-xs transition-all flex items-center justify-center gap-2"
                        >
                          <span>Continue Learning</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ================= CATALOG COURSES GRID ================= */
            loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 bg-[#9FB2AC]/20 rounded-[22px] border border-[#9FB2AC]/30" />
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-[22px] p-8 text-center border border-[#9FB2AC] shadow-xs space-y-4 max-w-lg mx-auto">
                <AlertCircle size={32} className="mx-auto text-[#5D0D1A]" />
                <h3 className="text-lg font-bold text-[#5D0D1A]">Failed to Load Courses</h3>
                <p className="text-xs text-[#4A5D57] font-medium">{error}</p>
                <button
                  onClick={fetchPublishedCourses}
                  className="px-5 py-2 bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold rounded-xl shadow-xs"
                >
                  Retry
                </button>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="bg-white rounded-[22px] p-12 text-center border border-[#9FB2AC] shadow-xs space-y-3">
                <BookOpen size={40} className="mx-auto text-[#4A5D57]/60" />
                <h3 className="text-lg font-bold text-[#5D0D1A]">No Published Courses Found</h3>
                <p className="text-xs text-[#4A5D57] max-w-md mx-auto">
                  No published courses match your search criteria. Check back soon as mentors publish new learning tracks!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course._id);
                  const isEnrolling = enrollingCourseId === course._id;
                  const isPaidCourse = course.isPaid || course.priceType === 'Paid' || (course.price || 0) > 0;

                  return (
                    <div
                      key={course._id}
                      className="bg-white rounded-[22px] border border-[#9FB2AC] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full overflow-hidden bg-[#f5f5f5] flex items-center justify-center border-b border-[#9FB2AC]/30">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-auto max-h-[260px] object-contain object-center block"
                          />
                        ) : (
                          <div className="w-full h-44 flex flex-col items-center justify-center text-center text-[#FFF9EB] space-y-2 p-4 bg-gradient-to-br from-[#5D0D1A] to-[#420912]">
                            <BookOpen size={36} className="mx-auto opacity-80" />
                            <span className="text-xs font-extrabold line-clamp-1">{course.title}</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#FFF9EB]/90 backdrop-blur-md text-[#5D0D1A] text-[10px] font-black shadow-xs border border-[#9FB2AC] z-10 pointer-events-none">
                          {course.category}
                        </span>

                        {/* Price Badge */}
                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#FFF9EB]/95 text-[#5D0D1A] text-[10px] font-black border border-[#9FB2AC] flex items-center gap-0.5 shadow-xs z-10 pointer-events-none">
                          {isPaidCourse ? (
                            <>
                              <IndianRupee size={11} />
                              <span>{course.price}</span>
                            </>
                          ) : (
                            <span className="text-emerald-800 font-black">Free</span>
                          )}
                        </span>
                      </div>

                      {/* Body Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-base font-extrabold text-[#5D0D1A] leading-snug line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-xs text-[#4A5D57] font-medium leading-relaxed line-clamp-2">
                            {course.shortDescription || course.description}
                          </p>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-[#9FB2AC]/30">
                          <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-[#4A5D57]">
                            <div className="flex items-center gap-1.5 truncate">
                              <Layers size={13} className="text-[#5D0D1A] shrink-0" />
                              <span>{course.moduleCount || 0} Modules</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <FileText size={13} className="text-[#5D0D1A] shrink-0" />
                              <span>{course.pdfCount || 0} PDFs</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Clock size={13} className="text-[#5D0D1A] shrink-0" />
                              <span>{course.estimatedDuration || 'Self-paced'}</span>
                            </div>
                          </div>

                          {/* Mentor Avatar Badge */}
                          <div className="flex items-center justify-between pt-1 text-xs text-[#2D060D] font-bold">
                            <div className="flex items-center gap-2 truncate">
                              {course.mentorId?.profilePhoto ? (
                                <img
                                  src={course.mentorId.profilePhoto}
                                  alt={course.mentorId.name}
                                  className="w-6 h-6 rounded-full object-cover border border-[#9FB2AC]"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center font-bold text-[10px] border border-[#9FB2AC]">
                                  <User size={12} />
                                </div>
                              )}
                              <span className="truncate">{course.mentorId?.name || 'Mentor'}</span>
                            </div>

                            {/* Price / Enrolled label */}
                            <div className="text-[11px] font-extrabold text-[#5D0D1A]">
                              {isEnrolled ? (
                                <span className="text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 size={13} />
                                  Enrolled ✓
                                </span>
                              ) : isPaidCourse ? (
                                <span>Course Price: ₹{course.price}</span>
                              ) : (
                                <span className="text-emerald-700">Course: Free</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEnrollAndOpenCourse(course)}
                          disabled={isEnrolling}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-2 ${
                            isEnrolled
                              ? 'bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB]'
                              : 'bg-[#FFF9EB] hover:bg-[#5D0D1A] hover:text-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]'
                          }`}
                        >
                          {isEnrolling ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : isEnrolled ? (
                            <>
                              <span>Continue Learning</span>
                              <ChevronRight size={14} />
                            </>
                          ) : (
                            <>
                              <span>Enroll Now</span>
                              <ChevronRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      ) : (
        /* ----------------------------------------------------
            B. COURSERA-STYLE STUDENT LEARNING WORKSPACE VIEW
        ---------------------------------------------------- */
        <div className="space-y-6 animate-fadeIn">
          {/* Top Navigation Bar with Back Button */}
          <div className="flex items-center justify-between gap-4 bg-white rounded-[22px] p-4 border border-[#9FB2AC] shadow-xs">
            <button
              onClick={() => {
                setSelectedCourse(null);
                setActiveItem(null);
                fetchStudentEnrollments();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] text-xs font-bold border border-[#9FB2AC] hover:bg-[#5D0D1A] hover:text-[#FFF9EB] transition-all"
            >
              <ArrowLeft size={16} />
              <span>Back to Course Catalog</span>
            </button>
            <div className="text-xs font-black text-[#5D0D1A] truncate max-w-md hidden md:block">
              {selectedCourse.title}
            </div>
          </div>

          {/* COURSE PROGRESS STATS OVERVIEW CARDS (Tracked per studentId) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Course Progress Percentage */}
            <div className="bg-white rounded-2xl p-4 border border-[#9FB2AC] shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#4A5D57]">Course Progress</span>
                <span className="text-[#5D0D1A] font-black text-sm">{progressStats.percentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/60">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressStats.percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-[10px] text-[#4A5D57] font-semibold">
                {progressStats.completedItemsCount} of {progressStats.totalTrackedItems} items completed
              </div>
            </div>

            {/* Card 2: Lessons Completed */}
            <div className="bg-white rounded-2xl p-4 border border-[#9FB2AC] shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#4A5D57]">Lessons Completed</div>
                <div className="text-lg font-black text-[#5D0D1A]">
                  {progressStats.lessonsSummary || '0 / 0'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
            </div>

            {/* Card 3: Quiz Score Average */}
            <div className="bg-white rounded-2xl p-4 border border-[#9FB2AC] shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#4A5D57]">Average Quiz Score</div>
                <div className="text-lg font-black text-[#5D0D1A]">
                  {progressStats.quizScoreSummary || '0%'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shrink-0">
                <Award size={20} />
              </div>
            </div>

            {/* Card 4: Modules Completed */}
            <div className="bg-white rounded-2xl p-4 border border-[#9FB2AC] shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#4A5D57]">Modules Completed</div>
                <div className="text-lg font-black text-[#5D0D1A]">
                  {progressStats.modulesSummary || '0 / 0'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shrink-0">
                <Layers size={20} />
              </div>
            </div>
          </div>

          {courseDetailsLoading ? (
            <div className="p-16 text-center space-y-3 bg-white rounded-[28px] border border-[#9FB2AC]">
              <Loader2 size={36} className="animate-spin mx-auto text-[#5D0D1A]" />
              <p className="text-sm font-bold text-[#5D0D1A]">Loading course environment...</p>
            </div>
          ) : courseDetailsError ? (
            <div className="p-8 bg-white rounded-[28px] border border-red-300 text-center space-y-3">
              <AlertCircle size={32} className="mx-auto text-red-500" />
              <p className="text-sm font-bold text-[#5D0D1A]">{courseDetailsError}</p>
            </div>
          ) : (
            /* Coursera Split Pane: Sidebar (Curriculum Tree) + Main Canvas */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT SIDEBAR: CURRICULUM TREE & MODULE NAVIGATION */}
              <div className="lg:col-span-4 bg-white rounded-[28px] border border-[#9FB2AC] shadow-xs overflow-hidden space-y-4 p-4 sticky top-6">
                {/* Course Context Header */}
                <div className="p-3 bg-[#FFF9EB] rounded-2xl border border-[#9FB2AC]/60 space-y-2">
                  {selectedCourse.thumbnail && (
                    <div className="w-full rounded-xl overflow-hidden border border-[#9FB2AC]/50 mb-2 bg-[#f5f5f5] flex items-center justify-center">
                      <img
                        src={selectedCourse.thumbnail}
                        alt={selectedCourse.title}
                        className="w-full h-auto max-h-56 object-contain object-center block"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#5D0D1A] uppercase tracking-wider">
                      {selectedCourse.category} • {selectedCourse.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-black">
                      Enrolled
                    </span>
                  </div>
                  <h2 className="text-sm font-black text-[#5D0D1A] line-clamp-2">
                    {selectedCourse.title}
                  </h2>
                  <div className="flex items-center gap-2 pt-1">
                    {selectedCourse.mentorId?.profilePhoto ? (
                      <img
                        src={selectedCourse.mentorId.profilePhoto}
                        alt={selectedCourse.mentorId.name}
                        className="w-5 h-5 rounded-full object-cover border border-[#9FB2AC]"
                      />
                    ) : (
                      <User size={12} className="text-[#5D0D1A]" />
                    )}
                    <span className="text-[11px] font-bold text-[#2D060D]">
                      {selectedCourse.mentorId?.name || 'Mentor'}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-black text-[#5D0D1A] uppercase tracking-wider px-1 flex items-center justify-between">
                  <span>Course Curriculum</span>
                  <span className="text-[10px] font-bold text-[#4A5D57]">
                    {selectedCourse.modules?.length || 0} Modules
                  </span>
                </div>

                {/* Modules Accordion List with Status Badges (✓ / ◐ / ○) */}
                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
                  {selectedCourse.modules?.map((moduleItem, modIdx) => {
                    const isExpanded = expandedModules[moduleItem._id];
                    const modStats = progressStats.moduleStatsMap?.[moduleItem._id.toString()];
                    const modStatus = modStats?.status || 'not_started';

                    return (
                      <div
                        key={moduleItem._id}
                        className="border border-[#9FB2AC]/70 rounded-2xl overflow-hidden bg-white shadow-2xs"
                      >
                        {/* Module Title Bar */}
                        <div
                          onClick={() => toggleModuleExpand(moduleItem._id)}
                          className="p-3 bg-[#FFF9EB]/40 flex items-center justify-between cursor-pointer hover:bg-[#FFF9EB] transition-all select-none gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-lg bg-[#5D0D1A] text-[#FFF9EB] text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {modIdx + 1}
                            </span>
                            <h4 className="text-xs font-extrabold text-[#5D0D1A] truncate">
                              {moduleItem.title}
                            </h4>
                          </div>

                          {/* Module Completion Badge (✓ Completed / ◐ In Progress / ○ Not Started) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {modStatus === 'completed' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold flex items-center gap-1">
                                <CheckCircle2 size={11} className="text-emerald-700" />
                                <span>✓ Completed</span>
                              </span>
                            )}
                            {modStatus === 'in_progress' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold flex items-center gap-1">
                                <span>◐ In Progress</span>
                              </span>
                            )}
                            {modStatus === 'not_started' && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300 text-[9px] font-extrabold flex items-center gap-1">
                                <span>○ Not Started</span>
                              </span>
                            )}
                            {isExpanded ? <ChevronDown size={15} className="text-[#5D0D1A]" /> : <ChevronRight size={15} className="text-[#5D0D1A]" />}
                          </div>
                        </div>

                        {/* Module Items Tree */}
                        {isExpanded && (
                          <div className="p-2 space-y-1 bg-white border-t border-[#9FB2AC]/30 text-xs">
                            {/* 1. Lessons */}
                            {moduleItem.lessons?.map((lessonItem) => {
                              const completed = isLessonCompleted(lessonItem._id);
                              const isActive = activeItem?.id === lessonItem._id;
                              return (
                                <div
                                  key={lessonItem._id}
                                  onClick={() =>
                                    setActiveItem({
                                      id: lessonItem._id,
                                      type: 'lesson',
                                      title: lessonItem.title,
                                      description: lessonItem.duration ? `${lessonItem.duration} read` : '',
                                      moduleTitle: moduleItem.title,
                                      moduleId: moduleItem._id,
                                      data: lessonItem,
                                    })
                                  }
                                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${isActive
                                      ? 'bg-[#5D0D1A] text-[#FFF9EB] font-bold shadow-xs'
                                      : 'hover:bg-[#FFF9EB] text-[#2D060D] font-medium'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {completed ? (
                                      <CheckCircle2 size={15} className={isActive ? 'text-[#FFF9EB]' : 'text-emerald-600'} />
                                    ) : (
                                      <Circle size={15} className={isActive ? 'text-[#FFF9EB]/70' : 'text-[#4A5D57]/60'} />
                                    )}
                                    <span className="truncate text-xs">{lessonItem.title}</span>
                                  </div>
                                  <span className="text-[10px] opacity-70 shrink-0">Lesson</span>
                                </div>
                              );
                            })}

                            {/* 2. PDF Resources */}
                            {moduleItem.pdfResources?.map((pdfItem) => {
                              const completed = isPDFCompleted(pdfItem._id);
                              const isActive = activeItem?.id === pdfItem._id;
                              return (
                                <div
                                  key={pdfItem._id}
                                  onClick={() =>
                                    setActiveItem({
                                      id: pdfItem._id,
                                      type: 'pdf',
                                      title: pdfItem.title,
                                      description: pdfItem.description,
                                      moduleTitle: moduleItem.title,
                                      moduleId: moduleItem._id,
                                      data: pdfItem,
                                    })
                                  }
                                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${isActive
                                      ? 'bg-[#5D0D1A] text-[#FFF9EB] font-bold shadow-xs'
                                      : 'hover:bg-[#FFF9EB] text-[#2D060D] font-medium'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {completed ? (
                                      <CheckCircle2 size={15} className={isActive ? 'text-[#FFF9EB]' : 'text-emerald-600'} />
                                    ) : (
                                      <Circle size={15} className={isActive ? 'text-[#FFF9EB]/70' : 'text-[#4A5D57]/60'} />
                                    )}
                                    <FileText size={14} className={isActive ? 'text-[#FFF9EB]' : 'text-[#5D0D1A]'} />
                                    <span className="truncate text-xs">{pdfItem.title}</span>
                                  </div>
                                  <span className="text-[10px] opacity-70 shrink-0">PDF</span>
                                </div>
                              );
                            })}

                            {/* 3. Text Resources & Assignments */}
                            {moduleItem.textResources?.map((textRes) => {
                              const isAssignment = textRes.type === 'assignment';
                              const completed = isAssignment
                                ? !!getAssignmentSubmission(textRes._id)
                                : isResourceCompleted(textRes._id);
                              const isActive = activeItem?.id === textRes._id;

                              return (
                                <div
                                  key={textRes._id}
                                  onClick={() =>
                                    setActiveItem({
                                      id: textRes._id,
                                      type: isAssignment ? 'assignment' : 'resource',
                                      title: textRes.title,
                                      description: textRes.description,
                                      moduleTitle: moduleItem.title,
                                      moduleId: moduleItem._id,
                                      data: textRes,
                                    })
                                  }
                                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${isActive
                                      ? 'bg-[#5D0D1A] text-[#FFF9EB] font-bold shadow-xs'
                                      : 'hover:bg-[#FFF9EB] text-[#2D060D] font-medium'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {completed ? (
                                      <CheckCircle2 size={15} className={isActive ? 'text-[#FFF9EB]' : 'text-emerald-600'} />
                                    ) : (
                                      <Circle size={15} className={isActive ? 'text-[#FFF9EB]/70' : 'text-[#4A5D57]/60'} />
                                    )}
                                    {isAssignment ? (
                                      <FileCheck size={14} className={isActive ? 'text-[#FFF9EB]' : 'text-[#5D0D1A]'} />
                                    ) : (
                                      <LinkIcon size={14} className={isActive ? 'text-[#FFF9EB]' : 'text-[#5D0D1A]'} />
                                    )}
                                    <span className="truncate text-xs">{textRes.title}</span>
                                  </div>
                                  <span className="text-[10px] opacity-70 shrink-0">
                                    {isAssignment ? 'Assignment' : 'Resource'}
                                  </span>
                                </div>
                              );
                            })}

                            {/* 4. Quizzes */}
                            {moduleItem.quizzes?.map((quizItem) => {
                              const attempt = quizItem.latestAttempt;
                              const isActive = activeItem?.id === quizItem._id;
                              return (
                                <div
                                  key={quizItem._id}
                                  onClick={() =>
                                    setActiveItem({
                                      id: quizItem._id,
                                      type: 'quiz',
                                      title: quizItem.title,
                                      description: quizItem.description,
                                      moduleTitle: moduleItem.title,
                                      moduleId: moduleItem._id,
                                      data: quizItem,
                                    })
                                  }
                                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${isActive
                                      ? 'bg-[#5D0D1A] text-[#FFF9EB] font-bold shadow-xs'
                                      : 'hover:bg-[#FFF9EB] text-[#2D060D] font-medium'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {attempt ? (
                                      <CheckCircle2 size={15} className={isActive ? 'text-[#FFF9EB]' : 'text-emerald-600'} />
                                    ) : (
                                      <Circle size={15} className={isActive ? 'text-[#FFF9EB]/70' : 'text-[#4A5D57]/60'} />
                                    )}
                                    <Award size={14} className={isActive ? 'text-[#FFF9EB]' : 'text-[#5D0D1A]'} />
                                    <span className="truncate text-xs">{quizItem.title}</span>
                                  </div>
                                  {attempt ? (
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-[#FFF9EB] text-[#5D0D1A]' : 'bg-emerald-100 text-emerald-800'}`}>
                                      Completed ({attempt.percentage}%)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] opacity-70 shrink-0">Quiz</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT MAIN CANVAS: ACTIVE ITEM CONTENT READER */}
              <div className="lg:col-span-8 bg-white rounded-[28px] border border-[#9FB2AC] shadow-xs p-6 md:p-8 min-h-[600px] flex flex-col justify-between">
                {!activeItem ? (
                  <div className="m-auto text-center space-y-3 p-8">
                    <BookOpen size={48} className="mx-auto text-[#5D0D1A]/40" />
                    <h3 className="text-lg font-bold text-[#5D0D1A]">Select an Item from the Curriculum</h3>
                    <p className="text-xs text-[#4A5D57] max-w-sm mx-auto font-medium">
                      Click any lesson, PDF resource, article, assignment, or quiz on the left sidebar tree to start learning.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    {/* Item Context Header Bar */}
                    <div className="space-y-4 pb-6 border-b border-[#9FB2AC]/40">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-black text-[#5D0D1A] uppercase tracking-wider bg-[#FFF9EB] px-3 py-1 rounded-full border border-[#9FB2AC]">
                          {activeItem.moduleTitle}
                        </span>

                        {/* Completion Toggle Button */}
                        {activeItem.type !== 'quiz' && (
                          <button
                            onClick={() => handleToggleItemCompletion(activeItem.id, activeItem.type)}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all ${(activeItem.type === 'lesson' && isLessonCompleted(activeItem.id)) ||
                                (activeItem.type === 'pdf' && isPDFCompleted(activeItem.id)) ||
                                (activeItem.type === 'resource' && isResourceCompleted(activeItem.id)) ||
                                (activeItem.type === 'assignment' && getAssignmentSubmission(activeItem.id))
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] hover:bg-[#7A1424]'
                              }`}
                          >
                            {(activeItem.type === 'lesson' && isLessonCompleted(activeItem.id)) ||
                              (activeItem.type === 'pdf' && isPDFCompleted(activeItem.id)) ||
                              (activeItem.type === 'resource' && isResourceCompleted(activeItem.id)) ||
                              (activeItem.type === 'assignment' && getAssignmentSubmission(activeItem.id)) ? (
                              <>
                                <CheckCircle2 size={16} />
                                <span>Completed</span>
                              </>
                            ) : (
                              <>
                                <Circle size={16} />
                                <span>Mark as Completed</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <h1 className="text-2xl font-black text-[#5D0D1A] leading-tight">
                        {activeItem.title}
                      </h1>
                      {activeItem.description && (
                        <p className="text-xs text-[#4A5D57] font-medium leading-relaxed">
                          {activeItem.description}
                        </p>
                      )}
                    </div>

                    {/* ITEM SPECIFIC CANVAS CONTENT */}
                    <div className="flex-1 space-y-6 pt-2">
                      {/* A. TEXT LESSON READER */}
                      {activeItem.type === 'lesson' && (
                        <div className="space-y-4">
                          <div className="p-6 rounded-2xl bg-[#FFF9EB]/30 border border-[#9FB2AC]/50 text-xs md:text-sm text-[#2D060D] leading-relaxed whitespace-pre-wrap font-sans">
                            {activeItem.data.content}
                          </div>
                        </div>
                      )}

                      {/* B. PDF RESOURCE READER */}
                      {activeItem.type === 'pdf' && (
                        <div className="space-y-4 text-center py-6 bg-[#FFF9EB]/20 rounded-2xl border border-[#9FB2AC]/40 p-6">
                          <FileText size={48} className="mx-auto text-[#5D0D1A]" />
                          <h3 className="text-base font-extrabold text-[#5D0D1A]">
                            {activeItem.data.title}
                          </h3>
                          <p className="text-xs text-[#4A5D57] max-w-md mx-auto font-medium">
                            {activeItem.data.description || 'Secure text-based PDF learning document prepared by your mentor.'}
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => handleOpenPDFResource(activeItem.data, activeItem.moduleTitle)}
                              className="px-6 py-3 bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2"
                            >
                              <Eye size={16} />
                              <span>Open PDF in In-App Reader</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* C. TEXT & REFERENCE RESOURCES (Article, Doc, Note, Link) */}
                      {activeItem.type === 'resource' && (
                        <div className="space-y-4">
                          {activeItem.data.type === 'note' ? (
                            <div className="p-6 bg-[#FFF9EB] rounded-2xl border border-[#9FB2AC] space-y-3 font-mono text-xs leading-relaxed text-[#2D060D] whitespace-pre-wrap">
                              <div className="text-[10px] font-black text-[#5D0D1A] uppercase tracking-wider font-sans border-b border-[#9FB2AC]/40 pb-2">
                                Mentor Note
                              </div>
                              {activeItem.data.content || 'No content written in this note.'}
                            </div>
                          ) : (
                            <div className="p-6 bg-[#FFF9EB]/30 rounded-2xl border border-[#9FB2AC] space-y-4 text-center">
                              <LinkIcon size={40} className="mx-auto text-[#5D0D1A]" />
                              <div className="space-y-1">
                                <span className="px-3 py-1 rounded-full bg-[#5D0D1A] text-[#FFF9EB] text-[10px] font-extrabold uppercase">
                                  {activeItem.data.type}
                                </span>
                                <h3 className="text-sm font-bold text-[#5D0D1A] pt-2">
                                  {activeItem.data.title}
                                </h3>
                              </div>
                              <div className="pt-2">
                                <a
                                  href={activeItem.data.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-6 py-3 bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2"
                                >
                                  <ExternalLink size={16} />
                                  <span>Open External Resource</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* D. ASSIGNMENT SUBMISSION CANVAS */}
                      {activeItem.type === 'assignment' && (
                        <div className="space-y-6">
                          {/* Previous Submission Status */}
                          {getAssignmentSubmission(activeItem.id) ? (
                            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-3">
                              <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                                <CheckCircle2 size={16} className="text-emerald-700" />
                                <span>Assignment Submitted</span>
                                <span className="text-[10px] text-emerald-700 font-medium ml-auto">
                                  {new Date(getAssignmentSubmission(activeItem.id).completedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs text-emerald-950 whitespace-pre-wrap font-mono">
                                {getAssignmentSubmission(activeItem.id).submissionText}
                              </div>
                              {getAssignmentSubmission(activeItem.id).submissionUrl && (
                                <a
                                  href={getAssignmentSubmission(activeItem.id).submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#5D0D1A] font-bold underline inline-flex items-center gap-1"
                                >
                                  <ExternalLink size={12} />
                                  <span>View Submitted Link</span>
                                </a>
                              )}
                            </div>
                          ) : null}

                          {/* Submission Form */}
                          <div className="p-5 bg-[#FFF9EB]/40 rounded-2xl border border-[#9FB2AC] space-y-4">
                            <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider">
                              Submit Your Work Response
                            </h4>
                            <textarea
                              rows={5}
                              placeholder="Write your text response, solution code, or project reflection here..."
                              value={assignmentForm.text}
                              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, text: e.target.value }))}
                              className="w-full p-4 bg-white border border-[#9FB2AC] rounded-xl text-xs font-mono text-[#2D060D] focus:outline-none focus:border-[#5D0D1A] focus:ring-1 focus:ring-[#5D0D1A]"
                            />
                            <input
                              type="url"
                              placeholder="Optional Project URL (e.g. GitHub repo, live demo link)"
                              value={assignmentForm.url}
                              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, url: e.target.value }))}
                              className="w-full p-3 bg-white border border-[#9FB2AC] rounded-xl text-xs font-sans text-[#2D060D] focus:outline-none focus:border-[#5D0D1A]"
                            />
                            {assignmentForm.successMsg && (
                              <div className="text-xs font-bold text-emerald-700">{assignmentForm.successMsg}</div>
                            )}
                            <button
                              onClick={() => handleSubmitAssignmentResponse(activeItem.id)}
                              disabled={!assignmentForm.text.trim() || assignmentForm.submitting}
                              className="px-6 py-2.5 bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                            >
                              {assignmentForm.submitting ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Send size={14} />
                              )}
                              <span>Submit Assignment</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* E. QUIZ CANVAS */}
                      {activeItem.type === 'quiz' && (
                        <div className="space-y-6 text-center py-8 bg-[#FFF9EB]/30 rounded-2xl border border-[#9FB2AC] p-6 md:p-8">
                          {activeItem.data.latestAttempt ? (
                            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300 shadow-xs">
                              <CheckCircle2 size={36} />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC] shadow-xs">
                              <Award size={36} />
                            </div>
                          )}

                          <div className="space-y-2">
                            {activeItem.data.latestAttempt && (
                              <div className="flex items-center justify-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-300">
                                  <CheckCircle2 size={13} />
                                  <span>Completed</span>
                                </span>
                              </div>
                            )}
                            <h3 className="text-lg font-black text-[#5D0D1A]">
                              {activeItem.data.title}
                            </h3>
                            <p className="text-xs text-[#4A5D57] font-medium max-w-md mx-auto">
                              {activeItem.data.description || 'Test your understanding with multiple-choice questions.'}
                            </p>
                          </div>

                          {activeItem.data.latestAttempt && (
                            <div className="p-4 bg-white rounded-2xl border border-emerald-300 inline-block shadow-2xs space-y-1 text-center">
                              <div className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                                Quiz Attempt Score
                              </div>
                              <div className="text-xl font-black text-[#5D0D1A]">
                                Score: {activeItem.data.latestAttempt.percentage}% ({activeItem.data.latestAttempt.score ?? activeItem.data.latestAttempt.totalScore} / {activeItem.data.latestAttempt.maxScore ?? activeItem.data.latestAttempt.totalScore} Marks)
                              </div>
                              {activeItem.data.latestAttempt.completedAt && (
                                <div className="text-[11px] text-[#4A5D57] font-medium">
                                  Submitted on {new Date(activeItem.data.latestAttempt.completedAt).toLocaleDateString()} at {new Date(activeItem.data.latestAttempt.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </div>
                          )}

                          <div>
                            <button
                              onClick={() =>
                                setActiveQuizState({
                                  isOpen: true,
                                  quiz: activeItem.data,
                                  moduleTitle: activeItem.moduleTitle,
                                  courseId: selectedCourse._id,
                                })
                              }
                              className={`px-6 py-3 text-xs font-extrabold rounded-xl shadow-xs inline-flex items-center gap-2 transition-all ${
                                activeItem.data.latestAttempt
                                  ? 'bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#5D0D1A] hover:text-[#FFF9EB]'
                                  : 'bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB]'
                              }`}
                            >
                              <Award size={16} />
                              <span>{activeItem.data.latestAttempt ? 'Retake Quiz' : 'Start Knowledge Check Quiz'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECURE IN-APP PDF VIEWER MODAL */}
      <StudentPDFViewerModal
        isOpen={pdfViewerState.isOpen}
        onClose={() => setPdfViewerState((prev) => ({ ...prev, isOpen: false }))}
        pdfResource={pdfViewerState.pdfResource}
        courseTitle={pdfViewerState.courseTitle}
        moduleTitle={pdfViewerState.moduleTitle}
        lessonTitle={pdfViewerState.lessonTitle}
        courseId={pdfViewerState.courseId}
      />

      {/* INTERACTIVE QUIZ & KNOWLEDGE CHECK MODAL */}
      <StudentQuizModal
        isOpen={activeQuizState.isOpen}
        onClose={() => setActiveQuizState((prev) => ({ ...prev, isOpen: false }))}
        quiz={activeQuizState.quiz}
        moduleTitle={activeQuizState.moduleTitle}
        courseId={activeQuizState.courseId}
        onQuizSubmitted={() => {
          if (selectedCourse?._id) {
            handleOpenCourse(selectedCourse._id);
          }
        }}
        onQuizCompleted={() => {
          if (selectedCourse?._id) {
            handleOpenCourse(selectedCourse._id);
          }
        }}
      />
    </div>
  );
};
