import React from 'react';
import { CheckSquare, Award, BarChart, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export const AdminAssessments = () => {
  const categories = [
    { title: 'Frontend Engineering', questions: 25, difficulty: 'Intermediate', attempts: 34, avgScore: '86%' },
    { title: 'Backend & System Architecture', questions: 30, difficulty: 'Advanced', attempts: 28, avgScore: '81%' },
    { title: 'Full Stack Development', questions: 40, difficulty: 'Advanced', attempts: 42, avgScore: '84%' },
    { title: 'Data Structures & Algorithms', questions: 20, difficulty: 'Hard', attempts: 50, avgScore: '76%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight flex items-center gap-2">
            <CheckSquare size={22} className="text-[#5D0D1A]" />
            Skill Assessment Management
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Configure student skill verification benchmarks, question banks, and monitor completion rates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6C66] bg-[#FFF9EB] px-3.5 py-2 rounded-xl border border-[#9FB2AC] shrink-0">
          <span>Active Categories:</span>
          <strong className="text-[#5D0D1A] font-extrabold">{categories.length}</strong>
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, idx) => (
          <div key={idx} className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center font-bold border border-[#9FB2AC]">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#5D0D1A]">{cat.title}</h4>
              <p className="text-[11px] text-[#5A6C66] font-medium mt-0.5">{cat.questions} Verified Questions</p>
            </div>
            <div className="pt-2 border-t border-[#9FB2AC]/60 flex justify-between items-center text-[11px]">
              <span className="text-[#5A6C66]">Avg Score: <strong className="text-emerald-600 font-extrabold">{cat.avgScore}</strong></span>
              <span className="text-[#5D0D1A] font-extrabold bg-[#FFF9EB] px-2 py-0.5 rounded-md border border-[#9FB2AC]">{cat.attempts} attempts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAssessments;
