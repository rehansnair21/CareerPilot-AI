import React, { useState } from 'react';
import { Search, Layers, User, Briefcase, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const AdminApplicationManagement = () => {
  const [search, setSearch] = useState('');

  const applications = [
    {
      _id: 'app_1',
      candidateName: 'Rehan S Nair',
      email: 'rehansnair@gmail.com',
      jobTitle: 'Senior Frontend Developer',
      company: 'CareerPilot AI Tech',
      appliedDate: '2026-08-15',
      status: 'Reviewing',
      matchScore: 92,
    },
    {
      _id: 'app_2',
      candidateName: 'Demo Student User',
      email: 'student@careerpilot.ai',
      jobTitle: 'AI Engineering Intern',
      company: 'Innovate AI Labs',
      appliedDate: '2026-08-14',
      status: 'Shortlisted',
      matchScore: 88,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight flex items-center gap-2">
            <Layers size={22} className="text-[#5D0D1A]" />
            Application Management ({applications.length})
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Global monitoring of job candidate submissions, recruitment pipeline stages, and candidate match scores.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6C66] bg-[#FFF9EB] px-3.5 py-2 rounded-xl border border-[#9FB2AC] shrink-0">
          <span>Submissions Recorded:</span>
          <strong className="text-[#5D0D1A] font-extrabold">{applications.length}</strong>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[22px] border border-[#9FB2AC] shadow-2xs overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-sm font-extrabold text-[#5D0D1A]">No applications submitted yet</h4>
            <p className="text-xs text-[#5A6C66] max-w-sm mx-auto">
              No candidate submissions recorded in the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-5">Candidate Name</th>
                  <th className="py-3.5 px-5">Applied Position</th>
                  <th className="py-3.5 px-5">Employer / Company</th>
                  <th className="py-3.5 px-5">Match Score</th>
                  <th className="py-3.5 px-5">Applied Date</th>
                  <th className="py-3.5 px-5">Pipeline Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9FB2AC]/60">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                    <td className="py-3.5 px-5 font-extrabold text-[#5D0D1A]">
                      <div>{app.candidateName}</div>
                      <div className="text-[10px] text-[#5A6C66] font-normal">{app.email}</div>
                    </td>
                    <td className="py-3.5 px-5 text-[#5D0D1A] font-extrabold">{app.jobTitle}</td>
                    <td className="py-3.5 px-5 text-[#5D0D1A] font-semibold">🏢 {app.company}</td>
                    <td className="py-3.5 px-5">
                      <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ⚡ {app.matchScore}% Match
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#5A6C66]">{app.appliedDate}</td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          app.status === 'Shortlisted'
                            ? 'bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]'
                            : app.status === 'Reviewing'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {app.status}
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

export default AdminApplicationManagement;
