import React, { useState } from 'react';
import { Search, Briefcase, Building2, MapPin, Users, Calendar, Trash2, AlertCircle } from 'lucide-react';

export const AdminJobManagement = ({ jobsList = [] }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredJobs = jobsList.filter((j) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (j.title && j.title.toLowerCase().includes(query)) ||
      (j.companyName && j.companyName.toLowerCase().includes(query)) ||
      (j.location && j.location.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || (j.status || 'Active').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight flex items-center gap-2">
            <Briefcase size={22} className="text-[#5D0D1A]" />
            Job Openings Management ({filteredJobs.length})
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Review and oversee active job postings, employer submissions, and applicant counts across the platform.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6C66] bg-[#FFF9EB] px-3.5 py-2 rounded-xl border border-[#9FB2AC] shrink-0">
          <span>Total Posted Openings:</span>
          <strong className="text-[#5D0D1A] font-extrabold">{jobsList.length}</strong>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {['all', 'Active', 'Pending', 'Closed', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                  statusFilter === status
                    ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-2xs'
                    : 'bg-[#FFF9EB] text-[#5A6C66] border-[#9FB2AC] hover:bg-[#F7EED8] hover:text-[#5D0D1A]'
                }`}
              >
                {status === 'all' ? 'All Status' : status}
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
              No active or historical job openings match your search filters.
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9FB2AC]/60">
                {filteredJobs.map((j) => (
                  <tr key={j._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                    <td className="py-3.5 px-5 font-extrabold text-[#5D0D1A]">
                      {j.title}
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
                      <span className="font-extrabold text-[#5D0D1A] bg-[#FFF9EB] px-2.5 py-1 rounded-lg border border-[#9FB2AC]">
                        {j.applicationsCount || 0} candidates
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#5A6C66]">
                      {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          (j.status || 'Active') === 'Active'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : (j.status || '') === 'Pending'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {j.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminJobManagement;
