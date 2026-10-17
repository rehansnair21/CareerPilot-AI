import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  Send,
  BookOpen,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const StudentMentorInterventionsCard = ({ onNavigate }) => {
  const [latestMessage, setLatestMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLatestMessage = async () => {
    try {
      const res = await api.get('/student/messages');
      if (res.data && res.data.success && res.data.data) {
        const msgs = res.data.data || [];
        // Root messages from mentor
        const rootMsgs = msgs.filter((m) => !m.parentMessageId);
        if (rootMsgs.length > 0) {
          setLatestMessage(rootMsgs[0]);
        }
        const unread = msgs.filter((m) => !m.isRead && m.messageType !== 'student_reply').length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // Quiet fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestMessage();
    const handleUpdate = () => fetchLatestMessage();
    window.addEventListener('unreadMessagesUpdated', handleUpdate);
    return () => window.removeEventListener('unreadMessagesUpdated', handleUpdate);
  }, []);

  if (loading || !latestMessage) {
    return null;
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
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

  const mentorName = latestMessage.mentorInfo?.name || 'Your Course Mentor';
  const mentorTitle = latestMessage.mentorInfo?.title || 'Course Mentor';
  const courseTitle = latestMessage.courseId?.title || 'Your Enrolled Course';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-[24px] p-6 md:p-7 border border-[#9FB2AC] shadow-xs relative overflow-hidden space-y-4 hover:border-[#5D0D1A]/50 transition-all"
    >
      {/* Decorative top ambient bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#9FB2AC]/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
            {latestMessage.mentorInfo?.profilePhoto ? (
              <img
                src={latestMessage.mentorInfo.profilePhoto}
                alt={mentorName}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              mentorName.substring(0, 2).toUpperCase()
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black text-[#5D0D1A]">
                {mentorName}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]">
                {mentorTitle}
              </span>
              {!latestMessage.isRead && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  Unread Message
                </span>
              )}
            </div>
            <p className="text-xs text-[#5A6C66] font-medium">
              Sent {formatTimeAgo(latestMessage.createdAt)} regarding{' '}
              <strong className="text-[#2D060D]">{courseTitle}</strong>
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9EB] text-[#5D0D1A] text-xs font-bold border border-[#9FB2AC] self-start sm:self-auto">
          <Sparkles size={13} className="text-[#5D0D1A]" />
          <span>Mentor Check-In</span>
        </div>
      </div>

      {/* Message Excerpt */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-black text-[#2D060D]">
          {latestMessage.subject}
        </h4>
        <p className="text-xs md:text-sm text-[#5A6C66] line-clamp-2 leading-relaxed bg-[#FFF9EB]/40 p-3 rounded-xl border border-[#9FB2AC]/40 font-medium">
          "{latestMessage.body}"
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-[11px] text-[#5A6C66] font-medium flex items-center gap-1.5">
          <MessageSquare size={13} className="text-[#5D0D1A]" />
          <span>You can reply directly to your mentor for guidance & questions</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate && onNavigate('messages')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-black shadow-md transition-all hover:scale-[1.02]"
          >
            <Send size={13} />
            <span>Reply to Mentor</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentMentorInterventionsCard;
