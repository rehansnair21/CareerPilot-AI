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
  Trash2
} from 'lucide-react';

export const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

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
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert(err.response?.data?.message || 'Failed to delete application.');
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
            Review incoming candidate applications, assess ATS scores, and update candidate stages.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[#9FB2AC] pb-3 overflow-x-auto scrollbar-none">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                activeTab === tab
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
                    <th className="py-3 px-4">ATS Match Score</th>
                    <th className="py-3 px-4">Stage Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9FB2AC]/40 text-xs font-semibold text-[#2D060D]">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-[#5D0D1A]">{app.student?.fullName || 'Student Candidate'}</div>
                        <div className="text-[11px] text-[#5A6C66]">{app.student?.email}</div>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-[#2D060D]">{app.job?.title || 'Job Opening'}</td>
                      <td className="py-4 px-4 text-[#5A6C66]">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]">
                          {app.matchScore || 82}% Match
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(app._id, 'Shortlisted')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-extrabold hover:bg-emerald-100 transition-colors"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app._id, 'Rejected')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold hover:bg-amber-100 transition-colors"
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
      </div>
    </RecruiterLayout>
  );
};
