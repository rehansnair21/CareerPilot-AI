import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Code2 } from 'lucide-react';

export const CareerGoalCard = ({ data, onNavigate }) => {
  const hasMatch = Boolean(data?.hasCareerMatch);
  const matchTitle = data?.careerMatchTitle || 'No career recommendation yet';
  const matchScore = data?.careerMatch || '0%';
  const skills = data?.careerMatchSkills || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="relative overflow-hidden bg-white rounded-[22px] p-6 sm:p-8 border border-[#9FB2AC] shadow-[0_2px_8px_-2px_rgba(93,13,26,0.06)] hover:shadow-lg hover:shadow-[#5D0D1A]/10 hover:border-[#5D0D1A] transition-all duration-300"
    >
      {/* Subtle background accent blur */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#FFF9EB] rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Side Details */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#5D0D1A]">
              AI Career Recommendation
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">
                {matchTitle}
              </h2>
              {hasMatch ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
                  <Sparkles size={13} className="text-emerald-700" />
                  {matchScore} Match
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-bold">
                  Not Available
                </span>
              )}
            </div>
            <p className="text-[#5A6C66] text-sm font-medium leading-relaxed">
              {hasMatch
                ? 'Based on your skills, interests and assessment performance.'
                : 'Complete your profile and assessment to receive personalized career recommendations.'}
            </p>
          </div>

          {/* Skill Pills */}
          {skills.length > 0 ? (
            <div>
              <span className="text-xs font-semibold text-[#5A6C66] block mb-2">Recommended Skills:</span>
              <div className="flex flex-wrap gap-2">
                {skills.map((skillName) => (
                  <span
                    key={skillName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] text-xs font-bold border border-[#9FB2AC]"
                  >
                    <Code2 size={14} className="text-[#5D0D1A]" />
                    {skillName}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Side Action Button */}
        <div className="w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
          <button
            onClick={() => onNavigate && onNavigate(hasMatch ? 'recommendations' : 'profile')}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] font-extrabold text-sm shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{hasMatch ? 'View Recommendation' : 'Complete Profile'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
