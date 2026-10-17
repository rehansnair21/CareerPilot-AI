import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { EmptyState } from '../../components/recruiter/EmptyState';
import {
  FileText,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  ExternalLink,
  ChevronDown,
  Eye,
  Award,
  Sparkles,
  Trash2,
  Download,
  GraduationCap,
  Briefcase,
  Code,
  Link as LinkIcon,
  Mail,
  Phone
} from 'lucide-react';

export const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedProfileApp, setSelectedProfileApp] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const statusParam = activeTab !== 'All' ? `?status=${activeTab}` : '';
      const res = await api.get(`/recruiter/applications${statusParam}`);
      if (res.data && res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.warn('Notice fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await api.put(`/recruiter/applications/${appId}/status`, { status: newStatus });
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      fetchApplications();
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application entry?')) return;
    try {
      const res = await api.delete(`/recruiter/applications/${appId}`);
      if (res.data && res.data.success) {
        setApplications((prev) => prev.filter((a) => a._id !== appId));
        if (selectedApp && selectedApp._id === appId) {
          setSelectedApp(null);
        }
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert(err.response?.data?.message || 'Failed to delete application.');
    }
  };

  const handleDownloadCandidateResume = async (app) => {
    if (!app || !app._id) return;
    try {
      const res = await api.get(`/recruiter/applications/${app._id}/download-resume`, {
        responseType: 'blob',
      });

      const disposition = res.headers['content-disposition'];
      let filename = app.resumeFileName || `${app.applicantName || 'Candidate'}_Resume.pdf`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading candidate resume:', err);
      alert('Could not download candidate resume. Please try again.');
    }
  };

  const handleOpenProfileModal = async (app) => {
    setSelectedProfileApp(app);
    setLoadingProfile(true);
    try {
      const res = await api.get(`/recruiter/applications/${app._id}/student-profile`);
      if (res.data && res.data.success && res.data.data) {
        setSelectedProfileApp((prev) => ({
          ...(prev || app),
          studentProfile: res.data.data.profile || prev?.studentProfile,
          studentUser: res.data.data.user || prev?.student,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch live student_profile collection data:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const statusTabs = ['All', 'New', 'Reviewing', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Shortlisted':
      case 'Selected':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Interview':
      case 'Reviewing':
        return 'bg-[#FFF9EB] text-[#5D0D1A] border-[#9FB2AC]';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <RecruiterLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">
            Candidate Applications Pipeline
          </h1>
          <p className="text-xs md:text-sm font-semibold text-[#5A6C66]">
            Review incoming candidate applications, view student profiles, and update candidate stages.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[#9FB2AC] pb-3 overflow-x-auto scrollbar-none">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${activeTab === tab
                  ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-2xs'
                  : 'text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A]'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Applications List / Empty State */}
        {loading ? (
          <div className="bg-white rounded-[24px] p-12 border border-[#9FB2AC] text-center">
            <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-[#5D0D1A]">Loading candidate applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Applications will appear here when candidates apply to your job postings."
          />
        ) : (
          <div className="bg-white rounded-[24px] p-6 border border-[#9FB2AC] shadow-xs space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#9FB2AC] text-[11px] font-extrabold uppercase text-[#5A6C66] tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Applied Position</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">Stage Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9FB2AC]/40 text-xs font-semibold text-[#2D060D]">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-[#5D0D1A]">
                          {app.applicantName || app.student?.fullName || app.student?.name || 'Student Candidate'}
                        </div>
                        <div className="text-[11px] text-[#5A6C66]">{app.applicantEmail || app.student?.email}</div>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-[#2D060D]">{app.job?.title || 'Job Opening'}</td>
                      <td className="py-4 px-4 text-[#5A6C66]">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenProfileModal(app)}
                            className="px-3 py-1.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold flex items-center gap-1 transition-all shadow-2xs hover:scale-[1.02]"
                            title="View student complete profile from student_profile collection"
                          >
                            <User size={14} />
                            <span>View Profile</span>
                          </button>
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-extrabold flex items-center gap-1 transition-all"
                            title="View candidate entered application details"
                          >
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => handleDownloadCandidateResume(app)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-extrabold flex items-center gap-1 transition-all"
                            title="Download candidate resume document"
                          >
                            <Download size={14} />
                            <span>Resume</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app._id, 'Shortlisted')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-extrabold hover:bg-emerald-100 transition-colors"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app._id, 'Rejected')}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold hover:bg-amber-100 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleDeleteApplication(app._id)}
                            title="Delete Application"
                            className="p-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
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

        {/* CANDIDATE APPLICATION DETAILS POP-UP MODAL */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[28px] max-w-2xl w-full border border-[#9FB2AC] shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#9FB2AC]/50 pb-4">
                <div>
                  <span className="text-[11px] font-extrabold text-[#7A1424] block uppercase tracking-wider">
                    Application Details • {selectedApp.job?.title || 'Job Opening'}
                  </span>
                  <h2 className="text-xl font-extrabold text-[#5D0D1A]">
                    {selectedApp.applicantName || selectedApp.student?.fullName || selectedApp.student?.name || 'Candidate Name'}
                  </h2>
                  <p className="text-xs text-[#5A6C66] font-semibold pt-0.5">
                    Submitted on {new Date(selectedApp.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(selectedApp.status)}`}>
                    {selectedApp.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#5A6C66]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Personal & Contact Info Card */}
              <div className="p-4 rounded-2xl bg-[#FFF9EB]/80 border border-[#9FB2AC] space-y-3 text-xs">
                <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} /> Personal & Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[#5A6C66] font-bold block text-[11px]">Full Name</span>
                    <span className="font-extrabold text-[#5D0D1A]">
                      {selectedApp.applicantName || selectedApp.student?.fullName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5A6C66] font-bold block text-[11px]">Email Address</span>
                    <span className="font-extrabold text-[#5D0D1A]">
                      {selectedApp.applicantEmail || selectedApp.student?.email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5A6C66] font-bold block text-[11px]">Phone Number</span>
                    <span className="font-extrabold text-[#5D0D1A]">
                      {selectedApp.applicantPhone || selectedApp.studentProfile?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Education Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#9FB2AC]/70 space-y-3 text-xs shadow-2xs">
                <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  🎓 Education Background
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[#5A6C66] font-bold block text-[11px]">Degree</span>
                    <span className="font-extrabold text-[#5D0D1A]">
                      {selectedApp.degree || selectedApp.studentProfile?.degree || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5A6C66] font-bold block text-[11px]">Institution / College</span>
                    <span className="font-extrabold text-[#5D0D1A]">
                      {selectedApp.institution || selectedApp.studentProfile?.college || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5A6C66] font-bold block text-[11px]">Graduation Year</span>
                    <span className="font-extrabold text-[#5D0D1A]">
                      {selectedApp.graduationYear || selectedApp.studentProfile?.graduationYear || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills Card */}
              <div className="p-4 rounded-2xl bg-[#FFF9EB]/80 border border-[#9FB2AC] space-y-2 text-xs">
                <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  ⚡ Technical Skills & Competencies
                </h4>
                {selectedApp.skills && selectedApp.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedApp.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-white text-[#5D0D1A] text-xs font-extrabold border border-[#9FB2AC]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#5A6C66] font-semibold italic">No specific skills specified</p>
                )}
              </div>

              {/* Experience Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#9FB2AC]/70 space-y-2 text-xs shadow-2xs">
                <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  💼 Experience Status
                </h4>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${selectedApp.experienceType === 'Experienced'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                    {selectedApp.experienceType || 'Fresher'}
                  </span>
                  <span className="font-semibold text-[#2D060D]">
                    {selectedApp.experienceDetails || 'Fresher (Entry Level)'}
                  </span>
                </div>
              </div>

              {/* Resume File Info Card */}
              <div className="p-4 rounded-2xl bg-[#FFF9EB] border border-[#9FB2AC] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[#5D0D1A]">Submitted Resume File</h5>
                    <p className="text-[11px] font-semibold text-[#5A6C66]">
                      {selectedApp.resumeFileName || selectedApp.studentProfile?.resumeAnalysis?.fileName || 'Resume Document'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadCandidateResume(selectedApp)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02] shrink-0"
                >
                  <Download size={14} />
                  <span>Download Resume</span>
                </button>
              </div>

              {/* Update Pipeline Stage Status */}
              <div className="p-4 rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC] space-y-2 text-xs">
                <label className="block font-extrabold text-[#5D0D1A] uppercase text-[11px]">
                  Update Application Pipeline Stage
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Reviewing', 'Shortlisted', 'Interview', 'Selected', 'Rejected'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedApp._id, st)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${selectedApp.status === st
                          ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-2xs'
                          : 'bg-white text-[#5D0D1A] border-[#9FB2AC] hover:bg-[#FFF9EB]'
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-[#9FB2AC]/50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-2xs hover:opacity-95 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STUDENT PROFILE POP-UP MODAL (EXACT STUDENT DASHBOARD PROFILE VIEW) */}
        {selectedProfileApp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-[#FFF9EB] rounded-[28px] max-w-4xl w-full border border-[#9FB2AC] shadow-2xl p-4 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto">
              
              {/* 1. TOP HEADER WITH CLOSE BUTTON */}
              <div className="flex items-center justify-between gap-4 border-b border-[#9FB2AC] pb-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#5D0D1A] tracking-tight">
                    Profile
                  </h1>
                  <p className="text-xs text-[#5A6C66] font-medium">
                    Verified Student Candidate Profile view from student dashboard
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProfileApp(null)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-[#5D0D1A] hover:text-red-700 border border-[#9FB2AC] text-xs font-extrabold transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <span>✕ Close</span>
                </button>
              </div>

              {/* 2. COMPACT PREMIUM PROFILE SUMMARY CARD (EXACT MATCH OF STUDENT DASHBOARD PROFILE HEADER) */}
              <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Avatar + Candidate Details */}
                  <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] text-[#FFF9EB] font-extrabold text-2xl flex items-center justify-center shadow-md shadow-[#5D0D1A]/20 shrink-0 ring-4 ring-[#FFF9EB]">
                      {(selectedProfileApp.applicantName || selectedProfileApp.student?.fullName || 'S').substring(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-extrabold text-[#5D0D1A]">
                          {selectedProfileApp.applicantName || selectedProfileApp.student?.fullName || selectedProfileApp.student?.name || 'Student Candidate'}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-md bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-[10px] font-extrabold uppercase">
                          Student
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 size={12} className="text-emerald-700" />
                          Verified
                        </span>
                      </div>

                      <p className="text-xs text-[#5A6C66] font-medium flex items-center gap-1.5">
                        <Mail size={13} className="text-[#5D0D1A]" />
                        {selectedProfileApp.applicantEmail || selectedProfileApp.student?.email || 'N/A'}
                      </p>
                      
                      <p className="text-xs text-[#5A6C66] font-medium flex items-center gap-1.5 pt-0.5">
                        <Phone size={13} className="text-[#5D0D1A]" />
                        {selectedProfileApp.applicantPhone || selectedProfileApp.studentProfile?.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Profile Strength Gauge */}
                  <div className="lg:col-span-5 bg-[#FFF9EB] p-4 sm:p-5 rounded-2xl border border-[#9FB2AC] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-[#5D0D1A]" />
                        <span className="text-xs font-extrabold text-[#5D0D1A]">Profile Strength</span>
                      </div>
                      <span className="text-base font-extrabold text-[#5D0D1A]">
                        {selectedProfileApp.studentProfile?.profileCompletion || 100}%
                      </span>
                    </div>

                    <div className="w-full bg-[#9FB2AC]/30 h-2.5 rounded-full overflow-hidden border border-[#9FB2AC]/40">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424]"
                        style={{ width: `${selectedProfileApp.studentProfile?.profileCompletion || 100}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-[#5A6C66] font-medium leading-relaxed">
                      Complete profile data verified from student dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. SECTION QUICK NAV TABS (MATCHING STUDENT DASHBOARD NAV BAR) */}
              <div className="sticky top-0 z-10 bg-[#FFF9EB] py-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#9FB2AC]">
                  {[
                    { id: 'sec-personal', label: 'Personal Information', icon: User },
                    { id: 'sec-academic', label: 'Academic Background', icon: GraduationCap },
                    { id: 'sec-career', label: 'Career Goals', icon: Briefcase },
                    { id: 'sec-skills', label: 'Skills & Expertise', icon: Code },
                    { id: 'sec-links', label: 'Professional Links', icon: LinkIcon },
                  ].map((sec) => {
                    const Icon = sec.icon;
                    return (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        className="inline-flex items-center gap-2 px-4 h-[38px] rounded-xl text-xs font-extrabold transition-all whitespace-nowrap bg-white text-[#5D0D1A] hover:bg-[#5D0D1A] hover:text-[#FFF9EB] border border-[#9FB2AC]"
                      >
                        <Icon size={14} />
                        <span>{sec.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* 4. FORM SECTIONS (EXACT COPIES OF STUDENT DASHBOARD PROFILE CARDS) */}
              <div className="space-y-6">
                
                {/* 1. PERSONAL INFORMATION */}
                <section
                  id="sec-personal"
                  className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-5"
                >
                  <div className="space-y-2 pb-3 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <User size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Personal Information</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">Contact and identification details</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">Full Name</label>
                      <input
                        type="text"
                        value={selectedProfileApp.applicantName || selectedProfileApp.student?.fullName || 'N/A'}
                        disabled
                        className="w-full h-[46px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 text-xs text-[#5D0D1A] font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">Email Address</label>
                      <input
                        type="email"
                        value={selectedProfileApp.applicantEmail || selectedProfileApp.student?.email || 'N/A'}
                        disabled
                        className="w-full h-[46px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 text-xs text-[#5D0D1A] font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">Phone Number</label>
                      <input
                        type="text"
                        value={selectedProfileApp.applicantPhone || selectedProfileApp.studentProfile?.phone || 'N/A'}
                        disabled
                        className="w-full h-[46px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 text-xs text-[#5D0D1A] font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">Target Career Role</label>
                      <input
                        type="text"
                        value={selectedProfileApp.studentProfile?.targetRole || selectedProfileApp.job?.title || 'Software Development'}
                        disabled
                        className="w-full h-[46px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 text-xs text-[#5D0D1A] font-bold"
                      />
                    </div>

                    {selectedProfileApp.studentProfile?.bio && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">Executive Summary / Bio</label>
                        <div className="p-3.5 bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] text-xs text-[#2D060D] font-semibold leading-relaxed">
                          {selectedProfileApp.studentProfile.bio}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 2. ACADEMIC BACKGROUND */}
                <section
                  id="sec-academic"
                  className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-5"
                >
                  <div className="space-y-2 pb-3 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Academic Background</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">Educational qualification & score details</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">College / University</label>
                      <input
                        type="text"
                        value={selectedProfileApp.institution || selectedProfileApp.studentProfile?.college || 'N/A'}
                        disabled
                        className="w-full h-[46px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 text-xs text-[#5D0D1A] font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">Degree</label>
                      <input
                        type="text"
                        value={selectedProfileApp.degree || selectedProfileApp.studentProfile?.degree || 'N/A'}
                        disabled
                        className="w-full h-[46px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 text-xs text-[#5D0D1A] font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">Graduation Year</label>
                      <input
                        type="text"
                        value={selectedProfileApp.graduationYear || selectedProfileApp.studentProfile?.graduationYear || 'N/A'}
                        disabled
                        className="w-full h-[46px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 text-xs text-[#5D0D1A] font-bold"
                      />
                    </div>

                    {selectedProfileApp.studentProfile?.cgpa && (
                      <div>
                        <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">CGPA / Score</label>
                        <input
                          type="text"
                          value={selectedProfileApp.studentProfile.cgpa}
                          disabled
                          className="w-full h-[46px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 text-xs text-[#5D0D1A] font-bold"
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* 3. CAREER GOALS & EXPERIENCE */}
                <section
                  id="sec-career"
                  className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-5"
                >
                  <div className="space-y-2 pb-3 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Career Goals & Work Experience</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">Target roles and experience level</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">Experience Status</label>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                          selectedProfileApp.experienceType === 'Experienced'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {selectedProfileApp.experienceType || 'Fresher'}
                        </span>
                        <span className="text-xs font-bold text-[#5D0D1A]">
                          {selectedProfileApp.experienceDetails || 'Fresher (Entry Level Candidate)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1.5 uppercase">Experience Duration</label>
                      <input
                        type="text"
                        value={selectedProfileApp.studentProfile?.experienceYears ? `${selectedProfileApp.studentProfile.experienceYears} Years` : 'Fresher (0 Years)'}
                        disabled
                        className="w-full h-[46px] bg-[#FFF9EB] border border-[#9FB2AC] rounded-[14px] px-4 text-xs text-[#5D0D1A] font-bold"
                      />
                    </div>
                  </div>
                </section>

                {/* 4. SKILLS & EXPERTISE */}
                <section
                  id="sec-skills"
                  className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-5"
                >
                  <div className="space-y-2 pb-3 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <Code size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Skills & Expertise</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">Technical competencies and soft skills</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold text-[#5D0D1A] mb-2 uppercase">Technical Competencies</label>
                      {(selectedProfileApp.skills?.length || selectedProfileApp.studentProfile?.technicalSkills?.length) ? (
                        <div className="flex flex-wrap gap-2">
                          {(selectedProfileApp.skills || selectedProfileApp.studentProfile?.technicalSkills || []).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3.5 py-1.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] text-xs font-extrabold border border-[#9FB2AC] shadow-2xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#5A6C66] font-semibold italic">No technical skills listed</p>
                      )}
                    </div>

                    {selectedProfileApp.studentProfile?.softSkills && selectedProfileApp.studentProfile.softSkills.length > 0 && (
                      <div>
                        <label className="block text-xs font-extrabold text-[#5A6C66] mb-2 uppercase">Interpersonal / Soft Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfileApp.studentProfile.softSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-xl bg-gray-50 text-[#5A6C66] text-xs font-bold border border-[#9FB2AC]/60"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 5. PROFESSIONAL LINKS */}
                <section
                  id="sec-links"
                  className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#9FB2AC] shadow-[0_2px_12px_-3px_rgba(93,13,26,0.06)] space-y-5"
                >
                  <div className="space-y-2 pb-3 border-b border-[#9FB2AC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center font-bold">
                        <LinkIcon size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#5D0D1A]">Professional Links</h3>
                        <p className="text-xs text-[#5A6C66] font-medium">GitHub, LinkedIn & Online Portfolios</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {selectedProfileApp.studentProfile?.githubUrl ? (
                      <a
                        href={selectedProfileApp.studentProfile.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] font-bold text-xs flex items-center gap-2 hover:bg-[#5D0D1A] hover:text-[#FFF9EB] transition-all shadow-2xs"
                      >
                        <ExternalLink size={14} /> GitHub Profile
                      </a>
                    ) : (
                      <span className="text-xs text-[#5A6C66] italic">No GitHub link provided</span>
                    )}

                    {selectedProfileApp.studentProfile?.linkedinUrl && (
                      <a
                        href={selectedProfileApp.studentProfile.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs flex items-center gap-2 hover:bg-blue-100 transition-all shadow-2xs"
                      >
                        <ExternalLink size={14} /> LinkedIn Profile
                      </a>
                    )}

                    {selectedProfileApp.studentProfile?.portfolioUrl && (
                      <a
                        href={selectedProfileApp.studentProfile.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-2 hover:bg-emerald-100 transition-all shadow-2xs"
                      >
                        <ExternalLink size={14} /> Personal Portfolio
                      </a>
                    )}
                  </div>
                </section>

                {/* 6. RESUME FILE BANNER */}
                <div className="p-5 rounded-2xl bg-[#FFF9EB] border border-[#9FB2AC] flex items-center justify-between gap-4 text-xs shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center shrink-0 shadow-2xs">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-[#5D0D1A] text-sm">Official Candidate Resume</h5>
                      <p className="text-xs font-semibold text-[#5A6C66]">
                        {selectedProfileApp.resumeFileName || selectedProfileApp.studentProfile?.resumeAnalysis?.fileName || 'Resume Document'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadCandidateResume(selectedProfileApp)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold flex items-center gap-2 shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] shrink-0"
                  >
                    <Download size={15} />
                    <span>Download Resume</span>
                  </button>
                </div>

              </div>

              {/* 5. MODAL FOOTER ACTIONS */}
              <div className="pt-4 border-t border-[#9FB2AC] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedProfileApp._id, 'Shortlisted')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold hover:bg-emerald-100 transition-colors"
                >
                  Shortlist Candidate
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProfileApp(null)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-2xs hover:opacity-95 transition-all"
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};

export default ApplicationsPage;
