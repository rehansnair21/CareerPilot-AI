import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { EmptyState } from '../../components/recruiter/EmptyState';
import {
  Users,
  Search,
  Award,
  GraduationCap,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  UserCheck,
  Star,
  FileCheck,
  Trash2
} from 'lucide-react';

export const CandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [shortlisted, setShortlisted] = useState([]);

  useEffect(() => {
    fetchCandidates();
  }, [search]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/recruiter/candidates${searchParam}`);
      if (res.data && res.data.success) {
        setCandidates(res.data.data);
      }
    } catch (err) {
      console.warn('Notice fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleShortlist = (candId) => {
    if (shortlisted.includes(candId)) {
      setShortlisted(shortlisted.filter((id) => id !== candId));
    } else {
      setShortlisted([...shortlisted, candId]);
    }
  };

  const handleDeleteCandidate = async (appId) => {
    if (!window.confirm('Are you sure you want to remove this candidate application?')) return;
    try {
      const res = await api.delete(`/recruiter/applications/${appId}`);
      if (res.data && res.data.success) {
        setCandidates((prev) => prev.filter((c) => c._id !== appId));
      }
    } catch (err) {
      console.error('Error removing candidate:', err);
      alert(err.response?.data?.message || 'Failed to remove candidate.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <RecruiterLayout searchVal={search} setSearchVal={setSearch}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">
              Job Applicants & Candidates
            </h1>
            <p className="text-xs md:text-sm font-semibold text-[#5A6C66]">
              Review student applicants who have submitted applications for your job openings.
            </p>
          </div>
        </div>

        {/* Candidate Search Bar */}
        <div className="bg-white rounded-[22px] p-4 border border-[#9FB2AC] shadow-2xs flex items-center gap-3">
          <Search size={18} className="text-[#5A6C66]" />
          <input
            type="text"
            placeholder="Search applicants by candidate name, position title, or technical skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-semibold text-[#2D060D] focus:outline-none placeholder:text-[#5A6C66]"
          />
        </div>

        {/* Content View */}
        {loading ? (
          <div className="bg-white rounded-[24px] p-12 border border-[#9FB2AC] text-center">
            <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-[#5D0D1A]">Loading job applicants...</p>
          </div>
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No job applicants yet"
            description="Applicants will appear here automatically when students apply for your posted job positions."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map((cand) => {
              const isSaved = shortlisted.includes(cand._id);
              return (
                <div
                  key={cand._id}
                  className="bg-white rounded-[24px] p-6 border border-[#9FB2AC] shadow-2xs hover:shadow-md hover:border-[#5D0D1A] transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Avatar & Target Role */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] via-[#7A1424] to-[#420912] text-[#FFF9EB] flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
                        {getInitials(cand.name)}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-sm font-extrabold text-[#5D0D1A] truncate">{cand.name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] shrink-0">
                            {cand.status || 'New'}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-[#7A1424] truncate">
                          Applied: {cand.appliedJobTitle}
                        </p>
                        {cand.college && <p className="text-[11px] font-semibold text-[#5A6C66] truncate">{cand.college}</p>}
                      </div>
                    </div>

                    {/* Scores Matrix */}
                    <div className="grid grid-cols-2 gap-2 bg-[#FFF9EB]/60 p-3 rounded-xl border border-[#9FB2AC]">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-[#5A6C66] uppercase">ATS Match Score</span>
                        <div className="text-xs font-extrabold text-[#5D0D1A] flex items-center gap-1">
                          <FileCheck size={13} /> {cand.resumeScore > 0 ? `${cand.resumeScore}% Match` : 'Unscored'}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-[#5A6C66] uppercase">Skill Test Score</span>
                        <div className="text-xs font-extrabold text-emerald-800 flex items-center gap-1">
                          <Award size={13} /> {cand.assessmentScore > 0 ? `${cand.assessmentScore}% Score` : 'Pending Test'}
                        </div>
                      </div>
                    </div>

                    {/* Skills Badges */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#5A6C66]">Technical Competencies:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cand.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-[#FFF9EB] text-[#5D0D1A] text-[11px] font-extrabold border border-[#9FB2AC]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#9FB2AC]/50 flex items-center gap-2">
                    <button
                      onClick={() => toggleShortlist(cand._id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border ${isSaved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'border-[#9FB2AC] text-[#5D0D1A] hover:bg-[#FFF9EB]'
                        }`}
                    >
                      {isSaved ? 'Shortlisted' : 'Shortlist Candidate'}
                    </button>
                    <button
                      onClick={() => handleDeleteCandidate(cand._id)}
                      title="Delete Candidate Application"
                      className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};
