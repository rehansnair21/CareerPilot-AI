import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  MessageSquare,
  Search,
  Send,
  User,
  BookOpen,
  CornerDownRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Mail,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MentorMessagesView = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'replies'

  // Reply state
  const [replyingMessageId, setReplyingMessageId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/messages');
      if (res.data && res.data.success) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching mentor messages:', err);
      setError(err.response?.data?.message || 'Unable to load student conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.put(`/mentor/messages/${messageId}/read`);
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isRead: true, readAt: new Date() } : m))
      );
      window.dispatchEvent(new Event('unreadMessagesUpdated'));
    } catch (err) {
      console.error('Error marking message read:', err);
    }
  };

  const handleSendFollowUp = async (rootMsg) => {
    if (!replyText.trim()) {
      setReplyError('Please write your reply message before sending');
      return;
    }

    setSendingReply(true);
    setReplyError(null);

    try {
      const studentId = rootMsg.student?._id || rootMsg.recipientId?._id || rootMsg.recipientId;
      const courseId = rootMsg.courseId?._id || rootMsg.courseId;

      const res = await api.post('/mentor/messages', {
        studentId,
        courseId,
        subject: rootMsg.subject.startsWith('Re:') ? rootMsg.subject : `Re: ${rootMsg.subject}`,
        body: replyText.trim(),
        templateKey: 'custom',
        parentMessageId: rootMsg._id,
      });

      if (res.data && res.data.success) {
        setToastMessage('Reply sent to student successfully!');
        setReplyText('');
        setReplyingMessageId(null);
        setTimeout(() => setToastMessage(null), 3500);

        // Re-sync messages list
        fetchMessages();
        window.dispatchEvent(new Event('unreadMessagesUpdated'));
      } else {
        setReplyError(res.data?.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error replying to student:', err);
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

  // Group root messages (top-level interventions)
  const rootMessages = messages.filter((m) => !m.parentMessageId);

  // Filter root messages
  const filteredThreads = rootMessages.filter((msg) => {
    const studentName = (msg.student?.name || msg.recipientId?.fullName || '').toLowerCase();
    const courseTitle = (msg.courseId?.title || '').toLowerCase();
    const subject = (msg.subject || '').toLowerCase();
    const body = (msg.body || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      studentName.includes(q) ||
      courseTitle.includes(q) ||
      subject.includes(q) ||
      body.includes(q);

    // Find student replies in this thread
    const threadReplies = messages.filter(
      (m) =>
        (m.parentMessageId?._id || m.parentMessageId)?.toString() === msg._id.toString() &&
        m.messageType === 'student_reply'
    );

    let matchesFilter = true;
    if (filter === 'unread') {
      matchesFilter = threadReplies.some((r) => !r.isRead);
    } else if (filter === 'replies') {
      matchesFilter = threadReplies.length > 0;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Alert */}
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
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF9EB]/15 text-[#FFF9EB] text-xs font-extrabold border border-[#FFF9EB]/20">
            <MessageSquare size={14} className="text-[#FFF9EB]" />
            <span>Student Communications Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Intervention Messages & Student Replies
          </h1>
          <p className="text-[#FFF9EB]/80 text-xs md:text-sm font-medium leading-relaxed">
            Track all guidance messages sent to your enrolled students, view their real-time responses, and reply back to keep learners on track.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, course title, or subject..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#9FB2AC] bg-white text-xs font-medium text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]"
          />
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#9FB2AC]">
          {[
            { id: 'all', label: 'All Conversations' },
            { id: 'replies', label: 'With Student Replies' },
            { id: 'unread', label: 'Unread Replies' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === item.id
                  ? 'bg-[#5D0D1A] text-[#FFF9EB]'
                  : 'text-[#5A6C66] hover:text-[#5D0D1A]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content List */}
      {loading ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#9FB2AC] space-y-3">
          <div className="w-9 h-9 border-3 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#5D0D1A]">Loading student conversations...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#9FB2AC] space-y-3 max-w-md mx-auto">
          <AlertCircle size={28} className="text-rose-600 mx-auto" />
          <h3 className="text-base font-extrabold text-[#5D0D1A]">Unable to load messages</h3>
          <p className="text-xs text-[#5A6C66]">{error}</p>
          <button
            onClick={fetchMessages}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold"
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#9FB2AC] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center mx-auto shadow-2xs">
            <Mail size={26} />
          </div>
          <h3 className="text-base font-black text-[#5D0D1A]">No messages match your criteria</h3>
          <p className="text-xs text-[#5A6C66] max-w-md mx-auto font-medium">
            When you send intervention messages from the Student Progress page, conversations and student replies will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((rootMsg) => {
            // Find replies in this thread
            const threadReplies = messages
              .filter((m) => {
                const pId = m.parentMessageId?._id || m.parentMessageId;
                return pId && pId.toString() === rootMsg._id.toString();
              })
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            const hasUnreadReply = threadReplies.some(
              (r) => r.messageType === 'student_reply' && !r.isRead
            );

            return (
              <div
                key={rootMsg._id}
                className={`bg-white rounded-[24px] border p-5 md:p-6 space-y-4 transition-all ${
                  hasUnreadReply
                    ? 'border-[#5D0D1A] ring-2 ring-[#5D0D1A]/10 shadow-md bg-gradient-to-br from-white to-[#FFF9EB]/20'
                    : 'border-[#9FB2AC] shadow-xs'
                }`}
              >
                {/* Header: Student & Course */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#9FB2AC]/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#5D0D1A] text-[#FFF9EB] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {rootMsg.student?.profilePhoto ? (
                        <img
                          src={rootMsg.student.profilePhoto}
                          alt={rootMsg.student?.name}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        (rootMsg.student?.name || 'ST').substring(0, 2).toUpperCase()
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-[#5D0D1A]">
                          {rootMsg.student?.name || 'Enrolled Student'}
                        </h3>
                        <span className="text-[11px] text-[#5A6C66] font-mono">
                          ({rootMsg.student?.email})
                        </span>
                        {hasUnreadReply && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                            New Reply
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5A6C66] font-medium">
                        Started on {formatDate(rootMsg.createdAt)} ({formatTimeAgo(rootMsg.createdAt)})
                      </p>
                    </div>
                  </div>

                  {rootMsg.courseId && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#5D0D1A] text-xs font-bold">
                      <BookOpen size={13} />
                      <span className="truncate max-w-[180px]">{rootMsg.courseId.title}</span>
                    </div>
                  )}
                </div>

                {/* Original Mentor Message */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-[#2D060D] flex items-center gap-2">
                    <span>{rootMsg.subject}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      Your Initial Message
                    </span>
                  </h4>

                  <div className="p-4 rounded-2xl bg-[#FFF9EB]/50 border border-[#9FB2AC]/50 text-xs font-medium text-[#2D060D] leading-relaxed whitespace-pre-wrap">
                    {rootMsg.body}
                  </div>
                </div>

                {/* Thread History / Student Replies */}
                {threadReplies.length > 0 && (
                  <div className="space-y-3 pl-4 sm:pl-8 border-l-2 border-[#5D0D1A]/50 my-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5D0D1A] block">
                      Student Replies & Thread ({threadReplies.length})
                    </span>

                    {threadReplies.map((rep) => {
                      const isStudent = rep.messageType === 'student_reply';

                      return (
                        <div
                          key={rep._id}
                          className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                            isStudent
                              ? 'bg-blue-50/80 border-blue-200'
                              : 'bg-emerald-50/70 border-emerald-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-black text-[11px]">
                            <span
                              className={`flex items-center gap-1.5 ${
                                isStudent ? 'text-blue-900' : 'text-emerald-900'
                              }`}
                            >
                              <CornerDownRight size={13} />
                              <span>{isStudent ? `Reply from ${rootMsg.student?.name || 'Student'}` : 'Your Follow-Up'}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-600 font-normal">
                                {formatTimeAgo(rep.createdAt)}
                              </span>
                              {isStudent && !rep.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(rep._id)}
                                  className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700"
                                >
                                  Mark as Read
                                </button>
                              )}
                            </div>
                          </div>

                          <p
                            className={`font-medium leading-relaxed whitespace-pre-wrap ${
                              isStudent ? 'text-blue-950' : 'text-emerald-950'
                            }`}
                          >
                            {rep.body}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Composer to Respond to Student */}
                {replyingMessageId === rootMsg._id && (
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#5D0D1A] space-y-3 animate-fadeIn shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                        <Send size={13} />
                        <span>Respond to {rootMsg.student?.name || 'Student'}</span>
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

                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your advice or answer to the student's reply..."
                      rows={3}
                      className="w-full p-3.5 rounded-xl border border-[#9FB2AC] text-xs font-medium text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A] resize-none leading-relaxed"
                    />

                    {replyError && (
                      <p className="text-xs text-rose-600 font-bold">{replyError}</p>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReplyingMessageId(null)}
                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#5A6C66] text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendFollowUp(rootMsg)}
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
                            <span>Send Response</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div className="flex items-center justify-end pt-2 border-t border-[#9FB2AC]/30">
                  {replyingMessageId !== rootMsg._id && (
                    <button
                      onClick={() => {
                        setReplyingMessageId(rootMsg._id);
                        setReplyText('');
                        setReplyError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-xs transition-all hover:scale-[1.02]"
                    >
                      <Send size={13} />
                      <span>{threadReplies.length > 0 ? 'Respond to Student' : 'Send Follow-up'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MentorMessagesView;
