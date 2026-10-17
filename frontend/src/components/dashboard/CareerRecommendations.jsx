import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Code2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Compass,
  FileText,
  Globe,
  Terminal,
  User,
  Zap,
  Target,
  BookOpen,
  Map,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';

export const CareerRecommendations = ({ onNavigate, onSelectRoadmapCareer }) => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [requirements, setRequirements] = useState({
    profile: false,
    assessment: false,
    resumeAnalysis: false,
    portfolioAnalysis: false,
  });

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/student/career-recommendations');
      if (res.data && res.data.success) {
        setHasEnoughData(Boolean(res.data.hasEnoughData));
        if (res.data.requirements) {
          setRequirements(res.data.requirements);
        }
        if (res.data.data) {
          setRecommendationsData(res.data.data);
        }
      } else {
        setError(res.data?.message || 'Failed to fetch recommendations.');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.response?.data?.message || 'Unable to connect to AI recommendation server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post('/student/career-recommendations/generate');
      if (res.data && res.data.success) {
        setRecommendationsData(res.data.data);
        setHasEnoughData(true);
      } else {
        setError(res.data?.message || 'Failed to generate career recommendations.');
      }
    } catch (err) {
      console.error('Error generating career recommendations:', err);
      const msg = err.response?.data?.message || 'AI service error while computing recommendations.';
      setError(msg);
      if (err.response?.data?.requirements) {
        setRequirements(err.response.data.requirements);
        setHasEnoughData(false);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleBuildRoadmap = async (career) => {
    let savedRoadmap = career;
    try {
      const res = await api.post('/student/roadmap/select', {
        careerTitle: career.careerTitle,
        matchPercentage: career.matchPercentage,
        matchingSkills: career.matchingSkills,
        skillGaps: career.skillGaps,
      });
      if (res.data && res.data.success && res.data.roadmap) {
        savedRoadmap = res.data.roadmap;
      }
    } catch (err) {
      console.error('Failed to save selected roadmap to student profile in MongoDB:', err);
    }
    if (onSelectRoadmapCareer) {
      onSelectRoadmapCareer(savedRoadmap);
    } else if (onNavigate) {
      onNavigate('roadmap', { career: savedRoadmap });
    }
  };

  const recList = recommendationsData?.recommendations || [];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse py-4">
        <div className="h-44 bg-[#9FB2AC]/20 rounded-[28px] border border-[#9FB2AC]/30" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-[#9FB2AC]/20 rounded-[24px] border border-[#9FB2AC]/30" />
          <div className="h-80 bg-[#9FB2AC]/20 rounded-[24px] border border-[#9FB2AC]/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#420912] rounded-[28px] p-6 sm:p-10 text-[#FFF9EB] shadow-xl border border-[#5D0D1A]/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-[#9FB2AC]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF9EB]/15 text-[#FFF9EB] text-xs font-bold border border-[#FFF9EB]/20">
              <Sparkles size={14} className="text-[#FFF9EB]" />
              <span>AI Multi-Vector Career Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Personalized Career Recommendations
            </h1>
            <p className="text-[#FFF9EB]/80 text-sm font-medium leading-relaxed">
              Powered by your complete candidate profile, coding assessment benchmarks, ATS resume score, and live portfolio evaluation.
            </p>
          </div>

          {hasEnoughData && (
            <div className="w-full md:w-auto shrink-0">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#FFF9EB] hover:bg-white text-[#5D0D1A] font-extrabold text-sm shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-[#5D0D1A]" />
                    <span>Analyzing Data...</span>
                  </>
                ) : recList.length > 0 ? (
                  <>
                    <RefreshCw size={16} className="text-[#5D0D1A]" />
                    <span>Regenerate Recommendations</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-[#5D0D1A]" />
                    <span>Generate Recommendations</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-900 flex items-start gap-4 shadow-xs">
          <div className="p-2 rounded-xl bg-red-100 text-red-700 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-1 text-xs sm:text-sm">
            <h4 className="font-bold">Recommendation Error</h4>
            <p className="font-medium text-red-800/90">{error}</p>
          </div>
        </div>
      )}

      {/* Incomplete Prerequisites Warning */}
      {!hasEnoughData ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] p-6 sm:p-10 border border-[#9FB2AC] shadow-md space-y-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-[#9FB2AC]/30 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <ShieldAlert size={28} />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Action Required
              </span>
              <h3 className="text-xl font-extrabold text-[#5D0D1A]">
                Complete your profile, assessment, resume analysis and portfolio analysis before generating career recommendations.
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-[#5A6C66] uppercase tracking-wider">
              Data Check Matrix
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Profile */}
              <div
                onClick={() => onNavigate && onNavigate('profile')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  requirements.profile
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-[#FFF9EB]/60 border-amber-300 hover:border-[#5D0D1A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center shadow-xs">
                    <User size={20} />
                  </div>
                  {requirements.profile ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={16} /> Complete
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700">Pending</span>
                  )}
                </div>
                <div>
                  <h5 className="font-extrabold text-[#5D0D1A] text-sm">Student Profile</h5>
                  <p className="text-xs text-[#5A6C66] font-medium mt-1">Target roles & technical skills</p>
                </div>
              </div>

              {/* 2. Coding Assessment */}
              <div
                onClick={() => onNavigate && onNavigate('assessments')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  requirements.assessment
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-[#FFF9EB]/60 border-amber-300 hover:border-[#5D0D1A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center shadow-xs">
                    <Terminal size={20} />
                  </div>
                  {requirements.assessment ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={16} /> Complete
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700">Pending</span>
                  )}
                </div>
                <div>
                  <h5 className="font-extrabold text-[#5D0D1A] text-sm">Skill Assessment</h5>
                  <p className="text-xs text-[#5A6C66] font-medium mt-1">Coding evaluation score</p>
                </div>
              </div>

              {/* 3. Resume Analysis */}
              <div
                onClick={() => onNavigate && onNavigate('resume')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  requirements.resumeAnalysis
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-[#FFF9EB]/60 border-amber-300 hover:border-[#5D0D1A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center shadow-xs">
                    <FileText size={20} />
                  </div>
                  {requirements.resumeAnalysis ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={16} /> Complete
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700">Pending</span>
                  )}
                </div>
                <div>
                  <h5 className="font-extrabold text-[#5D0D1A] text-sm">Resume Analysis</h5>
                  <p className="text-xs text-[#5A6C66] font-medium mt-1">ATS score & skill parsing</p>
                </div>
              </div>

              {/* 4. Portfolio Analysis */}
              <div
                onClick={() => onNavigate && onNavigate('portfolio')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  requirements.portfolioAnalysis
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-[#FFF9EB]/60 border-amber-300 hover:border-[#5D0D1A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#5D0D1A] flex items-center justify-center shadow-xs">
                    <Globe size={20} />
                  </div>
                  {requirements.portfolioAnalysis ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={16} /> Complete
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700">Pending</span>
                  )}
                </div>
                <div>
                  <h5 className="font-extrabold text-[#5D0D1A] text-sm">Portfolio Analysis</h5>
                  <p className="text-xs text-[#5A6C66] font-medium mt-1">Recruiter appeal review</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : recList.length === 0 ? (
        /* Ready state, button to generate */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[24px] p-8 sm:p-12 border border-[#9FB2AC] shadow-md text-center space-y-6 max-w-2xl mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC] shadow-xs">
            <Compass size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-[#5D0D1A]">
              Ready for AI Career Matching
            </h3>
            <p className="text-[#5A6C66] text-sm font-medium leading-relaxed">
              All candidate prerequisites are complete! Click below to synthesize your profile data, assessment results, ATS resume metrics, and portfolio insights into 3–5 high-matching career pathways.
            </p>
          </div>
          <div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-sm font-extrabold shadow-lg shadow-[#5D0D1A]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-[#FFF9EB]" />
                  <span>Computing Career Fits...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-[#FFF9EB]" />
                  <span>Generate Career Recommendations</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        /* Generated Recommendations Grid */
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#5D0D1A] flex items-center gap-2">
                <Target size={20} className="text-[#5D0D1A]" />
                <span>Top Tailored Career Recommendations ({recList.length})</span>
              </h2>
              {recommendationsData?.generatedAt && (
                <p className="text-xs text-[#5A6C66] font-medium mt-1">
                  Last updated: {new Date(recommendationsData.generatedAt).toLocaleString()}
                </p>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#9FB2AC] hover:border-[#5D0D1A] text-[#5D0D1A] text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
              <span>{generating ? 'Regenerating...' : 'Regenerate Recommendations'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recList.map((rec, index) => {
              const matchScore = rec.matchPercentage || 75;
              const isTopMatch = index === 0;

              return (
                <motion.div
                  key={rec.careerTitle + index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`relative overflow-hidden bg-white rounded-[24px] p-6 sm:p-8 border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6 ${
                    isTopMatch
                      ? 'border-[#5D0D1A] ring-1 ring-[#5D0D1A]/20'
                      : 'border-[#9FB2AC] hover:border-[#5D0D1A]'
                  }`}
                >
                  {/* Top Badge */}
                  {isTopMatch && (
                    <div className="absolute top-0 right-0 bg-[#5D0D1A] text-[#FFF9EB] px-4 py-1.5 rounded-bl-2xl text-[10px] font-extrabold uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Sparkles size={12} /> Top Match
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Title & Match % Header */}
                    <div className="flex items-start justify-between gap-4 pr-16 sm:pr-0">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5A6C66] block">
                          Career Pathway #{index + 1}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-[#5D0D1A] tracking-tight">
                          {rec.careerTitle}
                        </h3>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-2xs ${
                            matchScore >= 85
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : matchScore >= 70
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          <Zap size={14} className="fill-current" />
                          {matchScore}% Match
                        </span>
                      </div>
                    </div>

                    {/* Match Score Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-[#FFF9EB] h-2.5 rounded-full overflow-hidden border border-[#9FB2AC]/40">
                        <div
                          className="h-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] rounded-full transition-all duration-700"
                          style={{ width: `${matchScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-[#FFF9EB] rounded-2xl p-4 border border-[#9FB2AC]/40 space-y-1">
                      <span className="text-xs font-bold text-[#5D0D1A] flex items-center gap-1">
                        <Compass size={14} /> Recommendation Rationale
                      </span>
                      <p className="text-xs text-[#2D060D]/80 font-medium leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>

                    {/* Skills Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Matching Skills */}
                      <div className="space-y-2">
                        <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Matching Skills
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.matchingSkills && rec.matchingSkills.length > 0 ? (
                            rec.matchingSkills.map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200"
                              >
                                <Code2 size={12} /> {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#5A6C66]">None detected</span>
                          )}
                        </div>
                      </div>

                      {/* Skill Gaps */}
                      <div className="space-y-2">
                        <span className="text-xs font-extrabold text-amber-800 flex items-center gap-1">
                          <AlertCircle size={14} /> Skill Gaps to Bridge
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.skillGaps && rec.skillGaps.length > 0 ? (
                            rec.skillGaps.map((gap) => (
                              <span
                                key={gap}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 text-[11px] font-bold border border-amber-200"
                              >
                                <BookOpen size={12} /> {gap}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-emerald-700 font-medium">No major gaps!</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recommended Improvements */}
                    {rec.recommendedImprovements && rec.recommendedImprovements.length > 0 && (
                      <div className="space-y-2 border-t border-[#9FB2AC]/30 pt-4">
                        <span className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider block">
                          Recommended Improvements:
                        </span>
                        <ul className="space-y-1.5">
                          {rec.recommendedImprovements.map((imp, idx) => (
                            <li key={idx} className="text-xs text-[#5A6C66] font-medium flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action Button: Build Roadmap */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleBuildRoadmap(rec)}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] hover:from-[#420912] hover:to-[#5D0D1A] text-[#FFF9EB] text-xs font-extrabold shadow-md shadow-[#5D0D1A]/15 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Map size={16} />
                      <span>Build Roadmap for {rec.careerTitle}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
