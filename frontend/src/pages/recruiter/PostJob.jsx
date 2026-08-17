import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import {
  MapPin,
  Calendar,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  UploadCloud,
  FileCheck,
  Trash2,
  FileText,
  RefreshCw
} from 'lucide-react';

export const PostJobPage = () => {
  const navigate = useNavigate();
  const jdFileInputRef = useRef(null);

  // Clean form state without hardcoded defaults
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    location: '',
    employmentType: '',
    description: '',
    experienceRequired: '',
    salaryRange: '',
    education: '',
    deadline: '',
    status: 'Active',
  });

  const [reqSkillInput, setReqSkillInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);

  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [preferredSkills, setPreferredSkills] = useState([]);

  // Job Description PDF / Document Upload State
  const [jdFile, setJdFile] = useState(null);
  const [jdFileBase64, setJdFileBase64] = useState('');
  const [jdMimeType, setJdMimeType] = useState('application/pdf');
  const [parsingJd, setParsingJd] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddReqSkill = () => {
    if (reqSkillInput.trim() && !requiredSkills.includes(reqSkillInput.trim())) {
      setRequiredSkills([...requiredSkills, reqSkillInput.trim()]);
      setReqSkillInput('');
    }
  };

  const handleRemoveReqSkill = (skill) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handleAddPrefSkill = () => {
    if (prefSkillInput.trim() && !preferredSkills.includes(prefSkillInput.trim())) {
      setPreferredSkills([...preferredSkills, prefSkillInput.trim()]);
      setPrefSkillInput('');
    }
  };

  const handleRemovePrefSkill = (skill) => {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill));
  };

  // Handle PDF / DOCX Job Description File Upload & Auto-Parsing
  const handleJdFileUpload = async (file) => {
    if (!file) return;

    const validExtensions = ['pdf', 'docx', 'doc', 'txt'];
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setErrorMsg('Invalid file format. Please upload a PDF, DOCX, or TXT Job Description document.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5MB limit. Please choose a smaller document.');
      return;
    }

    setErrorMsg('');
    setJdFile(file);
    setParsingJd(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      setJdFileBase64(evt.target.result || '');
      setJdMimeType(file.type || 'application/pdf');
    };
    reader.readAsDataURL(file);

    try {
      const uploadData = new FormData();
      uploadData.append('jdFile', file);

      const res = await api.post('/recruiter/jobs/parse-jd', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && res.data.success && res.data.data) {
        const { text, title } = res.data.data;
        
        setFormData((prev) => ({
          ...prev,
          description: text || prev.description,
          title: prev.title || title || '',
        }));

        setSuccessMsg(`Successfully parsed "${file.name}"! Description has been populated below.`);
      }
    } catch (err) {
      console.warn('Could not auto-parse JD PDF:', err);
      setSuccessMsg(`Uploaded "${file.name}". You can review and edit the details below.`);
    } finally {
      setParsingJd(false);
    }
  };

  const handleRemoveJdFile = () => {
    setJdFile(null);
    setJdFileBase64('');
    setJdMimeType('application/pdf');
    if (jdFileInputRef.current) {
      jdFileInputRef.current.value = '';
    }
    setFormData((prev) => ({ ...prev, description: '' }));
    setRequiredSkills([]);
    setPreferredSkills([]);
    setSuccessMsg('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleJdFileUpload(e.dataTransfer.files[0]);
    }
  };

  const formatText = (command) => {
    const snippets = {
      bold: '**bold text**',
      italic: '*italic text*',
      underline: '<u>underlined text</u>',
      bullet: '\n• Bullet item 1\n• Bullet item 2',
      number: '\n1. First item\n2. Second item',
      link: '[Link Text](https://example.com)'
    };
    if (snippets[command]) {
      setFormData((prev) => ({
        ...prev,
        description: prev.description + (prev.description ? ' ' : '') + snippets[command]
      }));
    }
  };

  const handleSubmit = async (e, forcedStatus = 'Active') => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.title) {
      setErrorMsg('Please fill in required field: Job Title.');
      return;
    }

    setSubmitting(true);

    try {
      const finalDesc =
        formData.description ||
        `${formData.title} position (${formData.employmentType || 'Full-time'}) located in ${
          formData.location || 'Remote/Hybrid'
        }. Required Skills: ${requiredSkills.join(', ') || 'Not specified'}. Experience: ${
          formData.experienceRequired || 'Entry level'
        }.`;

      const payload = {
        ...formData,
        description: finalDesc,
        status: forcedStatus,
        requiredSkills,
        preferredSkills,
        jdFileName: jdFile ? jdFile.name : '',
        jdFileBase64,
        jdMimeType,
      };

      const res = await api.post('/recruiter/jobs', payload);
      if (res.data && res.data.success) {
        setSuccessMsg(
          forcedStatus === 'Draft' ? 'Job draft saved successfully!' : 'Job position published successfully!'
        );
        setTimeout(() => {
          navigate('/recruiter/jobs');
        }, 1200);
      } else {
        setErrorMsg(res.data?.message || 'Failed to post job position.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Server error posting job position.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RecruiterLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* PAGE HEADER */}
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">
            Post a New Job
          </h1>
          <p className="text-xs md:text-sm font-semibold text-[#5A6C66]">
            Create a position manually or upload a PDF job description document.
          </p>
        </div>

        {/* ALERTS */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-800 hover:underline text-[11px]">Dismiss</button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-extrabold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-500 hover:underline text-[11px]">Dismiss</button>
          </div>
        )}

        {/* MAIN JOB CREATION FORM */}
        <form onSubmit={(e) => handleSubmit(e, 'Active')} className="space-y-8">
          
          {/* TOP GRID: 2 SIDE-BY-SIDE EQUAL CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* LEFT CARD: JOB INFORMATION */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-5">
              <h2 className="text-base font-extrabold text-[#5D0D1A]">Job Information</h2>
              <div className="border-b border-[#9FB2AC]/50" />

              {/* Job Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Job Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Senior Product Designer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A] transition-all"
                  required
                />
              </div>

              {/* Employment Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Employment Type</label>
                <div className="relative">
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl px-4 py-2.5 text-xs font-extrabold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A] appearance-none pr-8 transition-all cursor-pointer"
                  >
                    <option value="">Select Employment Type...</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6C66] pointer-events-none" />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Location</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
                  <input
                    type="text"
                    placeholder="e.g., New York, NY or Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A] transition-all"
                  />
                </div>
              </div>

              {/* Experience & Salary Range Side-by-Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#5D0D1A]">Experience</label>
                  <div className="relative">
                    <select
                      value={formData.experienceRequired}
                      onChange={(e) => setFormData({ ...formData, experienceRequired: e.target.value })}
                      className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl px-3 py-2.5 text-xs font-extrabold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 appearance-none pr-7 transition-all cursor-pointer"
                    >
                      <option value="">Select Experience...</option>
                      <option value="Entry Level">Entry Level</option>
                      <option value="1-3 Years">1-3 Years</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="Senior Level">Senior Level</option>
                      <option value="5+ Years">5+ Years</option>
                      <option value="Executive">Executive</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A6C66] pointer-events-none" />
                  </div>
                </div>

                {/* Salary Range */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#5D0D1A]">Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g. $80k - $120k"
                    value={formData.salaryRange}
                    onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                    className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT CARD: APPLICATION DETAILS */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-5">
              <h2 className="text-base font-extrabold text-[#5D0D1A]">Application Details</h2>
              <div className="border-b border-[#9FB2AC]/50" />

              {/* Application Deadline */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Application Deadline</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6C66]" />
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 focus:border-[#5D0D1A] transition-all"
                  />
                </div>
              </div>

              {/* Education Requirement */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Education Requirement</label>
                <div className="relative">
                  <select
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl px-4 py-2.5 text-xs font-extrabold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 appearance-none pr-8 transition-all cursor-pointer"
                  >
                    <option value="">Select Education Requirement...</option>
                    <option value="None Required">None Required</option>
                    <option value="High School / Diploma">High School / Diploma</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="Doctorate / Ph.D.">Doctorate / Ph.D.</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6C66] pointer-events-none" />
                </div>
              </div>

              {/* Required Skills Chip Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#5D0D1A]">Required Skills</label>
                <div className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl p-2 flex flex-wrap items-center gap-1.5 min-h-[44px] focus-within:ring-2 focus-within:ring-[#5D0D1A]/30 focus-within:border-[#5D0D1A] transition-all">
                  {requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#FFF9EB] text-[#5D0D1A] text-xs font-extrabold rounded-lg inline-flex items-center gap-1.5 border border-[#9FB2AC] shadow-2xs"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReqSkill(skill)}
                        className="text-[#5D0D1A] hover:text-red-700 font-extrabold ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={requiredSkills.length === 0 ? "Type skill and press Enter..." : "Add skill..."}
                    value={reqSkillInput}
                    onChange={(e) => setReqSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddReqSkill();
                      }
                    }}
                    className="flex-1 bg-transparent border-none text-xs font-semibold text-[#2D060D] focus:outline-none min-w-[130px] px-1 py-0.5"
                  />
                </div>
                <p className="text-[11px] font-semibold text-[#5A6C66]">
                  Type a required skill and press Enter or comma (,) to add. Only skills you manually enter here will be saved.
                </p>
              </div>
            </div>
          </div>

          {/* CARD 3: UPLOAD JOB DESCRIPTION PDF / DOCUMENT */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#9FB2AC]/50 pb-3">
              <h2 className="text-base font-extrabold text-[#5D0D1A] flex items-center gap-2">
                <FileText size={18} className="text-[#5D0D1A]" />
                Upload Job Description Document (PDF / DOCX)
              </h2>
              <span className="text-xs font-semibold text-[#5A6C66]">Optional • Auto-populates Job Details</span>
            </div>

            {/* File Upload Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[20px] p-6 text-center transition-all flex flex-col items-center justify-center min-h-[160px] ${
                dragActive
                  ? 'border-[#5D0D1A] bg-[#FFF9EB]'
                  : jdFile
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-[#9FB2AC] bg-[#FFF9EB]/30 hover:border-[#5D0D1A] hover:bg-[#FFF9EB]/60'
              }`}
            >
              <input
                ref={jdFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleJdFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center mb-3 shadow-2xs">
                {parsingJd ? (
                  <RefreshCw size={22} className="animate-spin text-[#5D0D1A]" />
                ) : jdFile ? (
                  <FileCheck size={24} className="text-emerald-700" />
                ) : (
                  <UploadCloud size={24} />
                )}
              </div>

              <h3 className="text-sm font-extrabold text-[#5D0D1A] mb-1">
                {parsingJd ? 'Extracting Job Details from Document...' : jdFile ? jdFile.name : 'Upload Job Description File'}
              </h3>
              <p className="text-xs font-semibold text-[#5A6C66] mb-4">
                {jdFile ? `${(jdFile.size / 1024).toFixed(1)} KB • Document Uploaded` : 'Drag & drop PDF, DOCX, or TXT file (Max 5MB)'}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => jdFileInputRef.current?.click()}
                  disabled={parsingJd}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] font-extrabold text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  {parsingJd ? 'Parsing File...' : jdFile ? 'Change Document' : 'Browse PDF File'}
                </button>

                {jdFile && (
                  <button
                    type="button"
                    onClick={handleRemoveJdFile}
                    disabled={parsingJd}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs rounded-xl transition-all border border-red-200 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 size={14} />
                    <span>Remove Document</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS FOOTER */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => navigate('/recruiter/jobs')}
              className="px-5 py-2.5 rounded-xl border border-[#9FB2AC] text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A] text-xs font-extrabold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, 'Draft')}
              className="px-5 py-2.5 rounded-xl border border-[#9FB2AC] text-[#5A6C66] hover:bg-[#FFF9EB] hover:text-[#5D0D1A] text-xs font-extrabold transition-all"
            >
              Save Draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles size={15} />
              <span>{submitting ? 'Publishing Job...' : 'Post Position'}</span>
            </button>
          </div>
        </form>
      </div>
    </RecruiterLayout>
  );
};
