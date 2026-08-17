import React from 'react';
import { Sparkles, FileText, CheckCircle, BarChart, AlertTriangle, Layers, Cpu, Award } from 'lucide-react';

export const AdminResumeAI = () => {
  const stats = [
    { label: 'Total Resumes Analyzed', value: '42', sub: 'Across all student profiles', icon: FileText, color: 'text-[#5D0D1A]', bg: 'bg-[#FFF9EB]' },
    { label: 'Average Resume Score', value: '84 / 100', sub: 'Overall formatting & clarity', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Average ATS Compatibility', value: '88%', sub: 'Parsed keywords alignment', icon: Cpu, color: 'text-[#5D0D1A]', bg: 'bg-[#FFF9EB]' },
    { label: 'AI Analyses Conducted Today', value: '8', sub: 'Real-time resume processing', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const commonSkills = [
    { name: 'JavaScript / React.js', frequency: '92%' },
    { name: 'Node.js & Express', frequency: '85%' },
    { name: 'MongoDB / SQL Databases', frequency: '78%' },
    { name: 'Python & Data Analysis', frequency: '64%' },
  ];

  const skillGaps = [
    { name: 'Docker & Kubernetes Containerization', impact: 'High Need' },
    { name: 'CI/CD Pipeline Automation (GitHub Actions)', impact: 'Medium Need' },
    { name: 'Cloud Deployment (AWS / GCP)', impact: 'High Need' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9EB] text-[#5D0D1A] text-xs font-bold border border-[#9FB2AC] mb-2">
            <Sparkles size={13} /> Enterprise AI Intelligence Engine
          </div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight">
            Resume & AI Skill Gap Analytics
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Telemetry metrics on AI resume scanning, ATS formatting benchmarks, extracted skill distributions, and missing candidate skills.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-[#5A6C66] uppercase tracking-wider">{s.label}</span>
                <div className="text-xl font-extrabold text-[#5D0D1A]">{s.value}</div>
                <p className="text-[10px] text-[#5A6C66] font-medium">{s.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center border border-[#9FB2AC]`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Extracted Skills */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#5D0D1A] flex items-center gap-2">
            <BarChart size={18} className="text-[#5D0D1A]" />
            Most Common Extracted Candidate Skills
          </h3>
          <div className="space-y-3">
            {commonSkills.map((sk, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#5D0D1A]">{sk.name}</span>
                <span className="text-xs font-extrabold text-[#5D0D1A] bg-[#FFF9EB] px-2.5 py-0.5 rounded-full border border-[#9FB2AC]">
                  {sk.frequency} of candidates
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Identified Industry Skill Gaps */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#5D0D1A] flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Top Industry Skill Gaps Identified
          </h3>
          <div className="space-y-3">
            {skillGaps.map((sg, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#5D0D1A]">{sg.name}</span>
                <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {sg.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminResumeAI;
