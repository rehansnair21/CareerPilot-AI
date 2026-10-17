import React, { useState } from 'react';
import { Search, Trash2, ShieldCheck, Users, GraduationCap, Building2, User, Filter, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminUserManagement = ({ usersList = [], onDeleteUser, onToggleUserStatus }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = usersList.filter((u) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (u.fullName && u.fullName.toLowerCase().includes(query)) ||
      (u.username && u.username.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.companyName && u.companyName.toLowerCase().includes(query));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Module Title Header Card */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight flex items-center gap-2">
            <Users size={22} className="text-[#5D0D1A]" />
            User Management ({filteredUsers.length})
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Centralized directory of all student, recruiter, mentor, and admin accounts across database collections.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6C66] bg-[#FFF9EB] px-3.5 py-2 rounded-xl border border-[#9FB2AC] shrink-0">
          <span>Total Database Records:</span>
          <strong className="text-[#5D0D1A] font-extrabold">{usersList.length}</strong>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-[22px] p-5 border border-[#9FB2AC] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
            <input
              type="text"
              placeholder="Search by name, email, username, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#5D0D1A] placeholder-[#5A6C66] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5D0D1A]/20 focus:border-[#5D0D1A] transition-all font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Accounts' },
              { id: 'student', label: 'Students' },
              { id: 'recruiter', label: 'Recruiters' },
              { id: 'mentor', label: 'Mentors' },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => setRoleFilter(role.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                  roleFilter === role.id
                    ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-2xs'
                    : 'bg-[#FFF9EB] text-[#5A6C66] border-[#9FB2AC] hover:bg-[#F7EED8] hover:text-[#5D0D1A]'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-[22px] border border-[#9FB2AC] shadow-2xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC]">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-sm font-extrabold text-[#5D0D1A]">No user records found</h4>
            <p className="text-xs text-[#5A6C66] max-w-sm mx-auto">
              No registered accounts match your selected search query or role filter. Try clearing your filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] text-xs font-extrabold border border-[#9FB2AC] hover:bg-[#F7EED8] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF9EB] border-b border-[#9FB2AC] text-[#5A6C66] font-extrabold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-5">Name & Identifier</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Database Collection</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Registered Date</th>
                  <th className="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9FB2AC]/60">
                {filteredUsers.map((u) => (
                  <tr key={`${u.collectionName}-${u._id}`} className="hover:bg-[#FFF9EB]/60 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {(u.fullName || u.username || u.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-[#5D0D1A] group-hover:text-[#7A1424] transition-colors truncate">
                            {u.fullName || u.username || u.name}
                          </p>
                          {u.username && <p className="text-[10px] text-[#5A6C66]">@{u.username}</p>}
                          {u.companyName && <p className="text-[10px] text-[#5D0D1A] font-semibold">🏢 {u.companyName}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-[#5A6C66] font-medium">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]'
                            : u.role === 'recruiter'
                            ? 'bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]'
                            : u.role === 'mentor'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 font-mono text-[11px] text-[#5A6C66]">
                      <span className="bg-[#FFF9EB] px-2 py-0.5 rounded-md border border-[#9FB2AC]">
                        {u.collectionName}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      {u.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-[#5A6C66]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {u.role !== 'admin' ? (
                          <button
                            onClick={() => onToggleUserStatus && onToggleUserStatus(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border ${
                              u.isActive !== false
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                            }`}
                            title={u.isActive !== false ? 'Deactivate user login' : 'Activate user login'}
                          >
                            {u.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-[#5A6C66] italic">Protected System Account</span>
                        )}
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

export default AdminUserManagement;
