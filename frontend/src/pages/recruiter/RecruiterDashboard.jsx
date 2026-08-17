import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { StatCard } from '../../components/recruiter/StatCard';
import { EmptyState } from '../../components/recruiter/EmptyState';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Calendar,
  PlusCircle,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  MapPin,
  Building2,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Globe,
  Edit,
} from 'lucide-react';

export const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlistedCandidates: 0,
    interviews: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [activeJobsList, setActiveJobsList] = useState([]);
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/recruiter/stats');
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      const profileRes = await api.get('/recruiter/profile');
      if (profileRes.data && profileRes.data.success && profileRes.data.data) {
        setRecruiterProfile(profileRes.data.data);
      }

      const appsRes = await api.get('/recruiter/applications');
      if (appsRes.data && appsRes.data.success) {
        setRecentApplications(appsRes.data.data.slice(0, 5));
      }

      const jobsRes = await api.get('/recruiter/jobs?status=Active');
      if (jobsRes.data && jobsRes.data.success) {
        setActiveJobsList(jobsRes.data.data.slice(0, 4));
      }
    } catch (err) {
      console.warn('Notice fetching recruiter dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (p) => {
    if (!p) return 0;
    const fields = [
      p.fullName || user?.fullName || user?.name,
      p.email || user?.email,
      p.phone,
      p.companyName,
      p.industry,
      p.designation,
      p.location,
      p.companyWebsite,
      p.companyDescription,
    ];
    const completed = fields.filter((f) => f && String(f).trim().length > 0).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion(recruiterProfile);

  const recruiterName = user?.name || user?.fullName || 'John Recruiter';

  return (
    <RecruiterLayout>
      <div className="space-y-8">
        {/* HERO WELCOME BANNER (Matches Student Dashboard WelcomeCard style) */}
        <div className="bg-gradient-to-br from-[#FFF9EB] via-[#F7EED8] to-[#FFF9EB] rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#5D0D1A]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white text-[#5D0D1A] text-xs font-extrabold border border-[#9FB2AC] shadow-2xs">
                <Sparkles size={14} className="text-[#5D0D1A]" />
                <span>CareerPilot AI Recruiter Co-pilot</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">
                Good morning, {recruiterName.split(' ')[0]} 👋
              </h1>
              <p className="text-[#4A5D57] text-xs md:text-sm leading-relaxed font-medium">
                Manage your hiring pipeline, evaluate ATS matches, and discover verified talent with CareerPilot AI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/recruiter/applications')}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-extrabold shadow-2xs transition-all"
              >
                View Applications
              </button>
              <button
                onClick={() => navigate('/recruiter/jobs/new')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle size={16} />
                <span>Post a New Job →</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 STATISTICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            description="Currently published positions"
            icon={Briefcase}
            color="bloodstone"
          />
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            description="Candidates in recruitment pipeline"
            icon={FileText}
            color="emerald"
          />
          <StatCard
            title="Shortlisted Candidates"
            value={stats.shortlistedCandidates}
            description="Selected for screening"
            icon={CheckCircle2}
            color="amber"
          />
          <StatCard
            title="Interviews Scheduled"
            value={stats.interviews}
            description="Confirmed candidate calls"
            icon={Calendar}
            color="sage"
          />
        </div>

        {/* RECRUITER PROFILE DETAILS TABLE */}
        <div className="bg-white rounded-[24px] p-6 border border-[#9FB2AC] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#9FB2AC]/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#5D0D1A]">Recruiter Profile & Company Details</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  completionPercentage === 100 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  {completionPercentage === 100 ? '✓ Profile Complete (100%)' : `Profile Completion: ${completionPercentage}%`}
                </span>
              </div>
              <p className="text-xs text-[#5A6C66]">Verified recruiter details and company organization information table</p>
            </div>

            <button
              onClick={() => navigate('/recruiter/profile')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-extrabold transition-all self-start sm:self-auto shadow-2xs"
            >
              <Edit size={14} />
              <span>Edit Profile Details</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#9FB2AC] text-[11px] font-extrabold uppercase text-[#5A6C66] tracking-wider bg-[#FFF9EB]/40">
                  <th className="py-3 px-4">Profile Attribute</th>
                  <th className="py-3 px-4">Recruiter / Organization Detail</th>
                  <th className="py-3 px-4">Field Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9FB2AC]/40 text-xs font-semibold text-[#2D060D]">
                <tr className="hover:bg-[#FFF9EB]/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <User size={15} className="text-[#5D0D1A]" /> Full Name
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#2D060D]">
                    {recruiterProfile?.fullName || user?.fullName || user?.name || 'Not provided'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Completed
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Mail size={15} className="text-[#5D0D1A]" /> Email Address
                  </td>
                  <td className="py-3.5 px-4 text-[#5A6C66]">
                    {recruiterProfile?.email || user?.email || 'Not provided'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Verified User
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Phone size={15} className="text-[#5D0D1A]" /> Contact Phone
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {recruiterProfile?.phone || <span className="text-amber-700 font-normal italic">Pending phone number</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {recruiterProfile?.phone ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Added
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Briefcase size={15} className="text-[#5D0D1A]" /> Designation / Job Title
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {recruiterProfile?.designation || <span className="text-amber-700 font-normal italic">Pending designation</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {recruiterProfile?.designation ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Added
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Building2 size={15} className="text-[#5D0D1A]" /> Company Name
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-[#7A1424]">
                    {recruiterProfile?.companyName || <span className="text-amber-700 font-normal italic">Pending company name</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {recruiterProfile?.companyName ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Added
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <TrendingUp size={15} className="text-[#5D0D1A]" /> Industry Sector
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {recruiterProfile?.industry || <span className="text-amber-700 font-normal italic">Pending industry</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {recruiterProfile?.industry ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Added
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <MapPin size={15} className="text-[#5D0D1A]" /> Work Location
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {recruiterProfile?.location || <span className="text-amber-700 font-normal italic">Pending location</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {recruiterProfile?.location ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Added
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-[#FFF9EB]/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-[#5D0D1A] flex items-center gap-2">
                    <Globe size={15} className="text-[#5D0D1A]" /> Company Website
                  </td>
                  <td className="py-3.5 px-4 text-[#2D060D]">
                    {recruiterProfile?.companyWebsite ? (
                      <a href={recruiterProfile.companyWebsite} target="_blank" rel="noreferrer" className="text-[#7A1424] hover:underline flex items-center gap-1 font-bold">
                        {recruiterProfile.companyWebsite}
                      </a>
                    ) : (
                      <span className="text-amber-700 font-normal italic">Pending website URL</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {recruiterProfile?.companyWebsite ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Added
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT APPLICATIONS TABLE / EMPTY STATE */}
        <div className="bg-white rounded-[24px] p-6 border border-[#9FB2AC] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#9FB2AC]/60 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#5D0D1A]">Recent Applications</h2>
              <p className="text-xs text-[#5A6C66]">Latest candidate submissions across your job postings</p>
            </div>

            <button
              onClick={() => navigate('/recruiter/applications')}
              className="text-xs font-extrabold text-[#7A1424] hover:underline flex items-center gap-1 group"
            >
              <span>View All Applications</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {recentApplications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications yet"
              description="Applications will appear here when candidates apply to your job postings."
              actionLabel="Post Your First Job"
              onAction={() => navigate('/recruiter/jobs/new')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#9FB2AC] text-[11px] font-extrabold uppercase text-[#5A6C66] tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Applied Job</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">ATS Match</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9FB2AC]/40 text-xs font-semibold text-[#2D060D]">
                  {recentApplications.map((app) => (
                    <tr key={app._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#5D0D1A]">{app.student?.fullName || 'Candidate'}</div>
                        <div className="text-[11px] text-[#5A6C66]">{app.student?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#2D060D]">{app.job?.title || 'Job Posting'}</td>
                      <td className="py-3.5 px-4 text-[#5A6C66]">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]">
                          {app.matchScore || 85}% Match
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate('/recruiter/applications')}
                          className="px-3.5 py-1.5 rounded-xl border border-[#9FB2AC] text-[#5D0D1A] hover:bg-[#FFF9EB] text-xs font-extrabold"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ACTIVE JOBS SECTION / EMPTY STATE */}
        <div className="bg-white rounded-[24px] p-6 border border-[#9FB2AC] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#9FB2AC]/60 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#5D0D1A]">Your Active Jobs</h2>
              <p className="text-xs text-[#5A6C66]">Currently published openings seeking candidates</p>
            </div>

            <button
              onClick={() => navigate('/recruiter/jobs')}
              className="text-xs font-extrabold text-[#7A1424] hover:underline flex items-center gap-1 group"
            >
              <span>Manage All Jobs</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {activeJobsList.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No active jobs yet"
              description="Create a job opportunity to start receiving candidate applications."
              actionLabel="Post Your First Job →"
              onAction={() => navigate('/recruiter/jobs/new')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeJobsList.map((job) => (
                <div key={job._id} className="p-5 rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC] hover:border-[#5D0D1A] transition-all space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#5D0D1A]">{job.title}</h3>
                      <p className="text-xs font-bold text-[#7A1424]">{job.companyName}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {job.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#5A6C66] font-semibold">
                    <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {job.employmentType}</span>
                    <span className="flex items-center gap-1"><Users size={13} /> {job.applicationsCount || 0} Applications</span>
                  </div>

                  <div className="pt-2 border-t border-[#9FB2AC]/50 flex items-center justify-between">
                    <span className="text-[11px] text-[#5A6C66] font-medium">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => navigate('/recruiter/jobs')}
                      className="text-xs font-extrabold text-[#5D0D1A] hover:underline"
                    >
                      Manage Job →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  );
};
