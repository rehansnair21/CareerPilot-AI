import React from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck,
  FileCheck,
  Award,
  Target,
  TrendingUp,
  Briefcase,
} from 'lucide-react';

export const StatsCards = ({ data }) => {
  const cards = [
    {
      id: 'profile_completion',
      label: 'Profile Completion',
      value: `${data?.profileCompletion || 0}%`,
      numericValue: data?.profileCompletion || 0,
      subtext: (data?.profileCompletion || 0) > 0 ? `${data.profileCompletion}% profile filled` : 'Fill optional profile details to reach 100%',
      icon: UserCheck,
      hasProgress: true,
    },
    {
      id: 'resume_score',
      label: 'Resume Score',
      value: data?.hasUploadedResume ? data.resumeScore : '0',
      numericValue: data?.hasUploadedResume ? parseInt(data.resumeScore) || 0 : 0,
      subtext: data?.resumeStatus || 'Resume Not Uploaded',
      icon: FileCheck,
      hasProgress: data?.hasUploadedResume,
    },
    {
      id: 'assessment_score',
      label: 'Assessment Score',
      value: data?.hasCompletedAssessment ? data.assessmentScore : '0',
      numericValue: data?.hasCompletedAssessment ? parseInt(data.assessmentScore) || 0 : 0,
      subtext: data?.assessmentStatus || 'Assessment Not Attempted',
      icon: Award,
      hasProgress: false,
    },
    {
      id: 'career_match',
      label: 'Career Match',
      value: data?.hasCareerMatch ? data.careerMatch : '0%',
      numericValue: data?.hasCareerMatch ? parseInt(data.careerMatch) || 0 : 0,
      subtext: data?.careerMatchStatus || 'Not Available',
      icon: Target,
      hasProgress: false,
    },
    {
      id: 'learning_progress',
      label: 'Learning Progress',
      value: data?.learningProgress || '0%',
      numericValue: data?.learningProgressValue || 0,
      subtext: data?.learningProgressStatus || 'No Learning Progress Yet',
      icon: TrendingUp,
      hasProgress: (data?.learningProgressValue || 0) > 0,
    },
    {
      id: 'projects_completed',
      label: 'Projects Completed',
      value: `${data?.projectsCompleted || 0}`,
      numericValue: data?.projectsCompleted || 0,
      subtext: (data?.projectsCompleted || 0) > 0 ? `${data.projectsCompleted} projects verified` : 'No projects completed yet',
      icon: Briefcase,
      hasProgress: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-[0_2px_8px_-2px_rgba(93,13,26,0.06)] hover:shadow-lg hover:shadow-[#5D0D1A]/10 hover:border-[#5D0D1A] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center transition-transform group-hover:scale-105">
                  <Icon size={20} />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5D0D1A]">
                  {card.label}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-extrabold text-[#2D060D] tracking-tight">
                  {card.value}
                </span>
              </div>

              <p className="text-xs text-[#5A6C66] font-medium leading-normal">
                {card.subtext}
              </p>
            </div>

            {/* Optional Progress Bar */}
            {card.hasProgress && (
              <div className="mt-5 pt-3 border-t border-[#9FB2AC]/60">
                <div className="w-full bg-[#FFF9EB] h-2 rounded-full overflow-hidden border border-[#9FB2AC]/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, card.numericValue))}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                    className="h-full rounded-full bg-[#5D0D1A]"
                  />
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
