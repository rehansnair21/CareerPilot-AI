import React, { useState } from 'react';
import { Bell, CheckCircle, ShieldCheck, UserPlus, Briefcase, Sparkles, Check } from 'lucide-react';

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      title: 'Default Admin Seed Initialized',
      desc: 'System admin account (admin@careerpilot.ai) successfully created in admins collection.',
      date: '2026-08-17 09:10 AM',
      read: false,
      type: 'system',
    },
    {
      id: 'notif_2',
      title: 'New Recruiter Registration',
      desc: 'Recruiter company "Wipro HR Lead" registered a new employer account.',
      date: '2026-08-16 04:20 PM',
      read: false,
      type: 'user',
    },
    {
      id: 'notif_3',
      title: 'New Job Opening Posted',
      desc: 'New job posting "Senior Frontend Developer" submitted for approval.',
      date: '2026-08-15 11:30 AM',
      read: true,
      type: 'job',
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight flex items-center gap-2">
            <Bell size={22} className="text-[#5D0D1A]" />
            Admin System Notifications
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Real-time security alerts, registration events, database updates, and platform telemetry notices.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] hover:bg-[#F7EED8] text-xs font-extrabold border border-[#9FB2AC] transition-all shrink-0"
        >
          <Check size={14} />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Notifications Cards List */}
      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-[18px] border transition-all flex items-start justify-between gap-4 ${
              !n.read
                ? 'bg-white border-[#5D0D1A]/50 shadow-xs'
                : 'bg-[#FFF9EB]/60 border-[#9FB2AC]/70'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border border-[#9FB2AC] ${
                  !n.read ? 'bg-[#FFF9EB] text-[#5D0D1A]' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {n.type === 'system' ? (
                  <ShieldCheck size={20} />
                ) : n.type === 'user' ? (
                  <UserPlus size={20} />
                ) : (
                  <Briefcase size={20} />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-extrabold text-[#5D0D1A]">{n.title}</h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#5D0D1A] shrink-0" title="Unread" />
                  )}
                </div>
                <p className="text-xs text-[#5A6C66] leading-relaxed font-medium">{n.desc}</p>
                <span className="text-[10px] text-[#5A6C66] font-mono block pt-1">{n.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNotifications;
