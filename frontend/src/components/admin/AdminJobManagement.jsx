import React, { useState, useEffect } from 'react';
import {
  Search,
  Briefcase,
  Building2,
  MapPin,
  Users,
  Calendar,
  Trash2,
  AlertCircle,
  Eye,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  X,
  Clock,
  DollarSign,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

export const AdminJobManagement = ({ jobsList = [], onRefresh }) => {
  const [jobs, setJobs] = useState(jobsList);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Interactive Action States
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewingJob, setViewingJob] = useState(null);
  const [viewJobLoading, setViewJobLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Sync internal state with props when refreshed
  useEffect(() => {
    setJobs(jobsList);
  }, [jobsList]);

  // Handle Deactivate / Reactivate
  const handleToggleStatus = async (job) => {
    setActionLoadingId(job._id);
    const isCurrentlyActive = (job.status || 'Active').toLowerCase() === 'active';
    const targetAction = isCurrentlyActive ? 'deactivate' : 'reactivate';

    try {
      const res = await api.put(`/admin/jobs/${job._id}/toggle-status`);
      if (res.data && res.data.success) {
        const updatedJob = res.data.job;
        setJobs((prev) =>
          prev.map((j) => (j._id === job._id ? { ...j, ...updatedJob } : j))
        );
        setNotification({
          type: 'success',
          message: res.data.message || `Job "${job.title}" has been ${targetAction}d.`,
        });
        setTimeout(() => setNotification(null), 4000);
        onRefresh?.();
      }
    } catch (err) {
      console.error('Error toggling job status:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || `Failed to ${targetAction} job.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Soft Delete confirmation
  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    setDeleteLoading(true);

    try {
      const res = await api.delete(`/admin/jobs/${jobToDelete._id}`);
      if (res.data && res.data.success) {
        setJobs((prev) => prev.filter((j) => j._id !== jobToDelete._id));
        setNotification({
          type: 'success',
          message:
            res.data.message ||
            `Job "${jobToDelete.title}" deleted successfully. Applicant records preserved.`,
        });
        setTimeout(() => setNotification(null), 4500);
        setJobToDelete(null);
        onRefresh?.();
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete job posting.',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle View Details Modal
  const handleOpenViewModal = async (job) => {
    setViewingJob(job);
    setViewJobLoading(true);

    try {
      const res = await api.get(`/admin/jobs/${job._id}`);
      if (res.data && res.data.success && res.data.job) {
        setViewingJob(res.data.job);
      }
    } catch (err) {
      console.error('Error loading full job details:', err);
    } finally {
      setViewJobLoading(false);
    }
  };

  // Filter Jobs
  const filteredJobs = jobs.filter((j) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (j.title && j.title.toLowerCase().includes(query)) ||
      (j.companyName && j.companyName.toLowerCase().includes(query)) ||
      (j.location && j.location.toLowerCase().includes(query)) ||
      (j.requiredSkills &&
        j.requiredSkills.some((s) => s.toLowerCase().includes(query)));

    const currentStatus = (j.status || 'Active').toLowerCase();
    const matchesStatus =
      statusFilter === 'all' || currentStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-sm transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight flex items-center gap-2">
            <Briefcase size={22} className="text-[#5D0D1A]" />
            Job Openings Management ({filteredJobs.length})
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Review, oversee, deactivate/reactivate, and manage active or historical job openings with live database synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6C66] bg-[#FFF9EB] px-3.5 py-2 rounded-xl border border-[#9FB2AC] shrink-0">
            <span>Total Tracked Jobs:</span>
            <strong className="text-[#5D0D1A] font-extrabold">{jobs.length}</strong>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
            <input
              type="text"
              placeholder="Search jobs by title, company, location, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'Active', label: 'Active' },
              { id: 'Deactivated', label: 'Deactivated' },
              { id: 'Closed', label: 'Closed' },
              { id: 'Draft', label: 'Draft' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                  statusFilter === st.id
                    ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-2xs'
                    : 'bg-[#FFF9EB] text-[#5A6C66] border-[#9FB2AC] hover:bg-[#F7EED8] hover:text-[#5D0D1A]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[22px] border border-[#9FB2AC] shadow-2xs overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-sm font-extrabold text-[#5D0D1A]">No job postings found</h4>
            <p className="text-xs text-[#5A6C66] max-w-sm mx-auto">
              No job postings match your active search and status filters. Try clearing your search parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-5">Job Title</th>
                  <th className="py-3.5 px-5">Hiring Company</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5">Employment Type</th>
                  <th className="py-3.5 px-5">Applicants</th>
                  <th className="py-3.5 px-5">Posted Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9FB2AC]/60">
                {filteredJobs.map((j) => {
                  const isJobActive = (j.status || 'Active').toLowerCase() === 'active';
                  const isDeactivated = (j.status || '').toLowerCase() === 'deactivated';

                  return (
                    <tr key={j._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                      <td className="py-3.5 px-5 font-extrabold text-[#5D0D1A]">
                        <div>{j.title}</div>
                        {j.salaryRange && (
                          <span className="text-[10px] text-[#5A6C66] font-semibold block">
                            💰 {j.salaryRange}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-[#5D0D1A] font-extrabold">
                        🏢 {j.companyName || 'Corporate Partner'}
                      </td>
                      <td className="py-3.5 px-5 text-[#5A6C66]">
                        📍 {j.location || 'Remote'}
                      </td>
                      <td className="py-3.5 px-5 text-[#5A6C66] font-medium">
                        {j.employmentType || 'Full-time'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-extrabold text-[#5D0D1A] bg-[#FFF9EB] px-2.5 py-1 rounded-lg border border-[#9FB2AC] inline-flex items-center gap-1.5">
                          <Users size={12} className="text-[#5D0D1A]" />
                          {j.applicationsCount || 0} candidates
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-[#5A6C66]">
                        {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isJobActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : isDeactivated
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : (j.status || '').toLowerCase() === 'draft'
                              ? 'bg-purple-50 text-purple-700 border border-purple-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isJobActive
                                ? 'bg-emerald-500'
                                : isDeactivated
                                ? 'bg-amber-500'
                                : (j.status || '').toLowerCase() === 'draft'
                                ? 'bg-purple-500'
                                : 'bg-gray-400'
                            }`}
                          />
                          {j.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Button */}
                          <button
                            onClick={() => handleOpenViewModal(j)}
                            title="View Job Details & Applicants"
                            className="px-2.5 py-1.5 rounded-xl border border-[#9FB2AC] text-[#5D0D1A] bg-[#FFF9EB] hover:bg-[#F7EED8] hover:border-[#5D0D1A] font-extrabold text-xs inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {/* Deactivate / Reactivate Button */}
                          <button
                            onClick={() => handleToggleStatus(j)}
                            disabled={actionLoadingId === j._id}
                            title={
                              isJobActive
                                ? 'Deactivate this job (hide from public listings)'
                                : 'Reactivate this job (make available to students)'
                            }
                            className={`px-2.5 py-1.5 rounded-xl border font-extrabold text-xs inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer ${
                              isJobActive
                                ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100'
                                : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {actionLoadingId === j._id ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isJobActive ? (
                              <PauseCircle size={13} />
                            ) : (
                              <PlayCircle size={13} />
                            )}
                            <span>{isJobActive ? 'Deactivate' : 'Reactivate'}</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setJobToDelete(j)}
                            title="Delete this job (preserves applicant records)"
                            className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 font-extrabold text-xs inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= Confirmation Dialog Modal for Deletion ================= */}
      {jobToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full border border-[#9FB2AC] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#5D0D1A]">
                  Delete Job Opening?
                </h3>
                <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
                  Are you sure you want to delete{' '}
                  <strong className="text-[#5D0D1A] font-extrabold">"{jobToDelete.title}"</strong> at{' '}
                  <strong className="text-[#5D0D1A] font-extrabold">{jobToDelete.companyName || 'Hiring Partner'}</strong>?
                </p>
              </div>
            </div>

            {/* Application Preservation Assurance Banner */}
            <div className="bg-[#FFF9EB] border border-[#9FB2AC] rounded-2xl p-3.5 text-xs space-y-1.5">
              <div className="font-extrabold text-[#5D0D1A] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Applicant Records Preserved
              </div>
              <p className="text-[11px] text-[#5A6C66] leading-relaxed">
                This job will be soft-deleted and removed from student & recruiter listings. All{' '}
                <strong className="text-[#5D0D1A]">{jobToDelete.applicationsCount || 0} candidate applications</strong>{' '}
                and submitted resumes remain safely preserved in the database.
              </p>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-[#9FB2AC] text-xs font-bold text-[#5A6C66] bg-[#FFF9EB] hover:bg-[#F7EED8] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-extrabold shadow-sm hover:from-rose-700 hover:to-rose-800 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Job</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= View Job Details Modal ================= */}
      {viewingJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-2xl w-full border border-[#9FB2AC] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-[#FFF9EB] border-b border-[#9FB2AC] flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-[#5D0D1A]">
                    {viewingJob.title}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      (viewingJob.status || 'Active').toLowerCase() === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : (viewingJob.status || '').toLowerCase() === 'deactivated'
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {viewingJob.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-[#5A6C66] font-semibold flex items-center gap-2">
                  <span>🏢 {viewingJob.companyName || 'Corporate Partner'}</span>
                  <span>•</span>
                  <span>📍 {viewingJob.location || 'Remote'}</span>
                  <span>•</span>
                  <span>💼 {viewingJob.employmentType || 'Full-time'}</span>
                </p>
              </div>

              <button
                onClick={() => setViewingJob(null)}
                className="text-[#5A6C66] hover:text-[#5D0D1A] p-1.5 rounded-xl hover:bg-white/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#5A6C66]">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC]/70">
                  <span className="text-[10px] text-[#5A6C66] font-bold block uppercase tracking-wider">
                    Experience
                  </span>
                  <strong className="text-[#5D0D1A] font-extrabold text-xs">
                    {viewingJob.experienceRequired || 'Not specified'}
                  </strong>
                </div>

                <div className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC]/70">
                  <span className="text-[10px] text-[#5A6C66] font-bold block uppercase tracking-wider">
                    Salary Range
                  </span>
                  <strong className="text-[#5D0D1A] font-extrabold text-xs">
                    {viewingJob.salaryRange || 'Competitive'}
                  </strong>
                </div>

                <div className="bg-[#FFF9EB] p-3 rounded-xl border border-[#9FB2AC]/70">
                  <span className="text-[10px] text-[#5A6C66] font-bold block uppercase tracking-wider">
                    Applicants
                  </span>
                  <strong className="text-[#5D0D1A] font-extrabold text-xs flex items-center gap-1">
                    <Users size={13} />
                    {viewingJob.applicationsCount || 0} candidates
                  </strong>
                </div>
              </div>

              {/* Job Description */}
              {viewingJob.description && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-[#5D0D1A] uppercase tracking-wider">
                    Role Description
                  </h4>
                  <div className="bg-[#FFF9EB]/40 p-4 rounded-xl border border-[#9FB2AC]/60 leading-relaxed whitespace-pre-line text-[#2D060D] font-medium text-xs">
                    {viewingJob.description}
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {((viewingJob.requiredSkills && viewingJob.requiredSkills.length > 0) ||
                (viewingJob.preferredSkills && viewingJob.preferredSkills.length > 0)) && (
                <div className="space-y-3">
                  {viewingJob.requiredSkills && viewingJob.requiredSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10.5px] font-black text-[#5D0D1A] uppercase tracking-wider block">
                        Required Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingJob.requiredSkills.map((sk, idx) => (
                          <span
                            key={idx}
                            className="bg-[#FFF9EB] text-[#5D0D1A] font-bold px-2.5 py-1 rounded-lg border border-[#9FB2AC] text-[11px]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingJob.preferredSkills && viewingJob.preferredSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10.5px] font-black text-[#5D0D1A] uppercase tracking-wider block">
                        Preferred Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingJob.preferredSkills.map((sk, idx) => (
                          <span
                            key={idx}
                            className="bg-white text-[#5A6C66] font-bold px-2.5 py-1 rounded-lg border border-[#9FB2AC] text-[11px]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Applicant Records Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-[#5D0D1A]" />
                    Applicant Records ({viewingJob.applicationsCount || 0})
                  </h4>
                  <span className="text-[11px] text-[#5A6C66] font-medium">
                    Live candidate database
                  </span>
                </div>

                {viewJobLoading ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#5D0D1A] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-[#5A6C66]">Loading candidate records...</span>
                  </div>
                ) : viewingJob.applications && viewingJob.applications.length > 0 ? (
                  <div className="border border-[#9FB2AC] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Applicant</th>
                          <th className="py-2.5 px-3">Education / College</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Applied Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#9FB2AC]/40">
                        {viewingJob.applications.map((app) => (
                          <tr key={app._id} className="hover:bg-[#FFF9EB]/40">
                            <td className="py-2.5 px-3">
                              <strong className="text-[#5D0D1A] block font-bold">
                                {app.applicantName || 'Anonymous Candidate'}
                              </strong>
                              <span className="text-[10px] text-[#5A6C66]">
                                {app.applicantEmail || 'No email'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#5A6C66]">
                              <span className="font-semibold block">{app.degree || 'Degree'}</span>
                              <span className="text-[10px]">{app.institution || 'University'}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]">
                                {app.status || 'New'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#5A6C66]">
                              {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 bg-[#FFF9EB]/40 border border-[#9FB2AC]/60 rounded-xl text-center text-xs text-[#5A6C66]">
                    No candidates have submitted an application for this position yet.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FFF9EB] border-t border-[#9FB2AC] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#5A6C66] font-medium">
                Job ID: <code className="font-mono text-[#5D0D1A]">{viewingJob._id}</code>
              </span>
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="px-4 py-1.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-bold hover:bg-[#7A1424] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobManagement;
