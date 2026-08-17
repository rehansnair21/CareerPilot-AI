import React from 'react';

export const StatCard = ({ title, value, description, icon: Icon, color = 'bloodstone', trend }) => {
  const colorThemes = {
    bloodstone: {
      bg: 'bg-[#FFF9EB]',
      border: 'border-[#9FB2AC]',
      iconBg: 'bg-[#5D0D1A] text-[#FFF9EB]',
      text: 'text-[#5D0D1A]',
    },
    emerald: {
      bg: 'bg-emerald-50/60',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-700 text-white',
      text: 'text-emerald-800',
    },
    amber: {
      bg: 'bg-amber-50/60',
      border: 'border-amber-200',
      iconBg: 'bg-amber-600 text-white',
      text: 'text-amber-900',
    },
    sage: {
      bg: 'bg-[#9FB2AC]/10',
      border: 'border-[#9FB2AC]',
      iconBg: 'bg-[#5A6C66] text-white',
      text: 'text-[#5A6C66]',
    },
  };

  const theme = colorThemes[color] || colorThemes.bloodstone;

  return (
    <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs hover:shadow-md transition-all duration-300 space-y-4 group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-2xs transition-transform group-hover:scale-110`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-[#2D060D] tracking-tight">{value}</span>
          {trend && (
            <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
              {trend}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-[#5A6C66]">{description}</p>
      </div>
    </div>
  );
};
