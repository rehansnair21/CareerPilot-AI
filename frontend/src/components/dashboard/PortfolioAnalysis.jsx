import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Code,
  Layers,
  ExternalLink,
  RefreshCw,
  Zap,
  Layout,
  Award,
  ArrowRight,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  Briefcase,
  Target,
  ChevronRight,
  Info,
  Lightbulb,
  Cpu,
  Flame,
  Star,
  Share2,
  CheckCircle,
  X
} from 'lucide-react';

export const PortfolioAnalysis = ({ onAnalysisComplete }) => {
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedSkills, setCopiedSkills] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const predefinedRoles = [
    'Software Engineer',
    'Full Stack Developer',
    'Frontend Engineer',
    'Backend Engineer',
    'Data Scientist',
    'UI/UX Developer',
    'DevOps & Cloud Engineer',
    'Mobile App Developer',
  ];

  const loadingSteps = [
    'Connecting to domain & validating SSL preview...',
    'Scraping live HTML content, DOM elements & tech stack...',
    'Running Google Gemini AI multi-criteria evaluation...',
    'Calculating recruiter appeal score & crafting actionable recommendations...'
  ];

  // Fetch initial profile & latest portfolio analysis on mount
  useEffect(() => {
    fetchLatestAnalysis();
  }, []);

  const fetchLatestAnalysis = async () => {
    setInitialLoading(true);
    try {
      const res = await api.get('/student/portfolio/latest');
      if (res.data && res.data.success && res.data.data) {
        if (res.data.data.portfolioUrl) {
          setPortfolioUrl(res.data.data.portfolioUrl);
        }
        if (res.data.data.hasAnalysis && res.data.data.portfolioAnalysis) {
          setAnalysisData(res.data.data.portfolioAnalysis);
        }
      }
    } catch (err) {
      console.error('Failed to load portfolio analysis:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  // Animate loading step messages
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleRoleSelect = (role) => {
    if (role === 'custom') {
      setIsCustomRole(true);
      setTargetRole(customRole || '');
    } else {
      setIsCustomRole(false);
      setTargetRole(role);
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const effectiveRole = isCustomRole ? customRole.trim() : targetRole.trim();

    if (!portfolioUrl || !portfolioUrl.trim()) {
      setErrorMsg('Please enter a valid portfolio website URL.');
      return;
    }

    if (!effectiveRole) {
      setErrorMsg('Please select or specify your target career role.');
      return;
    }

    let urlToSubmit = portfolioUrl.trim();
    if (!/^https?:\/\//i.test(urlToSubmit)) {
      urlToSubmit = `https://${urlToSubmit}`;
      setPortfolioUrl(urlToSubmit);
    }

    setLoading(true);
    try {
      const res = await api.post('/student/portfolio/analyze', {
        portfolioUrl: urlToSubmit,
        targetRole: effectiveRole,
      });

      if (res.data && res.data.success) {
        setAnalysisData(res.data.data.portfolioAnalysis);
        setSuccessMsg('Portfolio evaluated successfully with AI!');
        if (onAnalysisComplete) onAnalysisComplete();
      } else {
        setErrorMsg(res.data?.message || 'Failed to evaluate portfolio. Please check the URL.');
      }
    } catch (err) {
      console.error('Error analyzing portfolio:', err);
      const msg = err.response?.data?.message || 'Unable to connect to portfolio server. Ensure the URL is public.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLink = async () => {
    try {
      await api.delete('/student/portfolio');
    } catch (err) {
      console.warn('Error deleting portfolio analysis from server:', err);
    } finally {
      setPortfolioUrl('');
      setAnalysisData(null);
      setErrorMsg('');
      setSuccessMsg('Portfolio link removed. All values returned to normal.');
      if (onAnalysisComplete) onAnalysisComplete();
    }
  };

  const handleClearAnalysis = async () => {
    if (!window.confirm('Are you sure you want to reset your portfolio analysis data?')) return;
    handleRemoveLink();
  };

  const handleCopySummary = () => {
    if (!analysisData) return;
    const text = `Portfolio Analysis Summary (${analysisData.portfolioUrl})\nOverall Score: ${analysisData.overallScore}/100\n\nExecutive Review: ${analysisData.overallReview}\n\nTop Strengths:\n${analysisData.strengths?.map(s => `- ${s}`).join('\n')}\n\nKey Recommendations:\n${analysisData.recommendations?.map(r => `- ${r}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleCopySkills = () => {
    if (!analysisData?.detectedSkills) return;
    navigator.clipboard.writeText(analysisData.detectedSkills.join(', '));
    setCopiedSkills(true);
    setTimeout(() => setCopiedSkills(false), 2500);
  };

  const handleCopyRecommendation = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreBadge = (score) => {
    if (score >= 85) return { label: 'Elite Recruiter Appeal', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-300', bar: 'bg-emerald-600', ring: '#059669' };
    if (score >= 70) return { label: 'Strong Presentation', color: 'bg-amber-500/10 text-amber-800 border-amber-300', bar: 'bg-amber-500', ring: '#f59e0b' };
    return { label: 'Needs Optimization', color: 'bg-rose-500/10 text-rose-800 border-rose-300', bar: 'bg-rose-500', ring: '#f43f5e' };
  };

  const scoreInfo = analysisData ? getScoreBadge(analysisData.overallScore) : null;

  if (initialLoading) {
    return (
      <div className="bg-white rounded-[24px] p-12 border border-[#9FB2AC]/60 shadow-xs flex flex-col items-center justify-center min-h-[380px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-[#5D0D1A]/20 border-t-[#5D0D1A] rounded-full animate-spin" />
          <Globe size={24} className="absolute text-[#5D0D1A]" />
        </div>
        <span className="text-sm font-extrabold text-[#5D0D1A] tracking-wide">Loading AI Portfolio Analysis Engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <div className="bg-gradient-to-br from-[#420912] via-[#5D0D1A] to-[#7A1424] rounded-[28px] p-6 sm:p-9 text-[#FFF9EB] shadow-2xl relative overflow-hidden border border-[#FFF9EB]/10">
        {/* Background Decorative Blur Orbs */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[#9FB2AC]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF9EB]/15 backdrop-blur-md text-[#FFF9EB] text-xs font-extrabold border border-[#FFF9EB]/25 shadow-xs">
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
              <span>AI Portfolio Inspector</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] opacity-80 uppercase tracking-wider">Gemini 3.6 Engine</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#FFF9EB] leading-tight">
              Portfolio Website Analysis & Recruiter Assessment
            </h1>
            
            <p className="text-[#FFF9EB]/85 text-xs sm:text-sm leading-relaxed font-medium">
              Analyze your live personal website or GitHub portfolio to audit visual presentation, tech stack depth, project completeness, and recruiter conversion metrics.
            </p>
          </div>

          {/* Quick Metrics Badge Container */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
            <div className="bg-[#FFF9EB]/10 backdrop-blur-md p-4 rounded-2xl border border-[#FFF9EB]/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF9EB]/15 flex items-center justify-center text-[#FFF9EB]">
                <Globe size={22} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#FFF9EB]/70 uppercase tracking-wider">DOM Inspector</div>
                <div className="text-xs font-black text-[#FFF9EB]">Live Web Crawler</div>
              </div>
            </div>

            <div className="bg-[#FFF9EB]/10 backdrop-blur-md p-4 rounded-2xl border border-[#FFF9EB]/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF9EB]/15 flex items-center justify-center text-[#FFF9EB]">
                <ShieldCheck size={22} className="text-emerald-300" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#FFF9EB]/70 uppercase tracking-wider">Recruiter Benchmark</div>
                <div className="text-xs font-black text-[#FFF9EB]">4-Point Audit</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Card Container */}
      <div className="bg-white rounded-[26px] p-6 sm:p-8 border border-[#9FB2AC]/70 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#9FB2AC]/30 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5D0D1A]/10 text-[#5D0D1A] flex items-center justify-center font-bold">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#5D0D1A]">
                Analyze Portfolio Website
              </h2>
              <p className="text-xs text-[#5A6C66] font-medium">
                Provide your portfolio link and target job role for customized AI evaluation.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Portfolio URL Input */}
            <div className="lg:col-span-7 space-y-2">
              <label className="block text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center justify-between">
                <span>Portfolio Website URL <span className="text-rose-600">*</span></span>
                <span className="text-[11px] font-semibold text-[#5A6C66] lowercase">public link required</span>
              </label>
              
              <div className="relative flex items-center">
                <div className="absolute left-4 text-[#5A6C66] pointer-events-none">
                  <Globe size={20} />
                </div>
                <input
                  type="text"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="e.g. https://myportfolio.vercel.app or https://username.github.io"
                  className={`w-full pl-12 ${portfolioUrl ? 'pr-28' : 'pr-4'} py-3.5 rounded-xl border border-[#9FB2AC] focus:border-[#5D0D1A] focus:ring-2 focus:ring-[#5D0D1A]/20 bg-[#FFF9EB]/30 text-[#2D060D] font-medium text-sm transition-all outline-none`}
                  required
                />
                {portfolioUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="absolute right-2 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 transition-all flex items-center gap-1 hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                    title="Remove portfolio link and reset values"
                  >
                    <X size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Sample Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#5A6C66]">
                <span className="font-semibold">Quick Sample URLs:</span>
                {[
                  { label: 'vercel.app', url: 'https://myportfolio.vercel.app' },
                  { label: 'github.io', url: 'https://developer.github.io' },
                  { label: 'netlify.app', url: 'https://dev-portfolio.netlify.app' }
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPortfolioUrl(sample.url)}
                    className="px-2.5 py-1 rounded-lg bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] font-bold border border-[#9FB2AC]/70 text-xs transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Role Selector */}
            <div className="lg:col-span-5 space-y-2">
              <label className="block text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider">
                Target Role Benchmark
              </label>
              
              <div className="space-y-2">
                <select
                  value={isCustomRole ? 'custom' : targetRole}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-[#9FB2AC] focus:border-[#5D0D1A] focus:ring-2 focus:ring-[#5D0D1A]/20 bg-[#FFF9EB]/30 text-[#2D060D] font-semibold text-sm transition-all outline-none"
                >
                  {predefinedRoles.map((role, idx) => (
                    <option key={idx} value={role}>{role}</option>
                  ))}
                  <option value="custom">+ Specify Other Custom Role...</option>
                </select>

                {isCustomRole && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="e.g. AI Research Engineer, Cloud Architect..."
                      className="w-full px-4 py-3 rounded-xl border border-[#5D0D1A] bg-white text-[#2D060D] font-medium text-sm focus:ring-2 focus:ring-[#5D0D1A]/20"
                      required
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button type="button" onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              <button type="button" onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
            </motion.div>
          )}

          {/* Submit Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#9FB2AC]/30">
            <p className="text-xs text-[#5A6C66] font-medium flex items-center gap-1.5">
              <Info size={14} className="text-[#5D0D1A]" />
              <span>Scrapes HTML structure & analyzes recruiter appeal in seconds.</span>
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] font-extrabold text-sm shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-amber-300" />
                  <span>Scanning Portfolio Site...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-amber-300" />
                  <span>Analyze Portfolio with AI</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Loading Animated Stepper */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-[#FFF9EB] border border-[#9FB2AC] space-y-4 shadow-inner"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center shadow-xs">
                  <RefreshCw size={16} className="animate-spin" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5A6C66]">Live Evaluation Status</span>
                  <p className="text-sm font-extrabold text-[#5D0D1A]">
                    {loadingSteps[loadingStep]}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-[#5D0D1A]">
                Step {loadingStep + 1} of {loadingSteps.length}
              </span>
            </div>

            {/* Step Indicators */}
            <div className="w-full h-2.5 bg-[#9FB2AC]/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-amber-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Analysis Results View */}
      {analysisData ? (
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Executive Overview & Scorecard */}
          <div className="bg-white rounded-[26px] p-6 sm:p-8 border border-[#9FB2AC]/70 shadow-xs space-y-8">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#9FB2AC]/30 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#5D0D1A] text-[#FFF9EB]">
                    Target: {targetRole}
                  </span>
                  {analysisData.analyzedAt && (
                    <span className="text-xs text-[#5A6C66] font-semibold bg-[#FFF9EB] px-3 py-1 rounded-full border border-[#9FB2AC]/60">
                      Evaluated: {new Date(analysisData.analyzedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#5D0D1A] tracking-tight">
                  Portfolio Audit Report
                </h2>
              </div>

              {/* Toolbar Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {analysisData.portfolioUrl && (
                  <a
                    href={analysisData.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] text-xs font-extrabold border border-[#9FB2AC]/70 transition-all flex items-center gap-1.5"
                  >
                    <span>Visit Live Site</span>
                    <ExternalLink size={14} />
                  </a>
                )}
                
                <button
                  onClick={handleCopySummary}
                  className="px-3.5 py-2 rounded-xl bg-[#FFF9EB] hover:bg-[#F7EED8] text-[#5D0D1A] text-xs font-extrabold border border-[#9FB2AC]/70 transition-all flex items-center gap-1.5"
                >
                  {copiedSummary ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedSummary ? 'Copied Report!' : 'Copy Summary'}</span>
                </button>

                <button
                  onClick={handleClearAnalysis}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold border border-rose-200 transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Score & Gauge Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Circular Gauge Score Widget */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 text-center space-y-3 relative overflow-hidden">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#9FB2AC]/30"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      strokeWidth="3.5"
                      strokeDasharray={`${analysisData.overallScore}, 100`}
                      strokeLinecap="round"
                      stroke={scoreInfo.ring}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-[#5D0D1A] tracking-tight">{analysisData.overallScore}</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A6C66]">out of 100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${scoreInfo.color}`}>
                    {scoreInfo.label}
                  </div>
                  <p className="text-xs text-[#5A6C66] font-medium max-w-xs truncate mx-auto">
                    {analysisData.portfolioUrl}
                  </p>
                </div>
              </div>

              {/* 4-Criteria Breakdown Grid */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5D0D1A] flex items-center gap-2">
                  <Target size={16} />
                  <span>Multi-Criteria Rating Breakdown</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Design & Visual UX', score: analysisData.ratingBreakdown?.designAndUx || 80, icon: Layout, desc: 'Visual hierarchy, responsiveness' },
                    { label: 'Project Showcase', score: analysisData.ratingBreakdown?.projectShowcase || 82, icon: Layers, desc: 'Live demos, repo links & docs' },
                    { label: 'Technical Depth', score: analysisData.ratingBreakdown?.technicalDepth || 78, icon: Code, desc: 'Frameworks, backend complexity' },
                    { label: 'Content Clarity', score: analysisData.ratingBreakdown?.contentClarity || 84, icon: Award, desc: 'Role positioning & bio clarity' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    const itemScoreInfo = getScoreBadge(item.score);
                    return (
                      <div key={idx} className="bg-[#FFF9EB]/50 p-4 rounded-2xl border border-[#9FB2AC]/60 space-y-2.5 hover:border-[#5D0D1A]/40 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-extrabold text-[#5D0D1A]">
                            <div className="w-7 h-7 rounded-lg bg-[#5D0D1A]/10 flex items-center justify-center shrink-0">
                              <Icon size={16} />
                            </div>
                            <span>{item.label}</span>
                          </div>
                          <span className="text-sm font-black text-[#5D0D1A]">{item.score}%</span>
                        </div>

                        <div className="w-full h-2 bg-[#9FB2AC]/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${itemScoreInfo.bar} rounded-full transition-all duration-700`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-[#5A6C66] font-medium truncate">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Executive Assessment Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#FFF9EB] to-[#FAF3E0] border border-[#9FB2AC]/70 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#5D0D1A]">
                  <Sparkles size={16} className="text-amber-600" />
                  <span>AI Recruiter Executive Summary</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6C66]">Verified Evaluation</span>
              </div>
              
              <p className="text-xs sm:text-sm text-[#2D060D] leading-relaxed font-medium">
                {analysisData.overallReview}
              </p>
            </div>
          </div>

          {/* Strengths & Areas for Improvement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-[#9FB2AC]/70 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#9FB2AC]/30 pb-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#5D0D1A]">Key Portfolio Strengths</h3>
                    <span className="text-[11px] text-[#5A6C66] font-medium">Recruiter Highlights</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {analysisData.strengths?.length || 0} Positive Points
                </span>
              </div>

              <ul className="space-y-3">
                {analysisData.strengths?.map((str, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-xs font-medium text-[#2D060D] flex items-start gap-3">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses Card */}
            <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-[#9FB2AC]/70 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#9FB2AC]/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#5D0D1A]">Areas for Improvement</h3>
                    <span className="text-[11px] text-[#5A6C66] font-medium">Growth Opportunities</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                  {analysisData.weaknesses?.length || 0} Action Items
                </span>
              </div>

              <ul className="space-y-3">
                {analysisData.weaknesses?.map((weak, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs font-medium text-[#2D060D] flex items-start gap-3">
                    <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detected Skills & Actionable Recommendations Matrix */}
          <div className="bg-white rounded-[26px] p-6 sm:p-8 border border-[#9FB2AC]/70 shadow-xs space-y-7">
            {/* Detected Skills Matrix */}
            {analysisData.detectedSkills && analysisData.detectedSkills.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5D0D1A] flex items-center gap-2">
                    <Cpu size={16} />
                    <span>Detected Tech Stack & Keywords ({analysisData.detectedSkills.length})</span>
                  </h3>

                  <button
                    onClick={handleCopySkills}
                    className="text-xs font-bold text-[#5D0D1A] hover:underline flex items-center gap-1"
                  >
                    {copiedSkills ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedSkills ? 'Copied Stack' : 'Copy All'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {analysisData.detectedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FFF9EB] text-[#5D0D1A] text-xs font-extrabold border border-[#9FB2AC]/80 shadow-2xs flex items-center gap-1.5 hover:scale-105 transition-all cursor-default"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5D0D1A]" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Roadmap */}
            <div className="space-y-4 pt-4 border-t border-[#9FB2AC]/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5D0D1A] flex items-center gap-2">
                  <TrendingUp size={16} />
                  <span>Actionable Optimization Roadmap</span>
                </h3>
                <span className="text-xs font-semibold text-[#5A6C66]">Priority Suggestions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysisData.recommendations?.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 text-xs font-medium text-[#2D060D] space-y-2 hover:border-[#5D0D1A]/50 transition-all relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#5D0D1A] text-[#FFF9EB] font-black flex items-center justify-center text-[11px]">
                          {idx + 1}
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#5D0D1A]/10 text-[#5D0D1A]">
                          {idx === 0 ? 'High Priority' : idx === 1 ? 'Quick Win' : 'Portfolio Booster'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyRecommendation(rec, idx)}
                        className="text-[#5A6C66] hover:text-[#5D0D1A] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy recommendation"
                      >
                        {copiedIndex === idx ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <p className="leading-relaxed text-[#2D060D] font-medium pt-1">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Empty / Initial State Feature Guidance Card */
        <div className="bg-white rounded-[26px] p-8 sm:p-12 border border-[#9FB2AC]/70 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto shadow-2xs border border-[#9FB2AC]/70">
            <Globe size={32} />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-black text-[#5D0D1A]">
              No Portfolio Analyzed Yet
            </h3>
            <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
              Enter your live portfolio website URL above to generate a recruiter-grade analysis breakdown, project showcase score, and tailored AI recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 text-left">
            {[
              { icon: ShieldCheck, title: 'Scrape Live Tech Stack', desc: 'Extract framework keywords & GitHub project links automatically.' },
              { icon: Flame, title: 'Recruiter Score', desc: 'Get an overall score benchmarking your site against target job requirements.' },
              { icon: Star, title: 'Actionable Enhancements', desc: 'Receive step-by-step suggestions to boost candidate conversion rates.' }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-[#FFF9EB]/50 border border-[#9FB2AC]/60 space-y-2">
                  <Icon size={20} className="text-[#5D0D1A]" />
                  <h4 className="text-xs font-extrabold text-[#5D0D1A]">{feat.title}</h4>
                  <p className="text-[11px] text-[#5A6C66] font-medium leading-normal">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
