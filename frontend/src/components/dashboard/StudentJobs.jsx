import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  X,
  AlertCircle,
  FileText,
  Send,
  Layers,
  GraduationCap,
  Download
} from 'lucide-react';

export const StudentJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Selected Job Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');
  const [applyErrorMsg, setApplyErrorMsg] = useState('');
  const [coverNote, setCoverNote] = useState('');

  useEffect(() => {
    fetchStudentJobs();
  }, [selectedType]);

  const fetchStudentJobs = async (forceLoading = false) => {
    if (forceLoading || jobs.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const params = {};
      if (selectedType !== 'All') params.type = selectedType;

      const res = await api.get('/student/jobs', { params });
      if (res.data && res.data.success) {
        setJobs(res.data.data || []);
      } else {
        setError(res.data?.message || 'Failed to fetch job opportunities.');
      }
    } catch (err) {
      console.error('Error fetching student jobs:', err);
      setError('Unable to load job listings from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJd = async (job) => {
    if (!job || !job._id) return;
    try {
      const res = await api.get(`/student/jobs/${job._id}/download-jd`, {
        responseType: 'blob',
      });

      const disposition = res.headers['content-disposition'];
      let filename = job.jdFileName || `${job.companyName || 'Company'}_${job.title || 'Position'}_JD.pdf`;
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
      console.error('Error downloading JD document:', err);
      alert('Could not download Job Description document. Please try again.');
    }
  };

  const handleApply = async (jobId) => {
    setApplying(true);
    setApplySuccessMsg('');
    setApplyErrorMsg('');

    try {
      const res = await api.post('/student/jobs/apply', {
        jobId,
        coverNote,
      });

      if (res.data && res.data.success) {
        setApplySuccessMsg(res.data.message || 'Application submitted successfully!');
        
        // Update local jobs state to mark as applied
        setJobs((prevJobs) =>
          prevJobs.map((j) =>
            j._id === jobId ? { ...j, hasApplied: true, applicationsCount: (j.applicationsCount || 0) + 1 } : j
          )
        );

        if (selectedJob && selectedJob._id === jobId) {
          setSelectedJob((prev) => ({ ...prev, hasApplied: true }));
        }

        setTimeout(() => {
          setSelectedJob(null);
          setCoverNote('');
          setApplySuccessMsg('');
        }, 1800);
      } else {
        setApplyErrorMsg(res.data?.message || 'Failed to submit application.');
      }
    } catch (err) {
      setApplyErrorMsg(err.response?.data?.message || 'Server error submitting application.');
    } finally {
      setApplying(false);
    }
  };

  // Filter jobs by search term
  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      job.title?.toLowerCase().includes(q) ||
      job.companyName?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      job.requiredSkills?.some((s) => s.toLowerCase().includes(q)) ||
      job.preferredSkills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  const getCompanyInitials = (name) => {
    if (!name) return 'CP';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const employmentTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'];

  return (
    <div className="space-y-8 max-w-[1300px] mx-auto pb-12">
      {/* PAGE HEADER */}
      <div className="space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">
          Jobs & Internships
        </h1>
        <p className="text-xs md:text-sm font-semibold text-[#5A6C66] max-w-2xl leading-relaxed">
          Discover active career opportunities posted by verified recruiters on CareerPilot AI.
        </p>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white rounded-[24px] p-5 md:p-6 border border-[#9FB2AC] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
            <input
              type="text"
              placeholder="Search by title, company, skills, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6C66] hover:text-[#5D0D1A]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-extrabold text-[#5D0D1A] flex items-center gap-1 shrink-0 mr-1">
            <Filter size={13} /> Filter:
          </span>
          {employmentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold shrink-0 transition-all ${
                selectedType === type
                  ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-2xs'
                  : 'bg-[#FFF9EB]/60 text-[#5A6C66] border border-[#9FB2AC]/70 hover:bg-[#FFF9EB] hover:text-[#5D0D1A]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* JOBS GRID / LISTING */}
      {loading && jobs.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-[24px] p-6 border border-[#9FB2AC]/50 h-56 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-12 bg-gray-100 rounded-xl w-full" />
              <div className="h-8 bg-gray-200 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-[24px] p-8 text-center border border-[#9FB2AC] shadow-xs space-y-3 max-w-md mx-auto">
          <AlertCircle size={28} className="text-[#5D0D1A] mx-auto" />
          <h3 className="text-sm font-extrabold text-[#5D0D1A]">Failed to load jobs</h3>
          <p className="text-xs font-semibold text-[#5A6C66]">{error}</p>
          <button
            onClick={fetchStudentJobs}
            className="px-5 py-2 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold"
          >
            Retry
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#9FB2AC] shadow-xs space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center mx-auto shadow-2xs">
            <Briefcase size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-[#5D0D1A]">No Job Opportunities Found</h3>
            <p className="text-xs font-semibold text-[#5A6C66]">
              {searchTerm || selectedType !== 'All'
                ? 'No positions match your search filters. Try clearing your search query or selecting another employment type.'
                : 'Recruiters have not posted any active positions yet. Check back soon for new job listings!'}
            </p>
          </div>
          {(searchTerm || selectedType !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('All');
              }}
              className="px-5 py-2 rounded-xl border border-[#9FB2AC] text-[#5D0D1A] text-xs font-extrabold hover:bg-[#FFF9EB]"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-[24px] p-6 border border-[#9FB2AC] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
            >
              {/* Card Header: Company Logo & Basic Meta */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                      {getCompanyInitials(job.companyName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#7A1424]">
                          {job.companyName || 'Hiring Partner'}
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          Verified
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-[#5D0D1A] group-hover:text-[#7A1424] transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                    </div>
                  </div>
                  {job.employmentType && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] shrink-0">
                      {job.employmentType}
                    </span>
                  )}
                </div>

                {/* Job Metadata Badges */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#5A6C66] pt-1">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-[#5D0D1A]" /> {job.location}
                    </span>
                  )}
                  {job.salaryRange && (
                    <span className="flex items-center gap-1 font-extrabold text-[#2D060D]">
                      <DollarSign size={13} className="text-[#5D0D1A]" /> {job.salaryRange}
                    </span>
                  )}
                  {job.experienceRequired && (
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} className="text-[#5D0D1A]" /> {job.experienceRequired}
                    </span>
                  )}
                </div>

                {/* Required & Preferred Skills Chips */}
                {((job.requiredSkills && job.requiredSkills.length > 0) || (job.preferredSkills && job.preferredSkills.length > 0)) && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {job.requiredSkills?.slice(0, 4).map((skill, idx) => (
                      <span
                        key={`req-${idx}`}
                        className="px-2.5 py-1 rounded-lg bg-[#FFF9EB]/80 text-[#5D0D1A] text-[11px] font-extrabold border border-[#9FB2AC]/60"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.preferredSkills?.slice(0, Math.max(0, 4 - (job.requiredSkills?.length || 0))).map((skill, idx) => (
                      <span
                        key={`pref-${idx}`}
                        className="px-2.5 py-1 rounded-lg bg-[#FFF9EB]/50 text-[#5A6C66] text-[11px] font-extrabold border border-[#9FB2AC]/50"
                      >
                        {skill} (pref)
                      </span>
                    ))}
                    {((job.requiredSkills?.length || 0) + (job.preferredSkills?.length || 0)) > 4 && (
                      <span className="px-2 py-1 rounded-lg bg-gray-100 text-[#5A6C66] text-[11px] font-bold">
                        +{((job.requiredSkills?.length || 0) + (job.preferredSkills?.length || 0)) - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="pt-3 border-t border-[#9FB2AC]/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="text-xs font-extrabold text-[#5D0D1A] hover:underline flex items-center gap-1"
                  >
                    <FileText size={13} />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => handleDownloadJd(job)}
                    className="text-xs font-extrabold text-[#7A1424] hover:underline flex items-center gap-1"
                    title="Download official JD document"
                  >
                    <Download size={13} />
                    <span>JD PDF</span>
                  </button>
                </div>

                {job.hasApplied ? (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold flex items-center gap-1.5 cursor-default"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Applied</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-2xs transition-all hover:scale-[1.02]"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JOB DETAILS & APPLY MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-2xl w-full border border-[#9FB2AC] shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#9FB2AC]/50 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                  {getCompanyInitials(selectedJob.companyName)}
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[#7A1424] block">
                    {selectedJob.companyName || 'Hiring Partner'}
                  </span>
                  <h2 className="text-xl font-extrabold text-[#5D0D1A]">
                    {selectedJob.title}
                  </h2>
                  <p className="text-xs text-[#5A6C66] font-semibold flex items-center gap-2 pt-0.5">
                    <span>{selectedJob.location || 'Remote'}</span> • <span>{selectedJob.employmentType || 'Full-time'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setApplySuccessMsg('');
                  setApplyErrorMsg('');
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#5A6C66]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Alerts */}
            {applySuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{applySuccessMsg}</span>
              </div>
            )}

            {applyErrorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{applyErrorMsg}</span>
              </div>
            )}

            {/* Modal Body: Job Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FFF9EB] border border-[#9FB2AC] text-xs">
              <div>
                <span className="text-[#5A6C66] font-semibold block text-[11px]">Salary Range</span>
                <span className="font-extrabold text-[#5D0D1A]">{selectedJob.salaryRange || 'Negotiable'}</span>
              </div>
              <div>
                <span className="text-[#5A6C66] font-semibold block text-[11px]">Experience</span>
                <span className="font-extrabold text-[#5D0D1A]">{selectedJob.experienceRequired || 'Entry Level'}</span>
              </div>
              <div>
                <span className="text-[#5A6C66] font-semibold block text-[11px]">Education</span>
                <span className="font-extrabold text-[#5D0D1A]">{selectedJob.education || 'None Required'}</span>
              </div>
            </div>

            {/* Required Skills */}
            {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} /> Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requiredSkills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-[#FFF9EB] text-[#5D0D1A] text-xs font-extrabold rounded-lg border border-[#9FB2AC]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Skills */}
            {selectedJob.preferredSkills && selectedJob.preferredSkills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-[#5A6C66] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#5D0D1A]" /> Preferred Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.preferredSkills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-[#FFF9EB]/70 text-[#5A6C66] text-xs font-extrabold rounded-lg border border-[#9FB2AC]/70">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Official JD Document Download Banner */}
            <div className="bg-[#FFF9EB] p-3.5 rounded-2xl border border-[#9FB2AC] flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center shrink-0 shadow-2xs">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#5D0D1A]">Official Job Description Document</h4>
                  <p className="text-[11px] font-semibold text-[#5A6C66]">
                    {selectedJob.jdFileName ? `Recruiter File: ${selectedJob.jdFileName}` : 'CareerPilot AI Verified Job Description PDF'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadJd(selectedJob)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02] shrink-0"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> Full Job Description
              </h4>
              <div className="p-4 rounded-2xl bg-white border border-[#9FB2AC]/60 text-xs font-semibold text-[#2D060D] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedJob.description}
              </div>
            </div>

            {/* Optional Cover Note */}
            {!selectedJob.hasApplied && (
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Add an Optional Note to Recruiter</label>
                <textarea
                  rows={3}
                  placeholder="Introduce yourself or highlight why you're a great fit for this position..."
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl p-3 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30"
                />
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="pt-2 border-t border-[#9FB2AC]/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 rounded-xl border border-[#9FB2AC] text-[#5A6C66] text-xs font-extrabold hover:bg-[#FFF9EB]"
              >
                Close
              </button>

              {selectedJob.hasApplied ? (
                <button
                  disabled
                  className="px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold flex items-center gap-2 cursor-default"
                >
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Application Submitted</span>
                </button>
              ) : (
                <button
                  onClick={() => handleApply(selectedJob._id)}
                  disabled={applying}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={15} />
                  <span>{applying ? 'Submitting Application...' : 'Submit Application'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
