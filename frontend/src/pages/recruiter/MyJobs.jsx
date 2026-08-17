import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { EmptyState } from '../../components/recruiter/EmptyState';
import {
  Briefcase,
  PlusCircle,
  MapPin,
  Clock,
  Users,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';

export const MyJobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [activeTab]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const statusParam = activeTab !== 'All' ? `?status=${activeTab}` : '';
      const res = await api.get(`/recruiter/jobs${statusParam}`);
      if (res.data && res.data.success) {
        setJobs(res.data.data);
      }
    } catch (err) {
      console.warn('Notice fetching recruiter jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
    try {
      await api.put(`/recruiter/jobs/${jobId}`, { status: nextStatus });
      fetchJobs();
    } catch (err) {
      console.error('Error toggling job status:', err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await api.delete(`/recruiter/jobs/${jobId}`);
        fetchJobs();
      } catch (err) {
        console.error('Error deleting job:', err);
      }
    }
  };

  return (
    <RecruiterLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">
              My Job Opportunities
            </h1>
            <p className="text-xs md:text-sm font-semibold text-[#5A6C66]">
              Manage published job postings, candidate applications, and position statuses.
            </p>
          </div>

          <button
            onClick={() => navigate('/recruiter/jobs/new')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
          >
            <PlusCircle size={16} />
            <span>+ Post New Job</span>
          </button>
        </div>

        {/* Tabs Filter */}
        <div className="flex items-center gap-2 border-b border-[#9FB2AC] pb-3 overflow-x-auto">
          {['All', 'Active', 'Draft', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                activeTab === tab
                  ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-2xs'
                  : 'text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A]'
              }`}
            >
              {tab} Jobs
            </button>
          ))}
        </div>

        {/* Content View */}
        {loading ? (
          <div className="bg-white rounded-[24px] p-12 border border-[#9FB2AC] text-center">
            <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-[#5D0D1A]">Loading job opportunities...</p>
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="You haven't posted any jobs yet"
            description="Create your first job posting to start receiving verified student applications."
            actionLabel="Post Your First Job →"
            onAction={() => navigate('/recruiter/jobs/new')}
          />
        ) : (
          <div className="bg-white rounded-[24px] p-6 border border-[#9FB2AC] shadow-xs space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#9FB2AC] text-[11px] font-extrabold uppercase text-[#5A6C66] tracking-wider">
                    <th className="py-3 px-4">Job Title</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Applications</th>
                    <th className="py-3 px-4">Posted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9FB2AC]/40 text-xs font-semibold text-[#2D060D]">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-[#5D0D1A]">{job.title}</div>
                        <div className="text-[11px] text-[#7A1424] font-bold">{job.companyName}</div>
                      </td>
                      <td className="py-4 px-4 text-[#5A6C66]">{job.location}</td>
                      <td className="py-4 px-4 text-[#5A6C66]">{job.employmentType}</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]">
                          {job.applicationsCount || 0} Candidates
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#5A6C66]">{new Date(job.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            job.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : job.status === 'Draft'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate('/recruiter/applications')}
                            className="p-1.5 rounded-lg border border-[#9FB2AC] text-[#5D0D1A] hover:bg-[#FFF9EB]"
                            title="View Applications"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(job._id, job.status)}
                            className="p-1.5 rounded-lg border border-[#9FB2AC] text-[#5A6C66] hover:bg-gray-100"
                            title={job.status === 'Active' ? 'Close Position' : 'Reactivate Position'}
                          >
                            {job.status === 'Active' ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job._id)}
                            className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                            title="Delete Job"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};
