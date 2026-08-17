import React from 'react';
import { TrendingUp, Users, Briefcase, Layers, Sparkles, Award } from 'lucide-react';

export const AdminAnalytics = ({ stats }) => {
  const metrics = [
    { title: 'User Growth Trend', value: '+34%', sub: 'New learner registrations this month', icon: Users, color: 'text-[#5D0D1A]', bg: 'bg-[#FFF9EB]' },
    { title: 'Employer Job Postings', value: '+18%', sub: 'Active hiring vacancies added', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Application Funnel', value: '+42%', sub: 'Student submissions across openings', icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Assessment Activity', value: '88%', sub: 'Average student completion rate', icon: Award, color: 'text-[#5D0D1A]', bg: 'bg-[#FFF9EB]' },
  ];

  const popularPaths = [
    { title: 'Full Stack Web Developer (MERN / React)', demand: 'Very High', match: '94%' },
    { title: 'AI & Data Science Engineer', demand: 'High', match: '89%' },
    { title: 'Cloud Infrastructure & DevOps Lead', demand: 'Growing', match: '82%' },
    { title: 'UI/UX & Product Designer', demand: 'Steady', match: '78%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight flex items-center gap-2">
            <TrendingUp size={22} className="text-[#5D0D1A]" />
            Reports & Platform Analytics
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Aggregated analytical insights on platform growth, user acquisition, popular career roadmaps, and candidate skill benchmarks.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#5A6C66] uppercase tracking-wider">{m.title}</span>
                <div className={`w-8 h-8 rounded-lg ${m.bg} ${m.color} flex items-center justify-center border border-[#9FB2AC]`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#5D0D1A]">{m.value}</div>
              <p className="text-[10px] text-[#5A6C66] font-medium">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Popular Career Paths */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-4">
        <h3 className="text-sm font-extrabold text-[#5D0D1A] flex items-center gap-2">
          <Sparkles size={18} className="text-[#5D0D1A]" />
          Most Popular Career Roadmaps & Student Enrolments
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {popularPaths.map((p, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-[#5D0D1A]">{p.title}</h4>
                <p className="text-[10px] text-[#5A6C66]">Market Demand: <strong className="text-[#5D0D1A]">{p.demand}</strong></p>
              </div>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                {p.match} match
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
