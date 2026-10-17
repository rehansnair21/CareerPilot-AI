import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export const WelcomeCard = ({ data, onNavigate }) => {
  const { user } = useAuth();

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good morning', emoji: '🌅' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good afternoon', emoji: '☀️' };
    } else if (hour >= 17 && hour < 22) {
      return { text: 'Good evening', emoji: '🌆' };
    } else {
      return { text: 'Good night', emoji: '🌙' };
    }
  };

  const greeting = getGreeting();
  const studentName = user?.name || user?.fullName || 'Student';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#420912] via-[#5D0D1A] to-[#7A1424] p-8 sm:p-10 text-[#FFF9EB] shadow-2xl shadow-[#5D0D1A]/40 border border-[#9FB2AC]/40"
    >
      {/* Ambient Background Glow Spheres */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#9FB2AC]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#7A1424]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#FFF9EB]">
            <Calendar size={13} className="text-[#9FB2AC]" />
            <span>{getFormattedDate()}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#FFF9EB] leading-tight">
              {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF9EB] via-[#F2E4C9] to-[#9FB2AC]">{studentName}</span> {greeting.emoji}
            </h1>
            <p className="text-[#FFF9EB]/90 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
              Continue building your career with personalized AI guidance, tailored skill gap roadmaps, and automated assessment insights.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <button
              onClick={() => onNavigate && onNavigate(data?.hasCareerMatch ? 'roadmap' : 'recommendations')}
              className="inline-flex items-center gap-2 px-6 h-[50px] rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] hover:bg-[#F7EED8] text-sm font-extrabold shadow-lg shadow-[#420912]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{data?.hasCareerMatch ? 'Continue Your Journey' : 'Get Career Recommendations'}</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => onNavigate && onNavigate('profile')}
              className="inline-flex items-center gap-2 px-6 h-[50px] rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-[#FFF9EB] text-sm font-semibold border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <User size={16} />
              <span>View Profile</span>
            </button>
          </div>
        </div>

        {/* Right Content: Dynamic Floating AI Glass Cards */}
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
          <div className="w-full max-w-sm relative p-5 rounded-2xl bg-black/25 backdrop-blur-xl border border-[#9FB2AC]/40 shadow-2xl">
            {/* AI Status Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#2D060D]/80 border border-white/20 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#9FB2AC]/30 text-[#9FB2AC] flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#FFF9EB]">AI Co-pilot Active</div>
                  <div className="text-[10px] text-[#9FB2AC]">Career Match Engine</div>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Metric Badges */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9FB2AC]">Career Match</div>
                <div className="text-sm sm:text-base font-extrabold text-[#FFF9EB] mt-1">
                  {data?.hasCareerMatch ? data.careerMatch : 'Not Available'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9FB2AC]">Progress</div>
                <div className="text-sm sm:text-base font-extrabold text-[#FFF9EB] mt-1">
                  {data?.learningProgress || '0%'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9FB2AC]">Skills</div>
                <div className="text-sm sm:text-base font-extrabold text-[#FFF9EB] mt-1">
                  {data?.skillsDisplay || '0 / 0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
