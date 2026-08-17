import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, FileUp, ClipboardCheck, Compass, ArrowRight } from 'lucide-react';

export const QuickActions = ({ onNavigate }) => {
  const actions = [
    {
      id: 'profile',
      title: 'Complete Profile',
      description: 'Fill in your background details to get more accurate career matches.',
      icon: UserCheck,
    },
    {
      id: 'resume',
      title: 'Upload Resume',
      description: 'Get instant ATS scoring and AI feedback on formatting & keywords.',
      icon: FileUp,
    },
    {
      id: 'assessments',
      title: 'Take Assessment',
      description: 'Evaluate your technical skills and receive a verified badge.',
      icon: ClipboardCheck,
    },
    {
      id: 'recommendations',
      title: 'Explore Careers',
      description: 'Browse top AI-recommended industry roles aligned with your goals.',
      icon: Compass,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight">
          Start Your Career Journey
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              onClick={() => onNavigate && onNavigate(action.id)}
              className="group cursor-pointer bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-[0_2px_8px_-2px_rgba(93,13,26,0.06)] hover:shadow-lg hover:shadow-[#5D0D1A]/10 hover:border-[#5D0D1A] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                  <Icon size={20} />
                </div>

                <h3 className="text-base font-bold text-[#5D0D1A] group-hover:text-[#7A1424] transition-colors">
                  {action.title}
                </h3>

                <p className="text-xs text-[#5A6C66] font-medium mt-1.5 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#9FB2AC]/60 flex items-center justify-between text-xs font-bold text-[#5D0D1A] group-hover:text-[#7A1424]">
                <span>Start Now</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
