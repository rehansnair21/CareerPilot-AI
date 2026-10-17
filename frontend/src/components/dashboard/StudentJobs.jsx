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
  Download,
  User
} from 'lucide-react';

export const StudentJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Selected Job Modal State (Job Details)
  const [selectedJob, setSelectedJob] = useState(null);

  // Apply Modal State (Apply for Position Form)
  const [applyJobModal, setApplyJobModal] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');
  const [applyErrorMsg, setApplyErrorMsg] = useState('');

  // Application Form Fields
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDegree, setFormDegree] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formGraduationYear, setFormGraduationYear] = useState('');
  const [formSkills, setFormSkills] = useState('');
  const [formExpType, setFormExpType] = useState('Fresher'); // 'Fresher' | 'Experienced'
  const [formExpDetails, setFormExpDetails] = useState('');
  const [formResumeFile, setFormResumeFile] = useState(null);
  const [existingResumeName, setExistingResumeName] = useState('');
  const [formCoverNote, setFormCoverNote] = useState('');

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

  const openApplyModal = async (job) => {
    setApplySuccessMsg('');
    setApplyErrorMsg('');
    setFormResumeFile(null);
    setFormCoverNote('');
    setApplyJobModal(job);

    try {
      const res = await api.get('/student/profile');
      if (res.data && res.data.success) {
        const u = res.data.data.user || {};
        const p = res.data.data.profile || {};

        setFormFullName(u.name || u.fullName || '');
        setFormEmail(u.email || '');
        setFormPhone(p.phone || '');
        setFormDegree(p.degree || '');
        setFormInstitution(p.college || '');
        setFormGraduationYear(p.graduationYear ? String(p.graduationYear) : '');
        
        const skillsArray = p.technicalSkills || [];
        setFormSkills(skillsArray.join(', '));

        setExistingResumeName(p.resumeAnalysis?.fileName || '');

        if (p.experienceYears && p.experienceYears > 0) {
          setFormExpType('Experienced');
          setFormExpDetails(`${p.experienceYears} years experience`);
        } else {
          setFormExpType('Fresher');
          setFormExpDetails('');
        }
      }
    } catch (err) {
      console.warn('Could not auto-fetch student profile:', err);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!applyJobModal) return;

    if (!formSkills || !formSkills.trim()) {
      setApplyErrorMsg('Skills field is required to submit application.');
      return;
    }

    if (formExpType === 'Experienced' && !formExpDetails.trim()) {
      setApplyErrorMsg('Please specify your experience details.');
      return;
    }

    const cleanPhoneDigits = (formPhone || '').replace(/\D/g, '');
    if (!cleanPhoneDigits) {
      setApplyErrorMsg('Phone number is required to submit application.');
      return;
    }
    if (!/^[6-9]/.test(cleanPhoneDigits)) {
      setApplyErrorMsg('Phone number must start with 6, 7, 8, or 9.');
      return;
    }
    if (cleanPhoneDigits.length !== 10) {
      setApplyErrorMsg(`Phone number must contain exactly 10 digits (currently ${cleanPhoneDigits.length}).`);
      return;
    }

    setApplying(true);
    setApplySuccessMsg('');
    setApplyErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('jobId', applyJobModal._id);
      formData.append('fullName', formFullName);
      formData.append('email', formEmail);
      formData.append('phone', formPhone);
      formData.append('degree', formDegree);
      formData.append('institution', formInstitution);
      formData.append('graduationYear', formGraduationYear);
      formData.append('skills', formSkills);
      formData.append('experienceType', formExpType);
      formData.append('experienceDetails', formExpType === 'Fresher' ? 'Fresher' : formExpDetails);
      formData.append('coverNote', formCoverNote);

      if (formResumeFile) {
        formData.append('resume', formResumeFile);
      }

      const res = await api.post('/student/jobs/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data && res.data.success) {
        setApplySuccessMsg(res.data.message || 'Application submitted successfully!');
        setJobs((prevJobs) =>
          prevJobs.map((j) =>
            j._id === applyJobModal._id ? { ...j, hasApplied: true, applicationsCount: (j.applicationsCount || 0) + 1 } : j
          )
        );
        setTimeout(() => {
          setApplyJobModal(null);
        }, 1800);
      } else {
        setApplyErrorMsg(res.data?.message || 'Failed to submit application.');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setApplyErrorMsg(err.response?.data?.message || 'Failed to submit job application.');
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02]"
                    title="View complete job details in pop-up window"
                  >
                    <FileText size={13} className="text-[#5D0D1A]" />
                    <span>Job Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadJd(job)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF9EB] text-[#7A1424] border border-[#9FB2AC]/70 text-xs font-extrabold flex items-center gap-1.5 transition-all"
                    title="Download official JD document"
                  >
                    <Download size={13} />
                    <span>JD PDF</span>
                  </button>
                </div>

                {job.hasApplied ? (
                  job.applicationStatus === 'Shortlisted' ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5 cursor-default shadow-xs"
                      title="You have been shortlisted by the recruiter!"
                    >
                      <Sparkles size={14} className="text-amber-600" />
                      <span>Shortlisted</span>
                    </button>
                  ) : job.applicationStatus === 'Interview' ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-300 text-xs font-extrabold flex items-center gap-1.5 cursor-default shadow-xs"
                    >
                      <Calendar size={14} className="text-indigo-600" />
                      <span>Interview Round</span>
                    </button>
                  ) : job.applicationStatus === 'Selected' ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-extrabold flex items-center gap-1.5 cursor-default shadow-xs"
                    >
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      <span>Selected</span>
                    </button>
                  ) : job.applicationStatus === 'Rejected' ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold flex items-center gap-1.5 cursor-default"
                    >
                      <X size={14} className="text-gray-500" />
                      <span>Not Selected</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold flex items-center gap-1.5 cursor-default"
                    >
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Applied</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => openApplyModal(job)}
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

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-[#9FB2AC]/50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-2xs hover:opacity-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOB APPLICATION POP-UP MODAL */}
      {applyJobModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-2xl w-full border border-[#9FB2AC] shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#9FB2AC]/50 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-black text-base flex items-center justify-center shadow-xs shrink-0">
                  {getCompanyInitials(applyJobModal.companyName)}
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-[#7A1424] block uppercase tracking-wider">
                    Application Form • {applyJobModal.companyName}
                  </span>
                  <h2 className="text-xl font-extrabold text-[#5D0D1A]">
                    Apply for {applyJobModal.title}
                  </h2>
                  <p className="text-xs text-[#5A6C66] font-semibold pt-0.5">
                    {applyJobModal.location || 'Remote'} • {applyJobModal.employmentType || 'Full-time'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApplyJobModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#5A6C66] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Alert Messages */}
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

            {/* Application Form */}
            <form onSubmit={handleSubmitApplication} className="space-y-5 text-xs">
              {/* Section 1: Contact Details (Editable, Pre-filled from profile) */}
              <div className="p-4 rounded-2xl bg-[#FFF9EB]/80 border border-[#9FB2AC]/70 space-y-3">
                <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} /> Personal & Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#5D0D1A] font-extrabold mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-white border border-[#9FB2AC] rounded-xl px-3 py-2 text-xs font-bold text-[#5D0D1A] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 shadow-2xs"
                    />
                    <span className="text-[10px] text-[#5A6C66] font-semibold block pt-0.5">Pre-filled from profile (Editable)</span>
                  </div>

                  <div>
                    <label className="block text-[#5A6C66] font-extrabold mb-1">Email Address</label>
                    <input
                      type="email"
                      readOnly
                      value={formEmail}
                      className="w-full bg-white/80 border border-[#9FB2AC]/60 rounded-xl px-3 py-2 text-xs font-bold text-[#5D0D1A] cursor-not-allowed shadow-2xs"
                    />
                    <span className="text-[10px] text-emerald-700 font-bold block pt-0.5">✓ Account Email</span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[#5D0D1A] font-extrabold mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      placeholder="e.g. +91 9876543210"
                      value={formPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleanDigits = val.replace(/[^0-9+ ]/g, '');
                        setFormPhone(cleanDigits);
                      }}
                      className="w-full bg-white border border-[#9FB2AC] rounded-xl px-3 py-2 text-xs font-bold text-[#5D0D1A] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 shadow-2xs"
                    />
                    <span className="text-[10px] text-[#5A6C66] font-semibold block pt-0.5">Must be 10 digits starting with 6-9 (Pre-filled from profile)</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Resume File Upload (Manual Upload) */}
              <div className="p-4 rounded-2xl bg-white border border-[#9FB2AC]/70 space-y-3 shadow-2xs">
                <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><FileText size={14} /> Resume File</span>
                  <span className="text-[10px] text-[#5A6C66] font-extrabold bg-[#FFF9EB] px-2 py-0.5 rounded-md border border-[#9FB2AC]">Manual Upload</span>
                </h4>
                <div>
                  <label className="block text-[#5D0D1A] font-extrabold mb-1.5">
                    Upload Resume File from Computer (PDF / DOCX / TXT)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => setFormResumeFile(e.target.files[0] || null)}
                    className="w-full text-xs text-[#5A6C66] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-[#5D0D1A] file:text-[#FFF9EB] hover:file:bg-[#7A1424] cursor-pointer bg-[#FFF9EB]/50 p-2 border border-[#9FB2AC] rounded-xl"
                  />
                  {formResumeFile ? (
                    <span className="text-[11px] font-extrabold text-emerald-700 block pt-1.5">
                      ✓ Selected File to Upload: {formResumeFile.name} ({(formResumeFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : existingResumeName ? (
                    <span className="text-[11px] font-bold text-[#5A6C66] block pt-1.5">
                      📄 Currently Attached Profile Resume: {existingResumeName} (Select file above to upload a new version)
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Section 3: Education */}
              <div className="p-4 rounded-2xl bg-[#FFF9EB]/80 border border-[#9FB2AC]/70 space-y-3">
                <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap size={14} /> Education Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#5D0D1A] font-extrabold mb-1">Degree</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech Computer Science"
                      value={formDegree}
                      onChange={(e) => setFormDegree(e.target.value)}
                      className="w-full bg-white border border-[#9FB2AC] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5D0D1A] font-extrabold mb-1">Institution / College</label>
                    <input
                      type="text"
                      placeholder="e.g. Cochin University"
                      value={formInstitution}
                      onChange={(e) => setFormInstitution(e.target.value)}
                      className="w-full bg-white border border-[#9FB2AC] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5D0D1A] font-extrabold mb-1">Graduation Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026"
                      value={formGraduationYear}
                      onChange={(e) => setFormGraduationYear(e.target.value)}
                      className="w-full bg-white border border-[#9FB2AC] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Skills (Required) */}
              <div className="p-4 rounded-2xl bg-white border border-[#9FB2AC]/70 space-y-2 shadow-2xs">
                <label className="block text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Layers size={14} /> Skills <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-red-500 font-extrabold">Required</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python, React, Node.js, C++, Data Analysis"
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                  className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl p-3 text-xs font-bold text-[#5D0D1A] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30"
                />
                <p className="text-[10px] text-[#5A6C66] font-semibold">Separate multiple skills with commas.</p>
              </div>

              {/* Section 5: Experience */}
              <div className="p-4 rounded-2xl bg-[#FFF9EB]/80 border border-[#9FB2AC]/70 space-y-3">
                <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase size={14} /> Experience Status
                </h4>
                <div className="flex items-center gap-4">
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                    formExpType === 'Fresher'
                      ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-2xs'
                      : 'bg-white text-[#5A6C66] border-[#9FB2AC] hover:bg-[#FFF9EB]'
                  }`}>
                    <input
                      type="radio"
                      name="expType"
                      value="Fresher"
                      checked={formExpType === 'Fresher'}
                      onChange={() => setFormExpType('Fresher')}
                      className="hidden"
                    />
                    <span>Fresher</span>
                  </label>

                  <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                    formExpType === 'Experienced'
                      ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A] shadow-2xs'
                      : 'bg-white text-[#5A6C66] border-[#9FB2AC] hover:bg-[#FFF9EB]'
                  }`}>
                    <input
                      type="radio"
                      name="expType"
                      value="Experienced"
                      checked={formExpType === 'Experienced'}
                      onChange={() => setFormExpType('Experienced')}
                      className="hidden"
                    />
                    <span>Experienced</span>
                  </label>
                </div>

                {formExpType === 'Experienced' ? (
                  <div className="space-y-1">
                    <label className="block text-[#5D0D1A] font-extrabold">Experience Details</label>
                    <textarea
                      rows={2}
                      placeholder="Specify your years of experience, current role, or past internships..."
                      value={formExpDetails}
                      onChange={(e) => setFormExpDetails(e.target.value)}
                      className="w-full bg-white border border-[#9FB2AC] rounded-xl p-3 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30"
                    />
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Applying as a Fresher (Entry Level)</span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#9FB2AC]/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApplyJobModal(null)}
                  className="px-5 py-2.5 rounded-xl border border-[#9FB2AC] text-[#5A6C66] text-xs font-extrabold hover:bg-[#FFF9EB]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={applying}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={15} />
                  <span>{applying ? 'Submitting Application...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
