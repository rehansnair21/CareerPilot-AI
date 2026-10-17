import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  MessageSquare,
  Bell,
  CheckCircle2,
  Clock,
  BookOpen,
  User,
  Send,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCheck,
  Mail,
  ArrowRight,
  CornerDownRight,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StudentMessages = ({ onNavigateToCourse }) => {
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' | 'notifications'
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [searchQuery, setSearchQuery] = useState('');

  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replying state
  const [replyingMessageId, setReplyingMessageId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [msgRes, notifRes] = await Promise.all([
        api.get('/student/messages'),
        api.get('/student/notifications'),
      ]);

      if (msgRes.data && msgRes.data.success) {
        setMessages(msgRes.data.data || []);
      }
      if (notifRes.data && notifRes.data.success) {
        setNotifications(notifRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching student messages/notifications:', err);
      setError(err.response?.data?.message || 'Unable to load mentor messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkMessageRead = async (messageId) => {
    try {
      await api.put(`/student/messages/${messageId}/read`);
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isRead: true, readAt: new Date() } : m))
      );
      // Notify other components via custom event to update badge
      window.dispatchEvent(new Event('unreadMessagesUpdated'));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await api.put(`/student/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      window.dispatchEvent(new Event('unreadMessagesUpdated'));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.put('/student/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('unreadMessagesUpdated'));
      setToastMessage('All notifications marked as read');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const QUICK_REPLY_SUGGESTIONS = [
    'Thank you for the guidance! I will complete my pending lessons today.',
    'I am working on the lessons now and will finish them this week.',
    'I had some difficulty understanding the recent module topics, could you clarify?',
    'Thank you for the encouragement, I am continuing with the course!',
  ];

  const handleSendReply = async (messageId) => {
    if (!replyText.trim()) {
      setReplyError('Please write your reply message before sending');
      return;
    }

    setSendingReply(true);
    setReplyError(null);

    try {
      const res = await api.post(`/student/messages/${messageId}/reply`, {
        body: replyText.trim(),
      });

      if (res.data && res.data.success) {
        setToastMessage('Reply sent to mentor successfully!');
        setReplyText('');
        setReplyingMessageId(null);
        setTimeout(() => setToastMessage(null), 3500);

        // Append the new reply message locally and re-sync
        const newReply = res.data.data;
        setMessages((prev) => [...prev, newReply]);
        window.dispatchEvent(new Event('unreadMessagesUpdated'));
        fetchData();
      } else {
        setReplyError(res.data?.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error replying to mentor:', err);
      setReplyError(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'MP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const isRealProfileImage = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
  };

  // Group messages: top-level mentor messages
  const rootMessages = messages.filter((m) => !m.parentMessageId);

  // Filter messages
  const filteredMessages = rootMessages.filter((msg) => {
    const mentorName = (msg.mentorInfo?.name || msg.senderId?.fullName || '').toLowerCase();
    const courseTitle = (msg.courseId?.title || '').toLowerCase();
    const subjectText = (msg.subject || '').toLowerCase();
    const bodyText = (msg.body || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      mentorName.includes(q) ||
      courseTitle.includes(q) ||
      subjectText.includes(q) ||
      bodyText.includes(q);

    let matchesStatus = true;
    if (filter === 'unread') {
      matchesStatus = !msg.isRead;
    } else if (filter === 'read') {
      matchesStatus = msg.isRead;
    }

    return matchesSearch && matchesStatus;
  });

  const unreadMessagesCount = messages.filter((m) => !m.isRead && m.messageType !== 'student_reply').length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] rounded-[28px] p-6 md:p-8 text-[#FFF9EB] shadow-xl relative overflow-hidden border border-[#5D0D1A]">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#FFF9EB]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF9EB]/15 text-[#FFF9EB] text-xs font-extrabold border border-[#FFF9EB]/20">
            <Sparkles size={14} className="text-[#FFF9EB]" />
            <span>Mentor Guidance & Interventions</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Mentor Messages & Updates
          </h1>
          <p className="text-[#FFF9EB]/80 text-xs md:text-sm font-medium leading-relaxed">
            Read personalized advice, check-ins, and study recommendations from your course mentors, and reply directly to get one-on-one guidance.
          </p>
        </div>
      </div>

      {/* Navigation Tabs (Messages vs Notifications) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#9FB2AC] shadow-xs">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition-all ${
              activeTab === 'messages'
                ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-md shadow-[#5D0D1A]/10'
                : 'text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB]'
            }`}
          >
            <MessageSquare size={15} />
            <span>Mentor Messages</span>
            {unreadMessagesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition-all ${
              activeTab === 'notifications'
                ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-md shadow-[#5D0D1A]/10'
                : 'text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB]'
            }`}
          >
            <Bell size={15} />
            <span>Notifications</span>
            {unreadNotifsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter / Actions Bar */}
        {activeTab === 'messages' ? (
          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#9FB2AC] bg-white text-xs font-medium text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]"
              />
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#9FB2AC]">
              {['all', 'unread', 'read'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                    filter === f
                      ? 'bg-[#5D0D1A] text-[#FFF9EB]'
                      : 'text-[#5A6C66] hover:text-[#5D0D1A]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        ) : (
          unreadNotifsCount > 0 && (
            <button
              onClick={handleMarkAllNotificationsRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#9FB2AC] text-[#5D0D1A] text-xs font-extrabold hover:bg-[#FFF9EB] transition-colors"
            >
              <CheckCheck size={15} />
              <span>Mark All as Read</span>
            </button>
          )
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#9FB2AC] space-y-3">
          <div className="w-9 h-9 border-3 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#5D0D1A]">Loading mentor communications...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#9FB2AC] space-y-3 max-w-md mx-auto">
          <AlertCircle size={28} className="text-rose-600 mx-auto" />
          <h3 className="text-base font-extrabold text-[#5D0D1A]">Unable to load communications</h3>
          <p className="text-xs text-[#5A6C66]">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold"
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      ) : activeTab === 'messages' ? (
        /* MESSAGES LIST */
        filteredMessages.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center border border-[#9FB2AC] space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center mx-auto shadow-2xs">
              <Mail size={26} />
            </div>
            <h3 className="text-base font-black text-[#5D0D1A]">No messages from mentors yet.</h3>
            <p className="text-xs text-[#5A6C66] max-w-md mx-auto font-medium leading-relaxed">
              When your course mentor notices you need guidance, pacing assistance, or encouragement, their personalized messages will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => {
              // Find thread replies and sort chronologically
              const replies = messages
                .filter((m) => {
                  const pId = m.parentMessageId?._id || m.parentMessageId;
                  return pId && pId.toString() === msg._id.toString();
                })
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

              return (
                <div
                  key={msg._id}
                  className={`bg-white rounded-[24px] border transition-all p-5 md:p-6 space-y-4 ${
                    !msg.isRead
                      ? 'border-[#5D0D1A] shadow-md shadow-[#5D0D1A]/5 ring-1 ring-[#5D0D1A]/10 bg-gradient-to-br from-white to-[#FFF9EB]/30'
                      : 'border-[#9FB2AC] shadow-xs hover:border-[#5D0D1A]/50'
                  }`}
                >
                  {/* Top Bar: Mentor Info & Associated Course */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#9FB2AC]/40 pb-4">
                    <div className="flex items-center gap-3">
                      {isRealProfileImage(msg.mentorInfo?.profilePhoto) ? (
                        <img
                          src={msg.mentorInfo.profilePhoto}
                          alt={msg.mentorInfo.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-[#9FB2AC] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {getInitials(msg.mentorInfo?.name)}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-[#5D0D1A]">
                            {msg.mentorInfo?.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]">
                            {msg.mentorInfo?.title || 'Course Mentor'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5A6C66] font-medium">
                          Sent on {formatDate(msg.createdAt)} ({formatTimeAgo(msg.createdAt)})
                        </p>
                      </div>
                    </div>

                    {/* Associated Course Badge & Quick Link */}
                    {msg.courseId && (
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => onNavigateToCourse && onNavigateToCourse(msg.courseId._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF9EB] hover:bg-[#5D0D1A] text-[#5D0D1A] hover:text-[#FFF9EB] border border-[#5D0D1A] text-xs font-bold transition-all group"
                          title="Open course learning view"
                        >
                          <BookOpen size={13} />
                          <span className="truncate max-w-[150px]">{msg.courseId.title}</span>
                          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        {!msg.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="Unread message" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Subject & Body */}
                  <div className="space-y-2">
                    <h4 className="text-sm md:text-base font-black text-[#2D060D]">
                      {msg.subject}
                    </h4>

                    <div className="p-4 rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/50 text-xs md:text-sm font-medium text-[#2D060D] leading-relaxed whitespace-pre-wrap">
                      {msg.body}
                    </div>
                  </div>

                  {/* Thread Replies (if any) */}
                  {replies.length > 0 && (
                    <div className="space-y-2.5 pl-4 sm:pl-8 border-l-2 border-[#5D0D1A]/50 my-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#5D0D1A] block">
                        Thread Conversation ({replies.length})
                      </span>

                      {replies.map((rep) => (
                        <div
                          key={rep._id}
                          className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200 text-xs space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[11px] font-black text-blue-900">
                            <span className="flex items-center gap-1.5">
                              <CornerDownRight size={13} className="text-blue-700" />
                              <span>Your Reply to {msg.mentorInfo?.name || 'Mentor'}</span>
                            </span>
                            <span className="text-[10px] text-blue-700 font-medium">
                              {formatDate(rep.createdAt)} ({formatTimeAgo(rep.createdAt)})
                            </span>
                          </div>
                          <p className="text-blue-950 font-medium leading-relaxed whitespace-pre-wrap">
                            {rep.body}
                          </p>
                          <div className="pt-1 flex items-center justify-end text-[10px] font-bold text-blue-700">
                            <span>{rep.isRead ? '✓ Read by Mentor' : 'Delivered to Mentor'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Composer Area (Inline) */}
                  {replyingMessageId === msg._id && (
                    <div className="p-4 rounded-2xl bg-white border-2 border-[#5D0D1A] space-y-3 animate-fadeIn shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                          <Send size={13} />
                          <span>Reply to {msg.mentorInfo?.name}</span>
                        </span>
                        <button
                          onClick={() => {
                            setReplyingMessageId(null);
                            setReplyError(null);
                          }}
                          className="text-[#5A6C66] hover:text-[#5D0D1A] text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Quick Suggestions Chips */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-[#5A6C66] uppercase tracking-wider block">
                          Quick Response Suggestions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_REPLY_SUGGESTIONS.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setReplyText(suggestion)}
                              className="px-2.5 py-1 rounded-lg bg-[#FFF9EB] hover:bg-[#5D0D1A] text-[#5D0D1A] hover:text-[#FFF9EB] border border-[#9FB2AC]/70 text-[11px] font-semibold transition-all text-left shadow-2xs"
                            >
                              "{suggestion}"
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            handleSendReply(msg._id);
                          }
                        }}
                        placeholder="Write your response, questions, or clarification here... (Ctrl+Enter to send)"
                        rows={3}
                        className="w-full p-3.5 rounded-xl border border-[#9FB2AC] text-xs font-medium text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A] resize-none leading-relaxed"
                      />

                      {replyError && (
                        <p className="text-xs text-rose-600 font-bold">{replyError}</p>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-[#5A6C66] italic">
                          Tip: Press <strong>Ctrl + Enter</strong> to send
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReplyingMessageId(null)}
                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#5A6C66] text-xs font-bold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendReply(msg._id)}
                            disabled={sendingReply}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-md transition-all disabled:opacity-50"
                          >
                            {sendingReply ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send size={13} />
                                <span>Send Reply</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#9FB2AC]/30 text-xs">
                    <div className="flex items-center gap-2">
                      {!msg.isRead ? (
                        <button
                          onClick={() => handleMarkMessageRead(msg._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#5A6C66] text-xs font-bold transition-colors"
                        >
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Mark as Read</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                          <CheckCircle2 size={13} />
                          <span>Read</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {replyingMessageId !== msg._id && (
                        <button
                          onClick={() => {
                            setReplyingMessageId(msg._id);
                            setReplyText('');
                            setReplyError(null);
                            if (!msg.isRead) {
                              handleMarkMessageRead(msg._id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-xs transition-all hover:scale-[1.02]"
                        >
                          <Send size={13} />
                          <span>{replies.length > 0 ? 'Reply Again' : 'Reply to Mentor'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* NOTIFICATIONS LIST */
        notifications.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center border border-[#9FB2AC] space-y-3">
            <Bell size={32} className="text-[#5A6C66] mx-auto opacity-40" />
            <h3 className="text-base font-black text-[#5D0D1A]">No notifications yet.</h3>
            <p className="text-xs text-[#5A6C66] max-w-sm mx-auto font-medium">
              You will receive real-time notifications here when mentors send intervention messages or course updates.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-[#9FB2AC] divide-y divide-[#9FB2AC]/40 shadow-xs overflow-hidden">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.isRead) {
                    handleMarkNotificationRead(notif._id);
                  }
                  if (notif.relatedMessageId) {
                    setActiveTab('messages');
                  }
                }}
                className={`p-4 md:p-5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                  !notif.isRead ? 'bg-[#FFF9EB]/70 hover:bg-[#FFF9EB]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      !notif.isRead
                        ? 'bg-[#5D0D1A] text-[#FFF9EB]'
                        : 'bg-gray-100 text-[#5A6C66]'
                    }`}
                  >
                    <Bell size={16} />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs md:text-sm font-black text-[#2D060D] truncate">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-[#5A6C66]/80 font-mono block">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>

                <ChevronRight size={16} className="text-[#9FB2AC] shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default StudentMessages;
