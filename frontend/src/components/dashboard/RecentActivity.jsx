import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Activity } from 'lucide-react';

export const RecentActivity = ({ activities = [] }) => {
  const hasActivities = activities && activities.length > 0;

  const formatRelativeTime = (act) => {
    const rawDate = act.timestamp || act.createdAt || act.updatedAt;
    if (!rawDate) {
      if (act.time && act.time !== 'Just now') return act.time;
      return 'Just now';
    }

    const now = new Date();
    const date = new Date(rawDate);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffInSeconds) || diffInSeconds < 0 || diffInSeconds < 30) {
      return 'Just now';
    }
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white rounded-[22px] p-6 sm:p-8 border border-[#9FB2AC] shadow-[0_2px_8px_-2px_rgba(93,13,26,0.06)]"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight">
          Recent Activity
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D0D1A] bg-[#FFF9EB] px-3 py-1 rounded-full border border-[#9FB2AC]">
          <Clock size={13} className="text-[#5D0D1A]" />
          Activity Log
        </span>
      </div>

      {hasActivities ? (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#9FB2AC]/70">
          {activities.map((act, index) => (
            <div key={index} className="relative flex items-start justify-between gap-4 group">
              {/* Timeline Dot */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shadow-2xs group-hover:bg-[#5D0D1A] group-hover:text-[#FFF9EB] transition-colors">
                <Activity size={11} />
              </div>

              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-[#5D0D1A] group-hover:text-[#7A1424] transition-colors">
                  {act.title}
                </h4>
                {act.desc ? <p className="text-xs text-[#5A6C66] font-medium leading-normal">{act.desc}</p> : null}
              </div>

              <span className="text-[11px] font-semibold text-[#5A6C66] shrink-0 whitespace-nowrap">
                {formatRelativeTime(act)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-10 text-center space-y-2.5 border border-dashed border-[#9FB2AC] rounded-2xl bg-[#FFF9EB]/60">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center mx-auto shadow-2xs">
            <Activity size={22} />
          </div>
          <h3 className="text-base font-bold text-[#5D0D1A]">No activity yet</h3>
          <p className="text-xs text-[#5A6C66] font-medium max-w-sm mx-auto leading-relaxed">
            Your career activities will appear here as you use CareerPilot AI.
          </p>
        </div>
      )}
    </motion.div>
  );
};
