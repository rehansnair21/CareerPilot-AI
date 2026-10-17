import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Download,
  Share2,
  ChevronDown,
  FileCheck,
  Briefcase,
  Layers,
  Type,
  Users,
  Check,
  BarChart3,
  ExternalLink,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const ResumeAnalysis = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);

  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [error, setError] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [syncingSkills, setSyncingSkills] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState('');

  const fileInputRef = useRef(null);

  const predefinedRoles = [
    'Full Stack Developer',
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Data Scientist',
    'Data Analyst',
    'UI/UX Designer',
    'DevOps Engineer',
    'Product Manager',
  ];

  // Fetch latest analysis on mount
  useEffect(() => {
    fetchLatestAnalysis();
  }, []);

  const fetchLatestAnalysis = async () => {
    setLoadingInitial(true);
    try {
      const res = await api.get('/student/resume/latest');
      if (res.data && res.data.success && res.data.data.hasAnalysis) {
        setAnalysis(res.data.data.analysis);
        if (res.data.data.analysis.targetRole) {
          setTargetRole(res.data.data.analysis.targetRole);
        }
      }
    } catch (err) {
      console.warn('Could not fetch existing resume analysis:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleRemoveFile = async () => {
    try {
      await api.delete('/student/resume');
    } catch (err) {
      console.warn('Error deleting resume analysis from server:', err);
    } finally {
      setFile(null);
      setPastedText('');
      setAnalysis(null);
      setError(null);
      setSyncSuccess('');
      setIsReanalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onAnalysisComplete) {
        onAnalysisComplete(0);
      }
    }
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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (selectedFile) => {
    setError(null);
    if (!selectedFile) return false;

    const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'svg', 'heic'];
    const validExtensions = ['pdf', 'docx', 'doc', 'txt'];
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();

    if (imageExts.includes(fileExt)) {
      setError('Photos and certificate images are not supported. Please upload your complete resume in PDF, DOCX, or TXT format.');
      return false;
    }

    if (!validExtensions.includes(fileExt)) {
      setError('Invalid file format. Please upload a PDF, DOCX, DOC, or TXT resume document.');
      return false;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please upload a smaller file.');
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleAnalyze = async (overrideFile = null, isReanalyze = false) => {
    const fileToUse = overrideFile || file;
    const reanalyzeFlag = isReanalyze && !overrideFile;
    setIsReanalyzing(reanalyzeFlag);
    setError(null);
    setSyncSuccess('');

    if (!fileToUse && !pastedText.trim()) {
      setError('Please select a resume file or paste your resume text to analyze.');
      return;
    }

    const effectiveRole = isCustomRole ? customRole.trim() : targetRole;
    if (!effectiveRole) {
      setError('Please select or specify a target job role.');
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress(15);
    setAnalysisStep(reanalyzeFlag ? 'Re-analyzing existing resume...' : 'Extracting resume structure & section headers...');

    const progressTimer1 = setTimeout(() => {
      setAnalysisProgress(45);
      setAnalysisStep('Scanning keyword density & target role match...');
    }, 800);

    const progressTimer2 = setTimeout(() => {
      setAnalysisProgress(75);
      setAnalysisStep('Evaluating ATS metrics, formatting & bullet impact...');
    }, 1600);

    try {
      let res;
      if (fileToUse) {
        const formData = new FormData();
        formData.append('resume', fileToUse);
        formData.append('targetRole', effectiveRole);

        res = await api.post('/student/resume/analyze', formData);
      } else {
        res = await api.post('/student/resume/analyze', {
          resumeText: pastedText,
          fileName: 'Pasted Resume Text',
          targetRole: effectiveRole,
        });
      }

      setAnalysisProgress(100);
      setAnalysisStep('Analysis complete!');

      if (res.data && res.data.success) {
        setAnalysis(res.data.data.analysis);
        if (onAnalysisComplete) {
          onAnalysisComplete(res.data.data.resumeScore);
        }
      } else {
        setError(res.data?.message || 'Failed to analyze resume. Please try again.');
      }
    } catch (err) {
      console.error('[Analyze Resume Error]:', err);
      setError(err.response?.data?.message || 'An error occurred during AI analysis.');
    } finally {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      setTimeout(() => {
        setAnalyzing(false);
      }, 400);
    }
  };

  const handleSyncSkills = async () => {
    setSyncingSkills(true);
    setSyncSuccess('');
    setError(null);
    try {
      const res = await api.post('/student/resume/sync-skills');
      if (res.data && res.data.success) {
        setSyncSuccess(res.data.message);
      } else {
        setError(res.data?.message || 'Unable to sync skills');
      }
    } catch (err) {
      console.error('Error syncing skills:', err);
      setError(err.response?.data?.message || 'Failed to sync skills to profile');
    } finally {
      setSyncingSkills(false);
    }
  };

  // Real values when analysis exists, or empty arrays/0 when cleared
  const detectedSkills = analysis?.detectedSkills || [];
  const missingSkills = analysis?.missingKeywords || [];

  const overallScore = analysis?.atsScore || 0;
  const atsCompatibilityPct = analysis?.sectionScores?.formatting || 0;
  const weaknessesList = analysis?.weaknesses?.length ? analysis.weaknesses : (analysis?.improvements || []);

  const getStandingInfo = (score) => {
    if (!score || score <= 0) {
      return {
        label: 'No Resume Analyzed',
        badgeClass: 'text-[#5A6C66] bg-[#FFF9EB] border-[#9FB2AC]',
        Icon: TrendingUp
      };
    }
    if (score >= 85) {
      return {
        label: 'Excellent standing',
        badgeClass: 'text-emerald-900 bg-emerald-100 border-emerald-400',
        Icon: ShieldCheck
      };
    }
    if (score >= 70) {
      return {
        label: 'Good standing',
        badgeClass: 'text-emerald-800 bg-emerald-50 border-emerald-300',
        Icon: TrendingUp
      };
    }
    if (score >= 50) {
      return {
        label: 'Fair standing',
        badgeClass: 'text-amber-800 bg-amber-50 border-amber-300',
        Icon: TrendingUp
      };
    }
    return {
      label: 'Needs improvement',
      badgeClass: 'text-rose-800 bg-rose-50 border-rose-300',
      Icon: AlertTriangle
    };
  };

  const standing = getStandingInfo(overallScore);
  const StandingIcon = standing.Icon;

  const hasPriorAnalysis = Boolean(analysis && (analysis.fileName || analysis.atsScore || analysis.analyzedAt));
  const hasLoadedFile = Boolean(file || hasPriorAnalysis);
  const currentFileName = file ? file.name : (analysis?.fileName || 'Uploaded Resume Document');
  const currentFileSize = file ? `${(file.size / 1024).toFixed(1)} KB` : (analysis?.fileSize || 'Saved from profile');

  if (loadingInitial) {
    return (
      <div className="bg-white rounded-[24px] p-12 border border-[#9FB2AC] shadow-xs flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#5D0D1A] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#5D0D1A] font-extrabold text-sm">Loading Resume Analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1300px] mx-auto pb-12">
      {/* PAGE HEADER */}
      <div className="space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#5D0D1A] tracking-tight">Resume Analysis</h1>
        <p className="text-xs md:text-sm font-semibold text-[#5A6C66] max-w-2xl leading-relaxed">
          Upload your resume to receive AI-powered insights, ATS scoring, and specific recommendations to land your dream role.
        </p>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-extrabold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* SUCCESS SYNC ALERT */}
      {syncSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {/* MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ================= LEFT COLUMN (8 COLS) ================= */}
        <div className="lg:col-span-8 space-y-6">

          {/* CARD 1: UPLOAD RESUME AREA */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-6">

            {/* Target Role Selector & Upload Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#9FB2AC]/50 pb-5">
              <div className="flex-1 space-y-1.5 max-w-md">
                <label className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                  <Target size={14} className="text-[#5D0D1A]" />
                  Target Role:
                </label>
                {!isCustomRole ? (
                  <div className="relative">
                    <select
                      value={targetRole}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomRole(true);
                        } else {
                          setTargetRole(e.target.value);
                        }
                      }}
                      className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs font-extrabold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30 transition-all appearance-none cursor-pointer pr-8"
                    >
                      {predefinedRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                      <option value="CUSTOM">+ Custom Role...</option>
                    </select>
                    <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A6C66] pointer-events-none" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. AI Engineer"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="flex-1 bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs font-extrabold text-[#2D060D] focus:outline-none"
                    />
                    <button
                      onClick={() => setIsCustomRole(false)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-[#5A6C66] border border-[#9FB2AC] hover:bg-[#FFF9EB]"
                    >
                      Preset
                    </button>
                  </div>
                )}
              </div>

              {/* Mode Toggle: File Upload vs Paste */}
              <div className="flex items-center bg-[#FFF9EB] p-1 rounded-xl border border-[#9FB2AC] shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setPasteMode(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${!pasteMode ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-2xs' : 'text-[#5A6C66] hover:text-[#5D0D1A]'
                    }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setPasteMode(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${pasteMode ? 'bg-[#5D0D1A] text-[#FFF9EB] shadow-2xs' : 'text-[#5A6C66] hover:text-[#5D0D1A]'
                    }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {/* Dropzone Box */}
            {!pasteMode ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-[20px] p-8 md:p-10 text-center transition-all flex flex-col items-center justify-center min-h-[220px] ${dragActive
                  ? 'border-[#5D0D1A] bg-[#FFF9EB]'
                  : hasLoadedFile
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-[#9FB2AC] bg-white hover:border-[#5D0D1A] hover:bg-[#FFF9EB]/50'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const f = e.target.files[0];
                      const isValid = handleFileChange(f);
                      if (isValid) {
                        handleAnalyze(f);
                      }
                    }
                  }}
                  className="hidden"
                />

                {/* Upload Icon Badge */}
                <div className="w-14 h-14 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center mb-4 shadow-2xs">
                  {hasLoadedFile ? <FileCheck size={28} className="text-emerald-700" /> : <UploadCloud size={26} />}
                </div>

                <h3 className="text-lg md:text-xl font-extrabold text-[#5D0D1A] mb-1">
                  {hasLoadedFile ? currentFileName : 'Drag and drop your resume'}
                </h3>
                <p className="text-xs font-semibold text-[#5A6C66] mb-6">
                  {hasLoadedFile ? `${currentFileSize} • Loaded from analysis` : 'PDF, DOCX supported (Max 5MB)'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing}
                    className={`px-6 py-3 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] text-[#FFF9EB] font-extrabold text-sm shadow-md shadow-[#5D0D1A]/20 transition-all ${analyzing
                      ? 'opacity-100 brightness-110 shadow-lg'
                      : 'hover:from-[#420912] hover:to-[#5D0D1A] hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                  >
                    {hasLoadedFile ? 'Change File' : 'Browse Files'}
                  </button>

                  {(hasLoadedFile || analyzing) && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAnalyze(null, true)}
                        disabled={analyzing}
                        className={`px-6 py-3 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 ${
                          analyzing
                            ? 'bg-emerald-700 text-white opacity-80 border border-emerald-500/40 cursor-not-allowed shadow-xs'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white opacity-100 shadow-md shadow-emerald-700/20'
                        }`}
                      >
                        <RefreshCw size={15} className={`shrink-0 ${analyzing ? 'animate-spin' : ''}`} />
                        <span>{analyzing ? (isReanalyzing ? 'Re-analyzing Resume...' : 'Analyzing Resume...') : 'Re-analyze'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        disabled={analyzing}
                        className={`px-6 py-3 font-extrabold text-sm rounded-xl transition-all border flex items-center gap-2 ${
                          analyzing
                            ? 'bg-red-100 text-red-900 border-red-300 opacity-100 shadow-sm'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 opacity-100 shadow-2xs'
                        }`}
                      >
                        <Trash2 size={15} className="shrink-0" />
                        <span>Remove File</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  placeholder="Paste your full resume text here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full bg-[#FFF9EB]/60 border border-[#9FB2AC] rounded-xl p-4 text-xs font-semibold text-[#2D060D] focus:outline-none focus:ring-2 focus:ring-[#5D0D1A]/30"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAnalyze()}
                    disabled={analyzing || !pastedText.trim()}
                    className={`px-6 py-2.5 font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all ${
                      analyzing
                        ? 'bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] opacity-80 border border-[#FFF9EB]/30 cursor-not-allowed shadow-xs'
                        : 'bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] opacity-100 shadow-md shadow-[#5D0D1A]/20 hover:opacity-95'
                    }`}
                  >
                    {analyzing && <RefreshCw size={14} className="animate-spin shrink-0" />}
                    <span>{analyzing ? (isReanalyzing ? 'Re-analyzing Resume...' : 'Analyzing Text...') : 'Analyze Pasted Resume'}</span>
                  </button>

                  {(pastedText || analysis) && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={analyzing}
                      className={`px-5 py-2.5 font-extrabold text-xs rounded-xl border flex items-center gap-1.5 transition-all ${analyzing
                        ? 'bg-red-100 text-red-900 border-red-300 opacity-100 shadow-sm'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 opacity-100'
                        }`}
                    >
                      <Trash2 size={14} />
                      <span>Clear Text & Reset</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Progress Loading Indicator */}
            {analyzing && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#5D0D1A]">
                  <span>{analysisStep}</span>
                  <span>{analysisProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/50">
                  <div
                    className="h-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] transition-all duration-300 rounded-full"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: DETECTED SKILLS & MISSING KEY SKILLS */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-6">

            {/* Detected Skills Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center">
                    <Target size={16} />
                  </div>
                  <h3 className="text-base font-extrabold text-[#5D0D1A]">Detected Skills</h3>
                </div>
                <span className="px-3 py-1 bg-[#FFF9EB] text-[#5D0D1A] text-xs font-extrabold rounded-full border border-[#9FB2AC]">
                  {detectedSkills.length} Identified
                </span>
              </div>

              {detectedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {detectedSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] font-extrabold text-xs rounded-full border border-[#9FB2AC] transition-colors shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/50 text-center">
                  <p className="text-xs font-semibold text-[#5A6C66]">
                    No skills detected yet. Upload a resume file to extract identified technical & soft skills.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-[#9FB2AC]/50" />

            {/* Missing Key Skills Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 flex items-center justify-center">
                    <AlertTriangle size={16} />
                  </div>
                  <h3 className="text-base font-extrabold text-[#5D0D1A]">Missing Key Skills</h3>
                </div>
                {missingSkills.length > 0 && (
                  <button
                    onClick={handleSyncSkills}
                    disabled={syncingSkills}
                    className="text-xs font-extrabold text-[#7A1424] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={12} className={`shrink-0 ${syncingSkills ? 'animate-spin' : ''}`} />
                    <span>Sync to Profile</span>
                  </button>
                )}
              </div>

              {missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {missingSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-amber-50 text-amber-900 font-extrabold text-xs rounded-full border border-amber-300 shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/50 text-center">
                  <p className="text-xs font-semibold text-[#5A6C66]">
                    No missing skills identified yet. Upload a resume to run ATS keyword comparison.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: AI IMPROVEMENT SUGGESTIONS */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-[#9FB2AC]/50 pb-4">
              <div className="w-8 h-8 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <h3 className="text-base font-extrabold text-[#5D0D1A]">AI Improvement Suggestions</h3>
            </div>

            {analysis ? (
              <div className="space-y-5">
                {/* Suggestion Item 1 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-[#FFF9EB]/60 border border-transparent hover:border-[#9FB2AC]/50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center shrink-0 shadow-2xs">
                    <BarChart3 size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#5D0D1A]">Quantify Your Achievements</h4>
                    <p className="text-xs font-semibold text-[#5A6C66] leading-relaxed">
                      {analysis.summary || 'Your resume describes tasks but lacks metrics. Add quantifiable data like "Reduced latency by 40%" or "Led a team of 12" to stand out.'}
                    </p>
                  </div>
                </div>

                {/* Suggestion Item 2 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-[#FFF9EB]/60 border border-transparent hover:border-[#9FB2AC]/50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                    <Type size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#5D0D1A]">Optimize Headline</h4>
                    <p className="text-xs font-semibold text-[#5A6C66] leading-relaxed">
                      {analysis.strengths?.[0] || `Ensure your resume title explicitly matches target role "${targetRole}" to trigger more recruiter hits.`}
                    </p>
                  </div>
                </div>

                {/* Suggestion Item 3 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-[#FFF9EB]/60 border border-transparent hover:border-[#9FB2AC]/50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#5D0D1A]">Strengthen Summary</h4>
                    <p className="text-xs font-semibold text-[#5A6C66] leading-relaxed">
                      {analysis.improvements?.[0] || 'Include clear career objectives and target achievements in your summary section.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/50 text-center space-y-2">
                <Sparkles size={24} className="text-[#5D0D1A] mx-auto" />
                <p className="text-xs font-extrabold text-[#5D0D1A]">No AI Recommendations Available</p>
                <p className="text-xs font-semibold text-[#5A6C66]">
                  Upload your resume above to generate AI-powered bullet rewrites, metric suggestions, and headline optimizations.
                </p>
              </div>
            )}
          </div>

          {/* CARD 4: IDENTIFIED RESUME WEAKNESSES */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#9FB2AC]/50 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                  <AlertCircle size={16} />
                </div>
                <h3 className="text-base font-extrabold text-[#5D0D1A]">Identified Resume Weaknesses</h3>
              </div>
              {analysis && weaknessesList.length > 0 && (
                <span className="px-3 py-1 bg-rose-50 text-rose-800 text-xs font-extrabold rounded-full border border-rose-200">
                  {weaknessesList.length} Area{weaknessesList.length > 1 ? 's' : ''} Flagged
                </span>
              )}
            </div>

            {analysis ? (
              <div className="space-y-3.5">
                {weaknessesList.map((weakness, i) => (
                  <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50/40 border border-rose-100 hover:border-rose-200 transition-all">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-extrabold text-xs shadow-2xs mt-0.5">
                      {i + 1}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-xs text-[#5D0D1A]">Weakness Indicator #{i + 1}</h4>
                      <p className="text-xs font-semibold text-[#5A6C66] leading-relaxed">
                        {weakness}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/50 text-center space-y-2">
                <AlertCircle size={24} className="text-[#5D0D1A] mx-auto" />
                <p className="text-xs font-extrabold text-[#5D0D1A]">No Resume Analyzed</p>
                <p className="text-xs font-semibold text-[#5A6C66]">
                  Upload your resume above to identify critical structural, keyword, and metric weaknesses.
                </p>
              </div>
            )}
          </div>
        </div>


        {/* ================= RIGHT SIDEBAR (4 COLS) ================= */}
        <div className="lg:col-span-4 space-y-6">

          {/* CARD 1: OVERALL RESUME SCORE */}
          <div className="bg-white rounded-[24px] p-6 border border-[#9FB2AC] shadow-xs text-center space-y-4">
            <h3 className="text-[11px] font-extrabold tracking-wider uppercase text-[#5A6C66]">
              OVERALL RESUME SCORE
            </h3>

            {/* Circular Gauge Ring */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#FFF9EB"
                  strokeWidth="9"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#5D0D1A"
                  strokeWidth="9"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - (overallScore / 100))}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-[#5D0D1A] tracking-tight">{overallScore}</span>
                <span className="text-[11px] font-bold text-[#5A6C66] mt-0.5">/ 100</span>
              </div>
            </div>

            <div className="pt-1">
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 ${standing.badgeClass}`}>
                <StandingIcon size={15} />
                {standing.label}
              </span>
            </div>
          </div>

          {/* CARD 2: ATS COMPATIBILITY */}
          <div className="bg-white rounded-[24px] p-5 border border-[#9FB2AC] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#5A6C66]">
                ATS COMPATIBILITY
              </span>
              <span className="text-base font-extrabold text-[#5D0D1A]">{atsCompatibilityPct}%</span>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="w-full h-2.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/50">
              <div
                className="h-full bg-[#5D0D1A] rounded-full transition-all duration-700"
                style={{ width: `${atsCompatibilityPct}%` }}
              />
            </div>

            <p className="text-xs text-[#5A6C66] font-semibold leading-normal pt-0.5">
              {atsCompatibilityPct >= 80
                ? 'Highly readable for modern Applicant Tracking Systems.'
                : atsCompatibilityPct >= 50
                  ? 'Moderately readable for modern Applicant Tracking Systems.'
                  : atsCompatibilityPct > 0
                    ? 'Low ATS readability. Formatting adjustments recommended.'
                    : 'Upload a resume to scan ATS readability.'}
            </p>
          </div>

          {/* CARD 3: ANALYSIS COMPLETE (Vibrant Bloodstone Card) */}
          <div className="bg-gradient-to-br from-[#420912] via-[#5D0D1A] to-[#7A1424] rounded-[24px] p-6 text-[#FFF9EB] shadow-xl shadow-[#5D0D1A]/30 border border-[#9FB2AC]/40 space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-[#FFF9EB]">
                {analysis ? 'Analysis Complete' : 'Analyze Your Resume'}
              </h3>
              <p className="text-xs text-[#FFF9EB]/90 font-medium leading-relaxed">
                {analysis
                  ? 'Your professional report is ready for download. This includes detailed skill gaps and optimized bullet points.'
                  : 'Upload a PDF or DOCX resume above to generate your AI-powered ATS score and optimization report.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {analysis ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Downloading full AI Resume & ATS Report PDF...');
                    }}
                    className="w-full py-3 px-4 bg-[#FFF9EB] hover:bg-[#F7EED8] active:scale-[0.99] text-[#5D0D1A] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#420912]/40 transition-all"
                  >
                    <Download size={16} />
                    <span>Download Full Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert('Sharing Resume Analysis report with your assigned Mentor!');
                    }}
                    className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-[#FFF9EB] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border border-white/20 transition-all"
                  >
                    <Share2 size={16} />
                    <span>Share with Mentor</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#420912]/40 transition-all"
                >
                  <UploadCloud size={16} />
                  <span>Upload Resume Now</span>
                </button>
              )}
            </div>
          </div>

          {/* CARD 4: MARKET COMPARISON */}
          <div className="bg-white rounded-[24px] p-5 border border-[#9FB2AC] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#5D0D1A]">Market Comparison</h3>

            <div className="space-y-3.5 text-xs font-semibold">
              {/* Row 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#5A6C66]">Education Level</span>
                  <span className="text-[#2D060D] font-extrabold">{analysis ? 'Top 15%' : 'N/A'}</span>
                </div>
                <div className="w-full h-1.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/40">
                  <div className="h-full bg-[#5D0D1A] rounded-full" style={{ width: analysis ? '85%' : '0%' }} />
                </div>
              </div>

              {/* Row 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#5A6C66]">Experience Years</span>
                  <span className="text-[#2D060D] font-extrabold">{analysis ? 'Mid-level' : 'N/A'}</span>
                </div>
                <div className="w-full h-1.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/40">
                  <div className="h-full bg-emerald-700 rounded-full" style={{ width: analysis ? '65%' : '0%' }} />
                </div>
              </div>

              {/* Row 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#5A6C66]">Salary Potential</span>
                  <span className="text-[#2D060D] font-extrabold">{analysis ? '$125k - $155k' : 'N/A'}</span>
                </div>
                <div className="w-full h-1.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/40">
                  <div className="h-full bg-[#5D0D1A] rounded-full" style={{ width: analysis ? '78%' : '0%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 5: MATCHING JOBS */}
          <div className="bg-white rounded-[24px] p-5 border border-[#9FB2AC] shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-[#5D0D1A]">Matching Jobs</h3>
            <p className="text-xs text-[#5A6C66] font-semibold">
              Based on your target role, we found relevant openings today.
            </p>

            <div className="p-3.5 rounded-2xl bg-[#FFF9EB]/70 border border-[#9FB2AC] flex items-center justify-between gap-2 mt-2">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-xs text-[#5D0D1A]">Frontend Architect</h4>
                <p className="text-[11px] text-[#5A6C66] font-semibold">Stripe • Remote</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  alert('Navigating to job details for Frontend Architect...');
                }}
                className="w-8 h-8 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] hover:bg-[#7A1424] flex items-center justify-center shrink-0 transition-colors shadow-2xs"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
