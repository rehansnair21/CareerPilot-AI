import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code,
  Sparkles,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  Terminal,
  Cpu,
  Layers,
  History,
  ArrowLeft,
  FileCode,
  Eye,
  Search,
  Filter,
  X,
} from 'lucide-react';

export const CodingAssessment = ({ onAssessmentComplete }) => {
  // Navigation & Step State
  // Steps: 'select' -> 'workspace' -> 'results'
  const [step, setStep] = useState('select');

  // Step 1 Selections
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Beginner');

  // Loading States
  const [generating, setGenerating] = useState(false);
  const [runningCode, setRunningCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Challenge & Editor State
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Run Code Results
  const [runResults, setRunResults] = useState(null);
  const [activeTabTest, setActiveTabTest] = useState('tests'); // 'tests' | 'output'

  // Submission Result State
  const [submissionResult, setSubmissionResult] = useState(null);

  // Assessment History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterLang, setHistoryFilterLang] = useState('All');
  const [copiedModalCode, setCopiedModalCode] = useState(false);

  // Fetch past assessment attempt history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/student/assessment/history');
      if (res.data && res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch assessment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Error State
  const [generateError, setGenerateError] = useState(null);

  // 1. Generate Challenge
  const handleGenerateChallenge = async () => {
    setGenerating(true);
    setGenerateError(null);
    setRunResults(null);
    setSubmissionResult(null);
    try {
      const res = await api.post('/student/assessment/generate-challenge', {
        language: selectedLanguage,
        difficulty: selectedDifficulty,
      });

      if (res.data && res.data.success && res.data.data) {
        const qData = res.data.data;
        setQuestion(qData);
        setCode(qData.starterCode || getStarterTemplate(selectedLanguage));
        setStep('workspace');
      }
    } catch (err) {
      console.error('Error generating challenge:', err);
      const is429 = err.response?.status === 429 || err.response?.data?.isQuotaExhausted;
      const message = is429
        ? 'Gemini AI rate limit or quota temporarily reached (429 RESOURCE_EXHAUSTED). Please wait a moment and try again.'
        : (err.response?.data?.message || 'Failed to generate coding challenge. Please try again.');
      setGenerateError({ is429, message });
    } finally {
      setGenerating(false);
    }
  };

  // Starter templates fallback
  const getStarterTemplate = (lang) => {
    switch (lang) {
      case 'Python':
        return `def solution(nums, target):\n    # Write your Python code here\n    pass\n`;
      case 'Java':
        return `public class Solution {\n    public int[] solution(int[] nums, int target) {\n        // Write your Java code here\n        return new int[]{};\n    }\n}\n`;
      case 'C++':
        return `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solution(vector<int>& nums, int target) {\n        // Write your C++ code here\n        return {};\n    }\n};\n`;
      default:
        return `function solution(nums, target) {\n  // Write your JavaScript code here\n  return [];\n}\n`;
    }
  };

  // Switch Language in Workspace
  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    if (question) {
      setCode(getStarterTemplate(newLang));
    }
  };

  // 2. Run Code against Test Cases
  const handleRunCode = async () => {
    if (!question) return;
    setRunningCode(true);
    try {
      const res = await api.post('/student/assessment/run-code', {
        language: selectedLanguage,
        code,
        testCases: question.testCases || [],
      });
      if (res.data && res.data.success) {
        setRunResults(res.data.data);
      }
    } catch (err) {
      console.error('Error running code:', err);
    } finally {
      setRunningCode(false);
    }
  };

  // 3. Submit Code
  const handleSubmitCode = async () => {
    if (!question) return;
    setSubmitting(true);
    try {
      const res = await api.post('/student/assessment/submit', {
        language: selectedLanguage,
        difficulty: selectedDifficulty,
        question,
        submittedCode: code,
      });

      if (res.data && res.data.success && res.data.data) {
        setSubmissionResult(res.data.data);
        setStep('results');
        fetchHistory();
        if (onAssessmentComplete) {
          onAssessmentComplete();
        }
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Copy Code to Clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset Code
  const handleResetCode = () => {
    if (question && question.starterCode) {
      setCode(question.starterCode);
    } else {
      setCode(getStarterTemplate(selectedLanguage));
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* STEP 1 — START ASSESSMENT SELECTOR */}
        {/* ========================================================================= */}
        {step === 'select' && (
          <motion.div
            key="step-select"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] rounded-[24px] p-6 sm:p-8 md:p-10 text-[#FFF9EB] shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold backdrop-blur-md border border-white/15">
                  <Sparkles size={14} className="text-purple-300 animate-pulse" />
                  AI-Powered Coding Assessment Platform
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#FFF9EB]">
                  Test Your Coding Skills
                </h1>
                <p className="text-purple-100/90 text-sm sm:text-base leading-relaxed font-medium">
                  Choose your programming language and difficulty level to receive an AI-generated coding challenge with real-time test verification and AI feedback.
                </p>
              </div>
            </div>

            {/* Config Card */}
            <div className="bg-white rounded-[22px] p-6 sm:p-8 border border-[#9FB2AC] shadow-xs space-y-8">
              {/* Programming Language Picker */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-[#5D0D1A] uppercase tracking-wider">
                  Select Programming Language
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { name: 'JavaScript', icon: '⚡', color: 'from-amber-500/10 to-yellow-500/20 text-amber-900 border-amber-300' },
                    { name: 'Python', icon: '🐍', color: 'from-blue-500/10 to-indigo-500/20 text-blue-900 border-blue-300' },
                    { name: 'Java', icon: '☕', color: 'from-orange-500/10 to-red-500/20 text-orange-900 border-orange-300' },
                    { name: 'C++', icon: '🚀', color: 'from-purple-500/10 to-pink-500/20 text-purple-900 border-purple-300' },
                  ].map((lang) => {
                    const isSelected = selectedLanguage === lang.name;
                    return (
                      <button
                        key={lang.name}
                        onClick={() => setSelectedLanguage(lang.name)}
                        className={`relative group p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 ${
                          isSelected
                            ? 'border-[#5D0D1A] bg-[#FFF9EB] shadow-md scale-[1.02]'
                            : 'border-slate-200 bg-white hover:border-[#9FB2AC] hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{lang.icon}</span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center shadow-xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <span className="font-extrabold text-sm text-[#2D060D] group-hover:text-[#5D0D1A]">
                          {lang.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Level Picker */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-[#5D0D1A] uppercase tracking-wider">
                  Select Difficulty Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { level: 'Beginner', badge: 'Easy', desc: 'Core logic, arrays, strings & basic algorithms', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { level: 'Intermediate', badge: 'Medium', desc: 'Sliding window, hash maps, binary search & trees', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { level: 'Advanced', badge: 'Hard', desc: 'Dynamic programming, graphs & complex data structures', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                  ].map((diff) => {
                    const isSelected = selectedDifficulty === diff.level;
                    return (
                      <button
                        key={diff.level}
                        onClick={() => setSelectedDifficulty(diff.level)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer space-y-2 ${
                          isSelected
                            ? 'border-[#5D0D1A] bg-[#FFF9EB] shadow-md scale-[1.02]'
                            : 'border-slate-200 bg-white hover:border-[#9FB2AC] hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-base text-[#5D0D1A]">{diff.level}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${diff.color}`}>
                            {diff.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#4A5D57] font-medium leading-relaxed">
                          {diff.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Alert Message */}
              {generateError && (
                <div className={`p-5 rounded-2xl border flex items-start gap-3.5 text-xs sm:text-sm font-medium ${
                  generateError.is429
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                    : 'bg-red-50 border-red-200 text-red-900 shadow-xs'
                }`}>
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-[#5D0D1A]">
                      {generateError.is429 ? 'AI Rate Limit / Quota Reached (429)' : 'Challenge Generation Notice'}
                    </h4>
                    <p className="text-[#2D060D]/80 leading-relaxed">{generateError.message}</p>
                  </div>
                </div>
              )}

              {/* Generate Action CTA */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleGenerateChallenge}
                  disabled={generating}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-base font-extrabold shadow-lg shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 cursor-pointer"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating AI Challenge...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Challenge</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Previous Assessment Attempts Section */}
            {history.length > 0 && (
              <div className="bg-white rounded-[22px] p-6 sm:p-8 border border-[#9FB2AC] shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5 text-[#5D0D1A]">
                    <div className="p-2 rounded-xl bg-[#FFF9EB] border border-[#9FB2AC]">
                      <History size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#5D0D1A]">Previous Assessment Attempts</h3>
                      <p className="text-xs text-[#4A5D57]">Complete record of all your technical coding challenges</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#5D0D1A] bg-[#FFF9EB] px-3 py-1.5 rounded-full border border-[#9FB2AC] shadow-xs self-start sm:self-auto">
                    {history.length} Assessment{history.length === 1 ? '' : 's'} Completed
                  </span>
                </div>

                {/* Filter & Search Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search challenge or language..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#2D060D] focus:outline-none focus:border-[#5D0D1A] focus:bg-white transition-all"
                    />
                    {historySearchQuery && (
                      <button
                        onClick={() => setHistorySearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Language Filter */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Filter size={14} className="text-[#5D0D1A]" />
                    <span className="text-xs font-bold text-[#5D0D1A]">Filter:</span>
                    <select
                      value={historyFilterLang}
                      onChange={(e) => setHistoryFilterLang(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-[#5D0D1A] text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-[#5D0D1A] cursor-pointer"
                    >
                      <option value="All">All Languages</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="Python">Python</option>
                      <option value="Java">Java</option>
                      <option value="C++">C++</option>
                    </select>
                  </div>
                </div>

                {/* All Attempts Cards Grid */}
                {(() => {
                  const filteredHistory = history.filter((att) => {
                    const title = att.question?.title || 'Coding Challenge';
                    const matchesSearch = !historySearchQuery ||
                      title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                      (att.language || '').toLowerCase().includes(historySearchQuery.toLowerCase());
                    const matchesLang = historyFilterLang === 'All' || att.language === historyFilterLang;
                    return matchesSearch && matchesLang;
                  });

                  if (filteredHistory.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs font-medium text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No previous technical assessment attempts match your search criteria.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredHistory.map((att) => {
                        const passed = att.testResults?.passedTestCases ?? 0;
                        const total = att.testResults?.totalTestCases ?? 0;
                        const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
                        const score = att.score ?? 0;

                        return (
                          <div
                            key={att._id}
                            onClick={() => setSelectedHistoryItem(att)}
                            className="group p-4 rounded-xl border border-slate-200 hover:border-[#5D0D1A] bg-[#FFF9EB]/30 hover:bg-[#FFF9EB] flex flex-col justify-between gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-sm text-[#2D060D] group-hover:text-[#5D0D1A] transition-colors">
                                    {att.question?.title || 'Coding Challenge'}
                                  </span>
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                                    {att.language}
                                  </span>
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                    {att.difficulty || 'Beginner'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#4A5D57] font-medium flex items-center gap-1">
                                  <Clock size={12} />
                                  {new Date(att.completedAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <div className={`text-lg font-extrabold ${score >= 80 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                                  {score}/100
                                </div>
                                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  {passed}/{total} Passed ({pct}%)
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
                              <span className="text-[11px] font-semibold text-[#4A5D57]">
                                Quality: {att.skillScores?.codeQuality ?? 0}%
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5D0D1A] group-hover:translate-x-0.5 transition-transform">
                                <Eye size={13} /> View Solution & AI Feedback
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2 & 3 — CODING INTERFACE WORKSPACE */}
        {/* ========================================================================= */}
        {step === 'workspace' && question && (
          <motion.div
            key="step-workspace"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Top Back & Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-[#9FB2AC] shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="p-2 rounded-lg hover:bg-slate-100 text-[#5D0D1A] transition-colors cursor-pointer"
                  title="Change Language & Difficulty"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-[#5D0D1A] flex items-center gap-2">
                    {question.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#4A5D57]">
                    <span className="font-semibold">{selectedLanguage}</span>
                    <span>•</span>
                    <span className="font-semibold">{selectedDifficulty} Difficulty</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={runningCode || submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {runningCode ? (
                    <div className="w-4 h-4 border-2 border-purple-800 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play size={14} fill="currentColor" />
                  )}
                  <span>Run Code</span>
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={submitting || runningCode}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Evaluating AI Review...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Two-Column Responsive Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Problem Specs */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs space-y-6 max-h-[750px] overflow-y-auto custom-scrollbar">
                  {/* Badges & Title */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        {question.difficulty}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {selectedLanguage}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-[#5D0D1A]">
                      {question.title}
                    </h3>
                  </div>

                  {/* Skills Tested */}
                  {question.skillsTested && question.skillsTested.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#4A5D57] uppercase tracking-wider">
                        Skills Tested
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {question.skillsTested.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen size={14} /> Problem Description
                    </h4>
                    <p className="text-xs sm:text-sm text-[#2D060D] leading-relaxed font-medium whitespace-pre-line">
                      {question.description}
                    </p>
                  </div>

                  {/* Input / Output Format */}
                  <div className="grid grid-cols-1 gap-3">
                    {question.inputFormat && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-[#5D0D1A] uppercase tracking-wider block">
                          Input Format
                        </span>
                        <p className="text-xs font-mono text-slate-800">{question.inputFormat}</p>
                      </div>
                    )}
                    {question.outputFormat && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-[#5D0D1A] uppercase tracking-wider block">
                          Output Format
                        </span>
                        <p className="text-xs font-mono text-slate-800">{question.outputFormat}</p>
                      </div>
                    )}
                  </div>

                  {/* Constraints */}
                  {question.constraints && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600" /> Constraints
                      </h4>
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs font-mono text-amber-900 leading-relaxed">
                        {question.constraints}
                      </div>
                    </div>
                  )}

                  {/* Example Input / Output */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#5D0D1A] uppercase tracking-wider">
                      Examples
                    </h4>
                    <div className="p-4 rounded-xl bg-[#1E1B2E] text-purple-100 font-mono text-xs space-y-2">
                      <div>
                        <span className="text-purple-400 select-none">Example Input:</span>
                        <div className="mt-1 text-emerald-300 bg-black/30 p-2 rounded-lg">
                          {question.exampleInput || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-400 select-none">Example Output:</span>
                        <div className="mt-1 text-cyan-300 bg-black/30 p-2 rounded-lg">
                          {question.exampleOutput || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Code Editor Workspace */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#1E1B2E] rounded-[22px] border border-purple-900/40 shadow-xl overflow-hidden flex flex-col">
                  {/* Editor Header Bar */}
                  <div className="bg-[#161320] px-4 py-3 border-b border-purple-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-xs font-bold font-mono text-purple-300/80 flex items-center gap-1.5">
                        <FileCode size={14} className="text-purple-400" />
                        main.{selectedLanguage === 'JavaScript' ? 'js' : selectedLanguage === 'Python' ? 'py' : selectedLanguage === 'Java' ? 'java' : 'cpp'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Language Switcher */}
                      <select
                        value={selectedLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="bg-[#27223B] text-purple-200 text-xs font-semibold px-2.5 py-1 rounded-lg border border-purple-700/50 focus:outline-none cursor-pointer"
                      >
                        <option value="JavaScript">JavaScript</option>
                        <option value="Python">Python</option>
                        <option value="Java">Java</option>
                        <option value="C++">C++</option>
                      </select>

                      {/* Copy Code */}
                      <button
                        onClick={handleCopyCode}
                        className="p-1.5 rounded-lg text-purple-300 hover:bg-purple-800/40 transition-colors cursor-pointer"
                        title="Copy Code"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>

                      {/* Reset Code */}
                      <button
                        onClick={handleResetCode}
                        className="p-1.5 rounded-lg text-purple-300 hover:bg-purple-800/40 transition-colors cursor-pointer"
                        title="Reset Code"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Clean Code Editor Textarea with Line Numbers */}
                  <div className="relative flex min-h-[380px] max-h-[500px] overflow-auto bg-[#1E1B2E]">
                    {/* Line numbers column */}
                    <div className="w-12 py-4 select-none bg-[#161320] text-purple-400/40 text-right pr-3 font-mono text-xs leading-relaxed border-r border-purple-900/30">
                      {Array.from({ length: lineCount }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>

                    {/* Textarea */}
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      spellCheck={false}
                      className="flex-1 p-4 font-mono text-sm leading-relaxed text-purple-100 bg-transparent resize-none focus:outline-none custom-scrollbar whitespace-pre tab-4"
                      rows={Math.max(14, lineCount)}
                    />
                  </div>

                  {/* Editor Footer Status Bar */}
                  <div className="bg-[#161320] px-4 py-2 border-t border-purple-900/30 flex items-center justify-between text-[11px] font-mono text-purple-300/60">
                    <div className="flex items-center gap-4">
                      <span>Lines: {lineCount}</span>
                      <span>Chars: {code.length}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>UTF-8</span>
                      <span>Tab Size: 2</span>
                    </div>
                  </div>
                </div>

                {/* RUN CODE RESULTS PANEL */}
                {runResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 border border-[#9FB2AC] shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Terminal size={18} className="text-[#5D0D1A]" />
                        <h4 className="font-bold text-sm text-[#5D0D1A]">Test Case Results</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-extrabold text-[#5D0D1A]">
                          {runResults.passedTestCases} / {runResults.totalTestCases} Passed
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-500">
                          <Clock size={12} /> {runResults.executionTimeMs} ms
                        </span>
                      </div>
                    </div>

                    {/* Test Details */}
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                      {runResults.details && runResults.details.map((tc, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                            tc.passed
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-red-50/60 border-red-200 text-red-950'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              {tc.passed ? (
                                <CheckCircle2 size={14} className="text-emerald-600" />
                              ) : (
                                <XCircle size={14} className="text-red-600" />
                              )}
                              Test Case {tc.testCaseIndex}
                            </span>
                            <span className={`font-bold px-2 py-0.5 rounded-md ${tc.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {tc.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-slate-500 block">Input:</span>
                              <span className="font-semibold">{tc.input}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Expected:</span>
                              <span className="font-semibold text-emerald-800">{tc.expectedOutput}</span>
                            </div>
                          </div>

                          {!tc.passed && tc.error && (
                            <div className="pt-1 text-red-700 font-sans text-xs">
                              <strong>Error:</strong> {tc.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5 & 6 — RESULT SCREEN */}
        {/* ========================================================================= */}
        {step === 'results' && submissionResult && (
          <motion.div
            key="step-results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Completion Banner */}
            <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] rounded-[24px] p-6 sm:p-8 text-[#FFF9EB] shadow-lg relative overflow-hidden text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center mx-auto border border-white/20 shadow-md">
                <Award size={36} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Assessment Complete 🎉
              </h1>
              <p className="text-purple-100/90 text-sm font-medium max-w-xl mx-auto">
                Great effort! Here is your official CareerPilot AI score evaluation, test case verification, and algorithmic breakdown.
              </p>
            </div>

            {/* Score Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Cumulative Overall Score */}
              <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs text-center space-y-2">
                <span className="text-xs font-bold text-[#4A5D57] uppercase tracking-wider block">
                  Overall Score (All Attempts)
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#5D0D1A]">
                  {submissionResult.overallScoreRecord?.overallScore ?? submissionResult.score ?? 0}{' '}
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className="bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${submissionResult.overallScoreRecord?.overallScore ?? submissionResult.score ?? 0}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#4A5D57] block">
                  Avg across {submissionResult.overallScoreRecord?.assessmentsCompleted || 1} attempt(s)
                </span>
              </div>

              {/* Current Attempt Score */}
              <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs text-center space-y-2">
                <span className="text-xs font-bold text-[#4A5D57] uppercase tracking-wider block">
                  Current Attempt Score
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-purple-700">
                  {submissionResult.attempt?.score ?? submissionResult.score ?? 0}{' '}
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
                <div className="text-xs font-bold text-purple-700 bg-purple-50 py-1 px-3 rounded-full inline-block">
                  This Challenge
                </div>
              </div>

              {/* Test Cases Passed */}
              <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs text-center space-y-2">
                <span className="text-xs font-bold text-[#4A5D57] uppercase tracking-wider block">
                  Test Cases Passed
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">
                  {submissionResult.attempt?.testResults?.passedTestCases ?? submissionResult.testResults?.passedTestCases ?? 0}
                  <span className="text-sm font-semibold text-slate-400">
                    {' '}/ {submissionResult.attempt?.testResults?.totalTestCases ?? submissionResult.testResults?.totalTestCases ?? 0}
                  </span>
                </div>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                  {Math.round(
                    ((submissionResult.attempt?.testResults?.passedTestCases ?? submissionResult.testResults?.passedTestCases ?? 0) /
                      (submissionResult.attempt?.testResults?.totalTestCases ?? submissionResult.testResults?.totalTestCases ?? 1)) *
                      100
                  )}
                  % Accuracy
                </div>
              </div>

              {/* Code Quality */}
              <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-xs text-center space-y-2">
                <span className="text-xs font-bold text-[#4A5D57] uppercase tracking-wider block">
                  Code Quality
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-700">
                  {submissionResult.attempt?.skillScores?.codeQuality ?? submissionResult.skillScores?.codeQuality ?? 0}{' '}
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
                <div className="text-xs font-bold text-amber-700 bg-amber-50 py-1 px-3 rounded-full inline-block">
                  AI Code Review
                </div>
              </div>
            </div>


            {/* Complexity & AI Code Review Section */}
            <div className="bg-white rounded-[22px] p-6 sm:p-8 border border-[#9FB2AC] shadow-xs space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#5D0D1A]">AI Code Review</h3>
                    <p className="text-xs text-[#4A5D57]">Detailed analysis generated by CareerPilot AI Engine</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    Time: {submissionResult.aiFeedback?.timeComplexity || 'O(N)'}
                  </span>
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    Space: {submissionResult.aiFeedback?.spaceComplexity || 'O(1)'}
                  </span>
                </div>
              </div>

              {/* Strengths & Areas to Improve Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="space-y-4 bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200">
                  <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Strengths
                  </h4>
                  <ul className="space-y-2 text-xs font-medium text-emerald-950">
                    {submissionResult.aiFeedback?.strengths && submissionResult.aiFeedback.strengths.length > 0 ? (
                      submissionResult.aiFeedback.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500">Solid algorithmic structure</li>
                    )}
                  </ul>
                </div>

                {/* Areas to Improve */}
                <div className="space-y-4 bg-amber-50/40 p-5 rounded-2xl border border-amber-200">
                  <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    Areas to Improve
                  </h4>
                  <ul className="space-y-2 text-xs font-medium text-amber-950">
                    {submissionResult.aiFeedback?.areasToImprove && submissionResult.aiFeedback.areasToImprove.length > 0 ? (
                      submissionResult.aiFeedback.areasToImprove.map((area, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{area}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500">No major weaknesses detected</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* AI Feedback Callout */}
              <div className="p-5 rounded-2xl bg-[#FFF9EB] border border-[#9FB2AC] space-y-2">
                <h4 className="font-bold text-xs text-[#5D0D1A] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} /> Overall AI Feedback
                </h4>
                <p className="text-xs sm:text-sm text-[#2D060D] leading-relaxed font-medium">
                  {submissionResult.aiFeedback?.feedbackText || 'Well done on completing the assessment! Keep practicing to master coding interview challenges.'}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setStep('select')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-sm font-extrabold shadow-md shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <RotateCcw size={16} />
                  <span>Try Another Challenge</span>
                </button>

                <button
                  onClick={() => {
                    if (onAssessmentComplete) onAssessmentComplete();
                    setStep('select');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-sm font-bold border border-purple-200 transition-all cursor-pointer"
                >
                  <Award size={16} />
                  <span>View Skill Progress</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* PREVIOUS ATTEMPT DETAILS MODAL */}
        {/* ========================================================================= */}
        {selectedHistoryItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-3xl w-full border border-[#9FB2AC] shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] p-6 text-[#FFF9EB] flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 font-bold border border-white/20 text-purple-200">
                      {selectedHistoryItem.language}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 font-bold border border-white/20 text-emerald-200">
                      {selectedHistoryItem.difficulty || 'Beginner'}
                    </span>
                    <span className="text-xs text-white/70 font-mono">
                      {new Date(selectedHistoryItem.completedAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    {selectedHistoryItem.question?.title || 'Coding Challenge'}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Score Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <span className="text-[11px] font-bold text-purple-900 uppercase block">Overall Score</span>
                    <span className="text-2xl font-extrabold text-purple-700">{selectedHistoryItem.score}/100</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase block">Test Cases</span>
                    <span className="text-2xl font-extrabold text-emerald-700">
                      {selectedHistoryItem.testResults?.passedTestCases}/{selectedHistoryItem.testResults?.totalTestCases}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-900 uppercase block">Code Quality</span>
                    <span className="text-2xl font-extrabold text-amber-700">{selectedHistoryItem.skillScores?.codeQuality ?? 0}%</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[11px] font-bold text-blue-900 uppercase block">Complexity</span>
                    <span className="text-xs font-mono font-bold text-blue-700 block mt-1">
                      {selectedHistoryItem.aiFeedback?.timeComplexity || 'O(N)'}
                    </span>
                  </div>
                </div>

                {/* Submitted Code Viewer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                      <FileCode size={14} /> Submitted Code ({selectedHistoryItem.language})
                    </h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedHistoryItem.submittedCode || '');
                        setCopiedModalCode(true);
                        setTimeout(() => setCopiedModalCode(false), 2000);
                      }}
                      className="text-xs font-bold text-[#5D0D1A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedModalCode ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedModalCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#1E1B2E] text-purple-100 font-mono text-xs leading-relaxed overflow-x-auto max-h-56 custom-scrollbar border border-purple-900/40">
                    {selectedHistoryItem.submittedCode}
                  </pre>
                </div>

                {/* AI Review Summary */}
                {selectedHistoryItem.aiFeedback && (
                  <div className="p-4 rounded-xl bg-[#FFF9EB] border border-[#9FB2AC] space-y-3">
                    <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} /> AI Evaluation Feedback
                    </h4>
                    <p className="text-xs text-[#2D060D] leading-relaxed font-medium">
                      {selectedHistoryItem.aiFeedback.feedbackText}
                    </p>
                    
                    {selectedHistoryItem.aiFeedback.strengths?.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase block">Strengths:</span>
                        <ul className="list-disc list-inside text-xs text-emerald-950 font-medium space-y-0.5 mt-1">
                          {selectedHistoryItem.aiFeedback.strengths.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-sm hover:scale-[1.02] cursor-pointer"
                >
                  Close Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodingAssessment;
