import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Send,
  X,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Clock,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MentorMessageModal = ({
  isOpen,
  onClose,
  student,
  course,
  defaultTemplateKey = null,
  onMessageSent,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateKey || 'custom');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const studentName = student?.name || student?.fullName || 'Student';
  const courseTitle = course?.title || 'Course';

  // Templates definition according to requirements
  const templates = [
    {
      key: 'low_progress',
      title: 'Low Progress Alert',
      icon: AlertTriangle,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      subject: `Support & Guidance for ${courseTitle}`,
      body: `Hi ${studentName}, I noticed that your progress in ${courseTitle} has been slower than expected. Please try to complete your pending lessons regularly. If you are facing any difficulties, feel free to contact me. I am happy to help you.`,
    },
    {
      key: 'inactive',
      title: 'Inactive Student Check-in',
      icon: Clock,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      subject: `Checking in on your progress in ${courseTitle}`,
      body: `Hi ${studentName}, I noticed that you have not made progress in ${courseTitle} recently. Please let me know if you need any assistance or additional learning resources.`,
    },
    {
      key: 'encouragement',
      title: 'Encouragement & Motivation',
      icon: HeartHandshake,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      subject: `Great job on your learning progress in ${courseTitle}!`,
      body: `Hi ${studentName}, you are making progress in ${courseTitle}. Keep practising and completing your lessons. Let me know if you need any guidance.`,
    },
  ];

  // Apply default template when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);

      if (defaultTemplateKey) {
        const found = templates.find((t) => t.key === defaultTemplateKey);
        if (found) {
          setSelectedTemplate(found.key);
          setSubject(found.subject);
          setBody(found.body);
          return;
        }
      }

      // Default: Encouragement or custom
      setSelectedTemplate('low_progress');
      const def = templates[0];
      setSubject(def.subject);
      setBody(def.body);
    }
  }, [isOpen, defaultTemplateKey, studentName, courseTitle]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.key);
    setSubject(template.subject);
    setBody(template.body);
    setError(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a message subject');
      return;
    }
    if (!body.trim()) {
      setError('Please provide a message body');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await api.post('/mentor/messages', {
        studentId: student?._id,
        courseId: course?._id,
        subject: subject.trim(),
        body: body.trim(),
        templateKey: selectedTemplate,
      });

      if (res.data && res.data.success) {
        setSuccess(true);
        if (onMessageSent) {
          onMessageSent(res.data.data);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.data?.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Unable to connect to messaging service');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#2D060D]/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-[26px] border border-[#9FB2AC] shadow-2xl overflow-hidden z-10 my-8 flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] p-6 text-[#FFF9EB] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF9EB]/15 border border-[#FFF9EB]/20 flex items-center justify-center">
                <MessageSquare size={20} className="text-[#FFF9EB]" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Send Intervention Message</h3>
                <p className="text-xs text-[#FFF9EB]/80 font-medium">
                  Direct guidance sent to student dashboard with real-time notification
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={sending}
              className="p-1.5 text-[#FFF9EB]/70 hover:text-[#FFF9EB] hover:bg-[#FFF9EB]/15 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSend} className="p-6 space-y-5 bg-white">
            {/* Student & Course Context Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FFF9EB]/70 border border-[#9FB2AC]/70 text-xs">
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-[#5D0D1A] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-[#5A6C66] block">Recipient Student</span>
                  <p className="font-extrabold text-[#5D0D1A] truncate">{studentName}</p>
                  <p className="text-[11px] text-[#5A6C66] truncate font-mono">{student?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-[#5D0D1A] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-[#5A6C66] block">Associated Course</span>
                  <p className="font-extrabold text-[#5D0D1A] truncate">{courseTitle}</p>
                  <p className="text-[11px] text-[#5A6C66] truncate">{course?.category || 'Development'}</p>
                </div>
              </div>
            </div>

            {/* Predefined Templates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#5D0D1A]" />
                  <span>Choose Message Template (Optional)</span>
                </label>
                <span className="text-[11px] text-[#5A6C66] font-medium">Click to pre-fill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {templates.map((tpl) => {
                  const Icon = tpl.icon;
                  const isSelected = selectedTemplate === tpl.key;
                  return (
                    <button
                      key={tpl.key}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-md shadow-[#5D0D1A]/20 scale-[1.02]'
                          : 'bg-white hover:bg-[#FFF9EB] text-[#2D060D] border-[#9FB2AC]/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon size={16} className={isSelected ? 'text-[#FFF9EB]' : 'text-[#5D0D1A]'} />
                        {isSelected && <span className="text-[10px] font-bold">Selected</span>}
                      </div>
                      <span className="text-xs font-extrabold line-clamp-1">{tpl.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5D0D1A] uppercase tracking-wider block">
                Message Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Checking in on your course progress..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#9FB2AC] bg-white text-xs font-bold text-[#2D060D] placeholder-[#5A6C66] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A] transition-all"
                required
              />
            </div>

            {/* Body Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#5D0D1A] uppercase tracking-wider block">
                  Personalized Message Body <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-[#5A6C66] font-medium">Fully editable</span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Write your personalized advice, guidance, or encouragement here..."
                className="w-full px-4 py-3 rounded-xl border border-[#9FB2AC] bg-white text-xs font-medium text-[#2D060D] placeholder-[#5A6C66] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A] transition-all resize-none leading-relaxed"
                required
              />
            </div>

            {/* Feedback Banners */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>Message sent and student notified successfully!</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#9FB2AC]/40">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#5A6C66] text-xs font-extrabold transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={sending || success}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#FFF9EB] border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MentorMessageModal;
