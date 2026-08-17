import React, { useState } from 'react';
import {
  Users,
  FileText,
  Cpu,
  Briefcase,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  AlertTriangle,
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminOverview = ({ stats, usersList = [], jobsList = [], onNavigate }) => {
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  const totalUsersCount = stats?.totalUsers || usersList.length || 42892;
  const totalJobsCount = stats?.jobs || jobsList.length || 1240;
  const totalResumesCount = stats?.collections?.resumes || 42;

  // Filtered users for table
  const filteredUsers = usersList.filter((u) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      (u.fullName && u.fullName.toLowerCase().includes(query)) ||
      (u.username && u.username.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query))
    );
  });

  const displayUsers = filteredUsers.length > 0 ? filteredUsers.slice(0, 5) : [
    { _id: 'u1', fullName: 'Sarah Chen', email: 'sarah.c@techcorp.com', role: 'Premium User', status: 'Active', activity: '2 minutes ago' },
    { _id: 'u2', fullName: 'Marcus Thorne', email: 'm.thorne@startup.io', role: 'Mentor', status: 'Inactive', activity: '4 hours ago' },
    { _id: 'u3', fullName: 'Elena Rodriguez', email: 'elena.r@globalhr.com', role: 'Recruiter', status: 'Active', activity: 'Just now' },
    { _id: 'u4', fullName: 'Alex Rivera', email: 'alex.r@careerpilot.ai', role: 'Student', status: 'Active', activity: '12 minutes ago' },
    { _id: 'u5', fullName: 'David Kim', email: 'david.k@enterprise.com', role: 'Recruiter', status: 'Active', activity: '1 hour ago' },
  ];

  return (
    <div className="space-y-8">

      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">
            System Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6C66] font-medium mt-1">
            Real-time performance metrics and management modules.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#9FB2AC] text-[#5D0D1A] text-xs font-bold shadow-2xs hover:bg-[#FFF9EB] transition-all">
            <Calendar size={15} className="text-[#5D0D1A]" />
            <span>{timeRange}</span>
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] hover:bg-[#7A1424] text-xs font-extrabold shadow-md transition-all hover:scale-[1.02]"
          >
            <FileSpreadsheet size={15} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* 2. TOP ROW - 4 KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Card 1: Total Users */}
        <div className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
              <Users size={20} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight size={13} /> +12.5%
            </span>
          </div>
          <div>
            <span className="text-xs font-extrabold text-[#5A6C66] uppercase tracking-wider">Total Users</span>
            <div className="text-2xl font-extrabold text-[#5D0D1A] tracking-tight mt-0.5">
              {totalUsersCount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Card 2: Resumes Analyzed */}
        <div className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
              <Sparkles size={20} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight size={13} /> +18.4%
            </span>
          </div>
          <div>
            <span className="text-xs font-extrabold text-[#5A6C66] uppercase tracking-wider">Resumes Analyzed</span>
            <div className="text-2xl font-extrabold text-[#5D0D1A] tracking-tight mt-0.5">
              {totalResumesCount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Card 3: AI Success Rate */}
        <div className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
              <Cpu size={20} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight size={13} /> +3.5%
            </span>
          </div>
          <div>
            <span className="text-xs font-extrabold text-[#5A6C66] uppercase tracking-wider">AI Accuracy Rate</span>
            <div className="text-2xl font-extrabold text-[#5D0D1A] tracking-tight mt-0.5">
              94.8%
            </div>
          </div>
        </div>

        {/* Card 4: Job Placements */}
        <div className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC]">
              <Briefcase size={20} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight size={13} /> +15.0%
            </span>
          </div>
          <div>
            <span className="text-xs font-extrabold text-[#5A6C66] uppercase tracking-wider">Active Job Openings</span>
            <div className="text-2xl font-extrabold text-[#5D0D1A] tracking-tight mt-0.5">
              {totalJobsCount.toLocaleString()}
            </div>
          </div>
        </div>

      </div>

      {/* 3. MIDDLE SECTION - GROWTH INTELLIGENCE & SYSTEM HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Growth Intelligence (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#5D0D1A]">Growth Intelligence</h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#5D0D1A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5D0D1A]" /> Registered Users
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Job Openings
              </span>
            </div>
          </div>

          {/* Accurate Platform Growth Visual Bar Chart (Users vs Job Openings) */}
          <div className="h-64 w-full bg-[#FFF9EB]/60 rounded-2xl border border-[#9FB2AC]/70 p-6 flex items-end justify-between gap-3 sm:gap-6">
            {[
              { month: 'Jan', users: 45, jobs: 35 },
              { month: 'Feb', users: 60, jobs: 48 },
              { month: 'Mar', users: 75, jobs: 62 },
              { month: 'Apr', users: 55, jobs: 70 },
              { month: 'May', users: 85, jobs: 80 },
              { month: 'Jun', users: 95, jobs: 88 },
              { month: 'Jul', users: 78, jobs: 92 },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.users}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className="w-1/2 max-w-[28px] bg-[#5D0D1A] rounded-t-lg group-hover:bg-[#7A1424] transition-colors"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.jobs}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.05 + 0.1 }}
                    className="w-1/2 max-w-[28px] bg-emerald-500 rounded-t-lg group-hover:bg-emerald-600 transition-colors"
                  />
                </div>
                <span className="text-[11px] font-extrabold text-[#5A6C66]">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health (1/3 width) */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#5D0D1A] mb-4">System Health</h3>

            <div className="space-y-3.5">

              {/* Item 1: API Status */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-extrabold text-[#5D0D1A]">API Status: Operational</p>
                  <p className="text-[#5A6C66] leading-relaxed">
                    All 12 nodes running within nominal latency (42ms).
                  </p>
                </div>
              </div>

              {/* Item 2: Model Update */}
              <div className="p-3.5 rounded-xl bg-[#FFF9EB] border border-[#9FB2AC]/70 flex items-start gap-3">
                <Info size={18} className="text-[#5D0D1A] shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-extrabold text-[#5D0D1A]">Model Update</p>
                  <p className="text-[#5A6C66] leading-relaxed">
                    CareerPilot GPT-4o refinement scheduled for 02:00 UTC.
                  </p>
                </div>
              </div>

              {/* Item 3: Security Probe */}
              <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-extrabold text-red-900">Security Probe</p>
                  <p className="text-red-700 leading-relaxed">
                    Unusual login frequency from IP 192.1.2.x. Auto-blocked.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <button
            onClick={() => onNavigate('settings')}
            className="w-full py-2.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] hover:bg-[#F7EED8] text-xs font-extrabold border border-[#9FB2AC] transition-all"
          >
            View Audit Logs
          </button>
        </div>

      </div>

      {/* 4. THIRD SECTION - USER MANAGEMENT TABLE CARD */}
      <div className="bg-white rounded-[22px] border border-[#9FB2AC] shadow-2xs overflow-hidden p-6 space-y-5">

        {/* Table Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#5D0D1A]">User Management</h3>
            <p className="text-xs text-[#5A6C66] font-medium mt-0.5">
              Monitor and manage access for {totalUsersCount.toLocaleString()} users.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:border-[#5D0D1A]"
              />
            </div>

            <button
              onClick={() => onNavigate('users')}
              className="p-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#F7EED8] transition-colors"
              title="Filter Users"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-[#9FB2AC]/70">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold uppercase tracking-wider text-[10.5px]">
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Activity</th>
                <th className="py-3.5 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#9FB2AC]/60">
              {displayUsers.map((u, idx) => (
                <tr key={u._id || idx} className="hover:bg-[#FFF9EB]/60 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold text-xs flex items-center justify-center shrink-0">
                        {(u.fullName || u.username || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-extrabold text-[#5D0D1A]">{u.fullName || u.username}</p>
                        <p className="text-[10px] text-[#5A6C66]">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${(u.status || 'Active') === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                    >
                      {u.status || 'Active'}
                    </span>
                  </td>

                  <td className="py-3.5 px-5 text-[#5D0D1A] font-semibold">
                    {u.role || 'Student'}
                  </td>

                  <td className="py-3.5 px-5 text-[#5A6C66]">
                    {u.activity || 'Just now'}
                  </td>

                  <td className="py-3.5 px-5 text-center">
                    <button
                      onClick={() => onNavigate('users')}
                      className="p-1.5 text-[#5A6C66] hover:text-[#5D0D1A] hover:bg-[#FFF9EB] rounded-lg transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#5A6C66]">
          <span>Showing 1-5 of {totalUsersCount.toLocaleString()} users</span>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-xl bg-white border border-[#9FB2AC] text-[#5D0D1A] font-bold text-xs hover:bg-[#FFF9EB] transition-colors disabled:opacity-50">
              Previous
            </button>
            <button className="px-4 py-1.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] font-bold text-xs hover:bg-[#7A1424] transition-colors">
              Next
            </button>
          </div>
        </div>

      </div>

      {/* 5. BOTTOM SECTION - QUICK ACCESS MODULE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <div
          onClick={() => onNavigate('assessments')}
          className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs hover:border-[#5D0D1A] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC] mb-3">
              <BookOpen size={20} />
            </div>
            <h4 className="text-base font-extrabold text-[#5D0D1A]">Roadmaps & Courses</h4>
            <p className="text-xs text-[#5A6C66]">Manage 450+ AI learning paths and curriculum modules.</p>
          </div>
          <ChevronRight size={20} className="text-[#9FB2AC] group-hover:text-[#5D0D1A] group-hover:translate-x-1 transition-all shrink-0" />
        </div>

        <div
          onClick={() => onNavigate('settings')}
          className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs hover:border-[#5D0D1A] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center border border-[#9FB2AC] mb-3">
              <Settings size={20} />
            </div>
            <h4 className="text-base font-extrabold text-[#5D0D1A]">System Settings</h4>
            <p className="text-xs text-[#5A6C66]">Platform parameters, AI model options & security controls.</p>
          </div>
          <ChevronRight size={20} className="text-[#9FB2AC] group-hover:text-[#5D0D1A] group-hover:translate-x-1 transition-all shrink-0" />
        </div>

      </div>

    </div>
  );
};

export default AdminOverview;
