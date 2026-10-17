import React, { useState } from 'react';
import { Search, GraduationCap, FileText, CheckCircle2, Clock, Trash2, AlertCircle } from 'lucide-react';

export const AdminStudentManagement = ({ usersList = [], onDeleteUser, onToggleUserStatus }) => {
  const [search, setSearch] = useState('');

  const students = usersList.filter(
    (u) => u.role === 'student' || u.role === 'mentor'
  ).filter((s) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      (s.fullName && s.fullName.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight flex items-center gap-2">
            <GraduationCap size={22} className="text-[#5D0D1A]" />
            Student Management ({students.length})
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Manage student learning profiles, resume analysis statuses, assessment records, and account permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6C66] bg-[#FFF9EB] px-3.5 py-2 rounded-xl border border-[#9FB2AC] shrink-0">
          <span>Active Students:</span>
          <strong className="text-[#5D0D1A] font-extrabold">{students.length}</strong>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] transition-all font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[22px] border border-[#9FB2AC] shadow-2xs overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-sm font-extrabold text-[#5D0D1A]">No student accounts found</h4>
            <p className="text-xs text-[#5A6C66] max-w-sm mx-auto">
              No registered students match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-5">Student Name</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Profile Status</th>
                  <th className="py-3.5 px-5">Assessment Status</th>
                  <th className="py-3.5 px-5">Resume Status</th>
                  <th className="py-3.5 px-5">Account Status</th>
                  <th className="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9FB2AC]/60">
                {students.map((st) => (
                  <tr key={st._id} className="hover:bg-[#FFF9EB]/60 transition-colors">
                    <td className="py-3.5 px-5 font-extrabold text-[#5D0D1A]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold text-xs flex items-center justify-center shrink-0">
                          {(st.fullName || st.name || 'S').substring(0, 2).toUpperCase()}
                        </div>
                        <span>{st.fullName || st.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#5A6C66] font-medium">{st.email}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                        <CheckCircle2 size={11} /> Complete
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 text-[#5D0D1A] font-bold bg-[#FFF9EB] px-2.5 py-0.5 rounded-full border border-[#9FB2AC] text-[10px]">
                        Verified
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 text-[10px]">
                        <FileText size={11} /> Analyzed
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {st.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onToggleUserStatus && onToggleUserStatus(st)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border ${
                            st.isActive !== false
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                          }`}
                          title={st.isActive !== false ? 'Deactivate student login' : 'Activate student login'}
                        >
                          {st.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => onDeleteUser && onDeleteUser(st)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[11px] font-extrabold transition-all"
                          title="Delete student account"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
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

export default AdminStudentManagement;
