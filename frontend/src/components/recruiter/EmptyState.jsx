import React from 'react';
import { Sparkles } from 'lucide-react';

export const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="bg-white rounded-[24px] p-10 md:p-14 border border-[#9FB2AC] shadow-xs text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC] shadow-2xs">
        <Icon size={32} />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-extrabold text-[#5D0D1A]">{title}</h3>
        <p className="text-xs font-semibold text-[#5A6C66] leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
        >
          <Sparkles size={15} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
