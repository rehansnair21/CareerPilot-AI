import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle2,
  FileText,
  PieChart,
  User,
  Clock,
  Sparkles,
  AlertTriangle,
  Send,
  ChevronRight,
  ShieldAlert,
  MessageSquare,
  CornerDownRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import MentorMessageModal from './MentorMessageModal';

export const MentorOverview = ({ data, onNavigateTab }) => {
  const stats = data?.stats || { totalStudents: 0, activeCourses: 0, upcomingSessions: 0 };
  const studentProgress = data?.studentProgress || { avgProgress: 0, percentage: 0, guidedStudents: 0 };
  const activities = data?.activities || [];
  const upcomingSessionsList = data?.upcomingSessionsList || [];

  const [attentionStudents, setAttentionStudents] = useState([]);
  const [loadingAttention, setLoadingAttention] = useState(true);

  // Message modal state
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [activeMessageTarget, setActiveMessageTarget] = useState({
    student: null,
    course: null,
    defaultTemplateKey: 'custom',
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [recentReplies, setRecentReplies] = useState([]);

  useEffect(() => {
    api.get('/mentor/students-needing-attention')
      .then((res) => {
        if (res.data && res.data.success) {
          setAttentionStudents(res.data.data || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching attention students for overview:', err);
      })
      .finally(() => {
        setLoadingAttention(false);
      });

    api.get('/mentor/messages')
      .then((res) => {
        if (res.data && res.data.success) {
          const replies = (res.data.data || []).filter((m) => m.messageType === 'student_reply');
          setRecentReplies(replies.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenMessageComposer = (student, course, defaultTemplate = 'inactive') => {
    setActiveMessageTarget({
      student,
      course,
      defaultTemplateKey: defaultTemplate,
    });
    setMessageModalOpen(true);
  };

  const handleMessageSent = (newMessage) => {
    setToastMessage(`Intervention message sent successfully!`);
    setTimeout(() => setToastMessage(null), 3500);

    // Refresh attention list
    api.get('/mentor/students-needing-attention')
      .then((res) => {
        if (res.data && res.data.success) {
          setAttentionStudents(res.data.data || []);
        }
      })
      .catch(() => {});
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    {
      id: 'students',
      title: 'Enrolled Students',
      value: stats.enrolledStudentsCount || stats.totalStudents || 0,
      subtext: 'In your created courses',
      icon: Users,
      badge: 'Active Guidance',
      bgGradient: 'from-[#5D0D1A]/5 via-[#FFF9EB] to-white',
    },
    {
      id: 'attention',
      title: 'Needs Attention',
      value: attentionStudents.length,
      subtext: 'Students falling behind',
      icon: AlertTriangle,
      badge: 'Action Required',
      bgGradient: 'from-rose-500/10 via-[#FFF9EB] to-white',
      valueColor: 'text-rose-600',
    },
    {
      id: 'courses',
      title: 'Published Courses',
      value: stats.activeCourses || 0,
      subtext: 'Active learning pathways',
      icon: BookOpen,
      badge: 'Course Modules',
      bgGradient: 'from-[#7A1424]/5 via-[#FFF9EB] to-white',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#5D0D1A] text-[#FFF9EB] px-5 py-3 rounded-2xl shadow-xl border border-[#9FB2AC]/40 flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] p-8 md:p-10 text-[#FFF9EB] shadow-lg shadow-[#5D0D1A]/20 border border-[#9FB2AC]/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#9FB2AC]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF9EB]/15 text-[#FFF9EB] text-xs font-extrabold border border-[#FFF9EB]/20">
            <Sparkles size={14} className="text-[#FFF9EB]" />
            Mentor Overview Dashboard
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Mentor Workspace
          </h1>
          <p className="text-[#FFF9EB]/80 text-sm md:text-base font-medium leading-relaxed">
            Monitor real lesson completion progress, identify students who need assistance, and send targeted intervention messages.
          </p>
        </div>
      </div>

      {/* 1. STATISTICS CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#5D0D1A] tracking-tight">
            Mentorship Statistics
          </h2>
          <span className="text-xs text-[#5A6C66] font-semibold">Real-time MongoDB Data</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className={`relative overflow-hidden rounded-[22px] bg-gradient-to-br ${card.bgGradient} p-6 border border-[#9FB2AC] shadow-xs flex flex-col justify-between space-y-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC] shadow-2xs">
                    <Icon size={24} className={card.valueColor ? 'text-rose-600' : 'text-[#5D0D1A]'} />
                  </div>
                  <span className="text-[11px] font-extrabold text-[#5D0D1A] bg-[#FFF9EB] px-2.5 py-1 rounded-full border border-[#9FB2AC]">
                    {card.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#5A6C66] uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`text-3xl font-extrabold tracking-tight ${card.valueColor || 'text-[#5D0D1A]'}`}>
                    {card.value}
                  </div>
                  <p className="text-xs text-[#5A6C66] font-medium">{card.subtext}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* RECENT STUDENT REPLIES SECTION */}
      {recentReplies.length > 0 && (
        <section className="rounded-[22px] bg-white p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#9FB2AC]/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#5D0D1A]">Recent Student Replies</h3>
                <p className="text-xs text-[#5A6C66] font-medium">
                  Responses from enrolled students on your course intervention messages
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('messages')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D0D1A] hover:underline"
              >
                <span>View All Conversations</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReplies.map((reply) => (
              <div
                key={reply._id}
                className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-blue-950 text-sm truncate">
                        {reply.student?.name || 'Student'}
                      </h4>
                      <p className="text-[11px] text-[#5A6C66] truncate font-mono">
                        {reply.student?.email}
                      </p>
                    </div>
                    {!reply.isRead && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                        Unread
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-xl border border-blue-200 text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                      {reply.subject}
                    </span>
                    <p className="font-medium text-gray-800 line-clamp-3 leading-relaxed">
                      "{reply.body}"
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-blue-100 text-xs">
                  <span className="text-[11px] text-[#5A6C66] font-mono">
                    {formatTimeAgo(reply.createdAt)}
                  </span>
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('messages')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold transition-all shadow-xs"
                    >
                      <CornerDownRight size={12} />
                      <span>Reply Back</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. AUTOMATIC STUDENT ATTENTION INDICATORS SECTION (Requirement 6) */}
      <section className="rounded-[22px] bg-white p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#9FB2AC]/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#5D0D1A]">Students Requiring Attention</h3>
              <p className="text-xs text-[#5A6C66] font-medium">
                Automatic identification based on schedule delay, inactivity, or low quiz scores
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('progress')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D0D1A] hover:underline"
            >
              <span>View All Progress Table</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {loadingAttention ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#5A6C66]">Checking student learning schedules...</p>
          </div>
        ) : attentionStudents.length === 0 ? (
          <div className="p-8 text-center bg-[#FFF9EB]/40 rounded-2xl border border-[#9FB2AC]/50 space-y-2">
            <CheckCircle2 size={28} className="text-emerald-600 mx-auto" />
            <h4 className="text-sm font-extrabold text-[#5D0D1A]">No students currently require additional attention.</h4>
            <p className="text-xs text-[#5A6C66] max-w-md mx-auto">
              All enrolled students in your courses are currently maintaining appropriate learning progress relative to their schedule.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attentionStudents.map((item) => (
              <div
                key={item._id}
                className="p-5 rounded-2xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50/70 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-[#5D0D1A] text-sm truncate">
                        {item.studentName}
                      </h4>
                      <p className="text-[11px] text-[#5A6C66] font-mono truncate">
                        {item.studentEmail}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                      {item.progressStatus}
                    </span>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-xl border border-rose-200 text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                      Reason for Attention:
                    </span>
                    <p className="font-semibold text-rose-950 leading-snug">
                      {item.primaryReason || item.reasons?.[0]}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#5A6C66]">
                    <div>
                      <span className="text-[10px] text-[#5A6C66]/80 block">Course:</span>
                      <p className="font-bold text-[#2D060D] truncate">{item.courseTitle}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5A6C66]/80 block">Last Activity:</span>
                      <p className="font-bold text-[#5D0D1A]">{formatTimeAgo(item.lastActivity)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-[#5A6C66]">
                      <span>Progress</span>
                      <span>{item.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${item.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleOpenMessageComposer(
                      { _id: item.studentId, name: item.studentName, email: item.studentEmail },
                      { _id: item.courseId, title: item.courseTitle, category: item.courseCategory },
                      item.progressStatus === 'Low Progress' ? 'low_progress' : 'inactive'
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <Send size={13} />
                  <span>Send Message</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. STUDENT PROGRESS SECTION */}
      <section className="rounded-[22px] bg-white p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#9FB2AC]/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#5D0D1A]">Aggregated Student Progress</h3>
              <p className="text-xs text-[#5A6C66] font-medium">Cohort lesson completion and roadmap milestone rates</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#5D0D1A] bg-[#FFF9EB] px-3 py-1.5 rounded-full border border-[#9FB2AC]">
            {studentProgress.guidedStudents} Guided Students
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Progress Ring / Visual Indicator */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#FFF9EB]/60 rounded-2xl border border-[#9FB2AC]/70 text-center space-y-3">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#9FB2AC]/40"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#5D0D1A]"
                  strokeDasharray={`${studentProgress.percentage || 0}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-[#5D0D1A]">
                  {studentProgress.percentage}%
                </span>
                <span className="text-[10px] font-bold text-[#5A6C66] uppercase">Average</span>
              </div>
            </div>
            <p className="text-xs font-bold text-[#5D0D1A]">Overall Course Lesson Completion</p>
          </div>

          {/* Progress Breakdown Bars */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#5D0D1A]">Course Lesson Completion Rate</span>
                <span className="text-[#5A6C66]">{studentProgress.percentage}%</span>
              </div>
              <div className="h-3 w-full bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/60">
                <div
                  className="h-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] rounded-full transition-all duration-500"
                  style={{ width: `${studentProgress.percentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#5D0D1A]">Active Students Proportion</span>
                <span className="text-[#5A6C66]">{studentProgress.guidedStudents > 0 ? '75%' : '0%'}</span>
              </div>
              <div className="h-3 w-full bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/60">
                <div
                  className="h-full bg-gradient-to-r from-[#7A1424] to-[#9FB2AC] rounded-full transition-all duration-500"
                  style={{ width: `${studentProgress.guidedStudents > 0 ? 75 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#5D0D1A]">Intervention Coverage</span>
                <span className="text-[#5A6C66]">100%</span>
              </div>
              <div className="h-3 w-full bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/60">
                <div
                  className="h-full bg-[#5D0D1A] rounded-full transition-all duration-500"
                  style={{ width: `100%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RECENT ACTIVITY & UPCOMING SESSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT ACTIVITY (2 cols) */}
        <section className="lg:col-span-2 rounded-[22px] bg-white p-6 border border-[#9FB2AC] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#9FB2AC]/50 pb-4">
            <div className="flex items-center gap-2.5">
              <Activity size={18} className="text-[#5D0D1A]" />
              <h3 className="text-base font-extrabold text-[#5D0D1A]">Recent Student Activity</h3>
            </div>
            <span className="text-xs text-[#5A6C66] font-medium">Learning milestones</span>
          </div>

          {activities.length === 0 ? (
            <div className="p-8 text-center bg-[#FFF9EB]/40 rounded-xl border border-[#9FB2AC]/50 space-y-2">
              <p className="text-sm font-semibold text-[#5A6C66]">No recent student activity logged yet.</p>
              <p className="text-xs text-[#5A6C66]/80">Activities will populate as students complete roadmaps and lessons.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between p-3.5 bg-[#FFF9EB]/50 hover:bg-[#FFF9EB] rounded-xl border border-[#9FB2AC]/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC] shrink-0 mt-0.5">
                      {act.icon === 'FileText' ? (
                        <FileText size={16} />
                      ) : act.icon === 'PieChart' ? (
                        <PieChart size={16} />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#5D0D1A]">{act.description}</p>
                      <p className="text-[11px] font-semibold text-[#5A6C66]">Student: {act.studentName}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#5A6C66] bg-white px-2 py-1 rounded-md border border-[#9FB2AC]/60 shrink-0">
                    {act.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MENTOR GUIDANCE QUICK ACTIONS (1 col) */}
        <section className="rounded-[22px] bg-white p-6 border border-[#9FB2AC] shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#9FB2AC]/50 pb-4">
              <div className="flex items-center gap-2.5">
                <Clock size={18} className="text-[#5D0D1A]" />
                <h3 className="text-base font-extrabold text-[#5D0D1A]">Guidance Hub</h3>
              </div>
              <span className="text-xs text-[#5A6C66] font-medium">Quick Access</span>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onNavigateTab && onNavigateTab('progress')}
                className="w-full p-4 rounded-2xl bg-[#FFF9EB]/70 hover:bg-[#FFF9EB] border border-[#9FB2AC] text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-black text-[#5D0D1A] group-hover:underline">
                    Student Progress Dashboard
                  </h4>
                  <p className="text-[11px] text-[#5A6C66]">
                    View real completion % and send intervention notes
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#5D0D1A] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab('courses')}
                className="w-full p-4 rounded-2xl bg-[#FFF9EB]/70 hover:bg-[#FFF9EB] border border-[#9FB2AC] text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-black text-[#5D0D1A] group-hover:underline">
                    Manage Course Materials
                  </h4>
                  <p className="text-[11px] text-[#5A6C66]">
                    Create modules, text lessons, PDFs, and quizzes
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#5D0D1A] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="pt-2 text-center border-t border-[#9FB2AC]/40">
            <span className="text-[11px] text-[#5A6C66] font-semibold">
              CareerPilot AI Mentorship System
            </span>
          </div>
        </section>
      </div>

      {/* Message Modal */}
      <MentorMessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        student={activeMessageTarget.student}
        course={activeMessageTarget.course}
        defaultTemplateKey={activeMessageTarget.defaultTemplateKey}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
};

export default MentorOverview;
