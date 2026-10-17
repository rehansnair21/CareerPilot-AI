import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Lightbulb,
  Brain,
  Compass,
  Clock,
  Award,
  Heart,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Target,
  Check,
  HelpCircle,
  Quote,
  Flame,
} from 'lucide-react';

export const SoftSkillAssessment = ({ onAssessmentComplete }) => {
  // Navigation Steps: 'overview' | 'quiz' | 'results'
  const [step, setStep] = useState('overview');

  // Currently Selected Skill for Quiz
  const [selectedSkill, setSelectedSkill] = useState(null);

  // Loading & Submission States
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Quiz State
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [submittedQuestions, setSubmittedQuestions] = useState({});

  // Submission Results State
  const [submissionResult, setSubmissionResult] = useState(null);

  // Authenticated Student History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Defined 7 Core Soft Skills
  const SKILL_MODULES = [
    {
      id: 'Teamwork & Collaboration',
      title: 'Teamwork & Collaboration',
      icon: Users,
      desc: 'Active collaboration, pair programming, stakeholder alignment, and team dynamics.',
      questionCount: 5,
      estimatedTime: '5–7 min',
    },
    {
      id: 'Problem Solving',
      title: 'Problem Solving',
      icon: Lightbulb,
      desc: 'Root cause analysis, telemetry debugging under stress, and constraint optimization.',
      questionCount: 5,
      estimatedTime: '5–7 min',
    },
    {
      id: 'Critical Thinking',
      title: 'Critical Thinking',
      icon: Brain,
      desc: 'Questioning assumptions, evaluating data metrics, and technical trade-off decisions.',
      questionCount: 5,
      estimatedTime: '5–7 min',
    },
    {
      id: 'Adaptability',
      title: 'Adaptability',
      icon: Compass,
      desc: 'Agile pivots, rapid technology skill acquisition, process flexibility, and resilience.',
      questionCount: 5,
      estimatedTime: '5–7 min',
    },
    {
      id: 'Time Management',
      title: 'Time Management',
      icon: Clock,
      desc: 'Prioritization, focus preservation, task estimation, and meeting stewardship.',
      questionCount: 5,
      estimatedTime: '5–7 min',
    },
    {
      id: 'Leadership',
      title: 'Leadership',
      icon: Award,
      desc: 'Empowering peers, blameless post-mortems, inclusive culture, and shared credit attribution.',
      questionCount: 5,
      estimatedTime: '5–7 min',
    },
    {
      id: 'Emotional Intelligence',
      title: 'Emotional Intelligence',
      icon: Heart,
      desc: 'Self-regulation, empathy, constructive feedback processing, and social awareness.',
      questionCount: 5,
      estimatedTime: '5–7 min',
    },
  ];

  // Fetch past assessment attempt history on mount for real student data
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/student/assessment/soft-skill/history');
      if (res.data && res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch soft skill history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Map history to find best/latest attempt per skill
  const getSkillStatusMap = () => {
    const map = {};
    SKILL_MODULES.forEach((mod) => {
      // Look for completed attempts matching skill category or id
      const matches = history.filter((h) => {
        const hCat = (h.category || '').toLowerCase();
        const mId = mod.id.toLowerCase();
        return hCat.includes(mId) || mId.includes(hCat);
      });

      if (matches.length > 0) {
        // Pick latest attempt
        const latest = matches[0];
        map[mod.id] = {
          completed: true,
          score: latest.score || 0,
          attemptId: latest._id,
          completedAt: latest.completedAt,
        };
      } else {
        map[mod.id] = {
          completed: false,
          score: 0,
        };
      }
    });
    return map;
  };

  const skillStatusMap = getSkillStatusMap();

  // Calculate Real Student Aggregate Metrics
  const completedSkillsCount = Object.values(skillStatusMap).filter((s) => s.completed).length;
  const totalQuestionsCompleted = completedSkillsCount * 5; // 5 questions per skill
  const overallProgressPercentage = Math.round((totalQuestionsCompleted / 35) * 100);

  // Start Assessment for a specific skill module
  const handleStartSkillAssessment = async (skillModule) => {
    setSelectedSkill(skillModule);
    setGenerating(true);
    setError(null);
    setUserAnswers({});
    setSubmittedQuestions({});
    setCurrentQuestionIndex(0);

    try {
      const res = await api.post('/student/assessment/soft-skill/generate', {
        category: skillModule.id,
        difficulty: 'Beginner',
      });

      if (res.data && res.data.success && res.data.data?.questions) {
        setQuestions(res.data.data.questions);
        setStep('quiz');
      } else {
        setError('Unable to load assessment scenarios. Please try again.');
      }
    } catch (err) {
      console.error('Error starting skill assessment:', err);
      setError(err.response?.data?.message || 'Failed to start soft skill assessment.');
    } finally {
      setGenerating(false);
    }
  };

  // Start Full Assessment (picks first uncompleted skill, or first skill)
  const handleStartFullAssessment = () => {
    const uncompleted = SKILL_MODULES.find((m) => !skillStatusMap[m.id]?.completed);
    const targetSkill = uncompleted || SKILL_MODULES[0];
    handleStartSkillAssessment(targetSkill);
  };

  const handleSelectOption = (questionId, optionId) => {
    // If question is already submitted, prevent changing option
    if (submittedQuestions[questionId]) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitQuestion = (questionId) => {
    if (!userAnswers[questionId]) return;
    setSubmittedQuestions((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const handleSubmitAssessment = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/student/assessment/soft-skill/submit', {
        category: selectedSkill?.id || 'Teamwork & Collaboration',
        difficulty: 'Beginner',
        questions,
        userAnswers,
      });

      if (res.data && res.data.success && res.data.data) {
        setSubmissionResult(res.data.data);
        setStep('results');
        fetchHistory(); // Refresh DB history
        if (onAssessmentComplete) onAssessmentComplete();
      } else {
        setError('Failed to evaluate assessment submission. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting soft skill assessment:', err);
      setError(err.response?.data?.message || 'Error submitting soft skill assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const allAnswered = questions.length > 0 && questions.every((q) => Boolean(userAnswers[q.id]));


  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 font-sans text-[#2D060D]">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-[26px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF9EB] border border-[#9FB2AC] text-xs font-extrabold text-[#5D0D1A]">
            <Brain size={14} />
            <span>Behavioral Capability & Leadership Evaluator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#5D0D1A] tracking-tight">
            Soft Skills Assessment
          </h1>
          <p className="text-sm text-[#5A6C66] font-medium leading-relaxed">
            Discover your strengths and areas for improvement in the essential skills needed for career success.
          </p>
        </div>

        {/* Small Motivational Quote Card */}
        <div className="bg-gradient-to-br from-[#FFF9EB] to-[#F7EED8] p-4 md:p-5 rounded-2xl border border-[#9FB2AC]/70 max-w-xs shrink-0 flex items-start gap-3 shadow-2xs">
          <Quote className="text-[#5D0D1A] shrink-0 mt-0.5" size={20} />
          <p className="text-xs font-semibold text-[#5D0D1A] italic leading-snug">
            "Technical skills get you the interview, but soft skills get you hired and promoted."
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* OVERVIEW DASHBOARD VIEW */}
        {step === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* PROGRESS SECTION CARD */}
            <div className="bg-white rounded-[28px] p-6 md:p-8 border border-[#9FB2AC] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight">
                    Overall Progress
                  </h2>
                  <p className="text-xs text-[#5A6C66] font-medium mt-0.5">
                    Track your overall soft skill evaluation completion across 7 core competencies.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#5A6C66] bg-[#FFF9EB] px-3.5 py-1.5 rounded-xl border border-[#9FB2AC]">
                    7 Skill Areas
                  </span>
                  <span className="text-xs font-bold text-[#5A6C66] bg-[#FFF9EB] px-3.5 py-1.5 rounded-xl border border-[#9FB2AC] flex items-center gap-1.5">
                    <Clock size={14} className="text-[#5D0D1A]" />
                    <span>Est. ~40 minutes</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar & Numerical Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-[#5D0D1A]">
                    {totalQuestionsCompleted} / 35 Questions Completed
                  </span>
                  <span className="text-[#5D0D1A] font-black text-sm">
                    {overallProgressPercentage}%
                  </span>
                </div>

                <div className="w-full h-3.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/60">
                  <div
                    className="h-full bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#5D0D1A] transition-all duration-500 rounded-full"
                    style={{ width: `${overallProgressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#9FB2AC]/30">
                <div className="text-xs font-medium text-[#5A6C66]">
                  {completedSkillsCount === 0
                    ? 'Start your first assessment to unlock personalized behavioral insights.'
                    : `${completedSkillsCount} of 7 skills completed. Keep going to finish full evaluation!`}
                </div>

                <button
                  onClick={handleStartFullAssessment}
                  disabled={generating}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-extrabold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Preparing Assessment...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>{completedSkillsCount > 0 ? 'Continue Assessment' : 'Start Full Assessment'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SKILL ASSESSMENT CARDS GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight">
                  Skill Assessment Modules
                </h2>
                <span className="text-xs text-[#5A6C66] font-semibold">
                  Select a skill below to start a 5-question scenario
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {SKILL_MODULES.map((skill) => {
                  const Icon = skill.icon;
                  const status = skillStatusMap[skill.id] || { completed: false, score: 0 };
                  const isCompleted = status.completed;

                  return (
                    <div
                      key={skill.id}
                      className={`bg-white rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between space-y-5 shadow-2xs hover:shadow-lg hover:-translate-y-1 ${
                        isCompleted
                          ? 'border-emerald-600/40 bg-gradient-to-b from-white to-emerald-50/20'
                          : 'border-[#9FB2AC] hover:border-[#5D0D1A]'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Top Icon & Status Badge */}
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center shadow-md shadow-[#5D0D1A]/10">
                            <Icon size={22} />
                          </div>

                          <span
                            className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-[#FFF9EB] text-[#5A6C66] border-[#9FB2AC]'
                            }`}
                          >
                            {isCompleted ? `Score: ${status.score}%` : 'Not Started'}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="font-extrabold text-[#5D0D1A] text-base leading-snug">
                            {skill.title}
                          </h3>
                          <p className="text-xs text-[#5A6C66] font-medium mt-1 leading-relaxed line-clamp-2">
                            {skill.desc}
                          </p>
                        </div>

                        {/* Meta Tags */}
                        <div className="flex items-center gap-3 text-[11px] font-bold text-[#5A6C66] pt-1">
                          <span className="bg-[#FFF9EB] px-2.5 py-1 rounded-lg border border-[#9FB2AC]/50">
                            {skill.questionCount} Questions
                          </span>
                          <span className="bg-[#FFF9EB] px-2.5 py-1 rounded-lg border border-[#9FB2AC]/50 flex items-center gap-1">
                            <Clock size={12} className="text-[#5D0D1A]" />
                            {skill.estimatedTime}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar & Launch Button */}
                      <div className="space-y-3 pt-3 border-t border-[#9FB2AC]/30">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-extrabold text-[#5D0D1A]">
                            <span>Progress</span>
                            <span>{isCompleted ? '100%' : '0%'}</span>
                          </div>
                          <div className="w-full h-2 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/40">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-emerald-600' : 'bg-[#5D0D1A] w-0'
                              }`}
                              style={{ width: isCompleted ? '100%' : '0%' }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartSkillAssessment(skill)}
                          disabled={generating}
                          className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                            isCompleted
                              ? 'bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] hover:bg-[#5D0D1A] hover:text-[#FFF9EB]'
                              : 'bg-[#5D0D1A] text-[#FFF9EB] hover:bg-[#7A1424] shadow-sm'
                          }`}
                        >
                          <span>{isCompleted ? 'Retake Assessment' : 'Start Assessment'}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* QUESTION & SCENARIO QUIZ INTERACTION UI */}
        {step === 'quiz' && currentQ && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {/* Top Navigation & Skill Banner */}
            <div className="bg-white rounded-[24px] p-6 border border-[#9FB2AC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={() => setStep('overview')}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#5A6C66] hover:text-[#5D0D1A] transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Return to Skill Overview</span>
              </button>

              <div className="flex-1 max-w-md mx-auto w-full space-y-2">
                <div className="flex justify-between text-xs font-extrabold text-[#5D0D1A]">
                  <span>{selectedSkill?.title}</span>
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                </div>
                <div className="w-full h-2.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/60">
                  <div
                    className="h-full bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] transition-all duration-300 rounded-full"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* SCENARIO QUESTION CARD */}
            <div className="bg-white rounded-[26px] p-6 md:p-8 border border-[#9FB2AC] shadow-xs space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FFF9EB] text-[#5D0D1A] border border-[#9FB2AC] text-xs font-extrabold">
                  <Target size={14} />
                  <span>{currentQ.context || 'Workplace Scenario'}</span>
                </div>

                <h2 className="text-lg md:text-xl font-bold text-[#2D060D] leading-relaxed">
                  {currentQ.scenario}
                </h2>
              </div>

              {/* 4 MULTIPLE CHOICE ANSWER CARDS */}
              {(() => {
                const isQuestionSubmitted = Boolean(submittedQuestions[currentQ.id]);
                const correctOpt = currentQ.options?.find((o) => o.id === 'opt-a') || currentQ.options?.[0];
                const userChoiceId = userAnswers[currentQ.id];
                const isUserCorrect = userChoiceId === correctOpt?.id;

                return (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5A6C66]">
                        Select Your Proactive Response:
                      </label>
                      {isQuestionSubmitted && (
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                          isUserCorrect
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {isUserCorrect ? (
                            <>
                              <CheckCircle2 size={14} className="text-emerald-700" />
                              <span>Correct Choice!</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={14} className="text-rose-700" />
                              <span>Incorrect Choice</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {currentQ.options?.map((opt) => {
                        const isSelected = userChoiceId === opt.id;
                        const isThisCorrect = opt.id === correctOpt?.id;

                        let cardStyle = 'border-[#9FB2AC]/40 bg-white hover:border-[#5D0D1A]/60 hover:bg-[#FFF9EB]/20';
                        if (isQuestionSubmitted) {
                          if (isThisCorrect) {
                            cardStyle = 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-600/30 shadow-md';
                          } else if (isSelected && !isThisCorrect) {
                            cardStyle = 'border-rose-500 bg-rose-50/90 ring-2 ring-rose-500/30';
                          } else {
                            cardStyle = 'border-slate-200 bg-slate-50/50 opacity-60';
                          }
                        } else if (isSelected) {
                          cardStyle = 'border-[#5D0D1A] bg-[#FFF9EB] shadow-md shadow-[#5D0D1A]/5 scale-[1.01]';
                        }

                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectOption(currentQ.id, opt.id)}
                            className={`rounded-2xl p-5 border-2 transition-all duration-200 ${
                              isQuestionSubmitted ? 'cursor-default' : 'cursor-pointer'
                            } ${cardStyle}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                    isQuestionSubmitted && isThisCorrect
                                      ? 'border-emerald-600 bg-emerald-600 text-white'
                                      : isQuestionSubmitted && isSelected && !isThisCorrect
                                      ? 'border-rose-500 bg-rose-500 text-white'
                                      : isSelected
                                      ? 'border-[#5D0D1A] bg-[#5D0D1A] text-[#FFF9EB]'
                                      : 'border-[#9FB2AC] bg-white'
                                  }`}
                                >
                                  {isQuestionSubmitted && isThisCorrect ? (
                                    <Check size={12} strokeWidth={3} />
                                  ) : isQuestionSubmitted && isSelected && !isThisCorrect ? (
                                    <AlertCircle size={12} />
                                  ) : (
                                    isSelected && <Check size={12} />
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <p className={`text-sm font-bold ${
                                    isQuestionSubmitted && isThisCorrect
                                      ? 'text-emerald-950 font-black'
                                      : isQuestionSubmitted && isSelected && !isThisCorrect
                                      ? 'text-rose-950 font-extrabold'
                                      : 'text-[#2D060D]'
                                  }`}>
                                    {opt.text}
                                  </p>
                                  {opt.description && (
                                    <p className={`text-xs font-medium ${
                                      isQuestionSubmitted && isThisCorrect
                                        ? 'text-emerald-850 font-semibold'
                                        : 'text-[#5A6C66]'
                                    }`}>
                                      {opt.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Badges */}
                              {isQuestionSubmitted && (
                                <div className="shrink-0">
                                  {isThisCorrect && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
                                      <CheckCircle2 size={12} /> Correct Answer
                                    </span>
                                  )}
                                  {isSelected && !isThisCorrect && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-rose-500 text-white shadow-xs">
                                      <AlertCircle size={12} /> Your Choice
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* PER-QUESTION GREEN SUBMIT BUTTON */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {!isQuestionSubmitted ? (
                        <button
                          onClick={() => handleSubmitQuestion(currentQ.id)}
                          disabled={!userChoiceId}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 size={16} />
                          <span>Submit Answer</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs">
                          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                          <span>Answer Submitted — Review Correct Answer & Explanation Below</span>
                        </div>
                      )}
                    </div>

                    {/* REVEAL CORRECT ANSWER EXPLANATION CARD WHEN SUBMITTED */}
                    {isQuestionSubmitted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-5 rounded-2xl border ${
                          isUserCorrect
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                            : 'bg-amber-50/90 border-amber-300 text-amber-950'
                        } space-y-3 shadow-xs`}
                      >
                        <div className="flex items-center gap-2 font-extrabold text-sm">
                          {isUserCorrect ? (
                            <>
                              <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                              <span className="text-emerald-900">Correct Choice! Excellent decision-making.</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={18} className="text-amber-700 shrink-0" />
                              <span className="text-amber-900">Optimal Response & Explanation:</span>
                            </>
                          )}
                        </div>

                        <div className="space-y-2 text-xs leading-relaxed">
                          <p className="font-extrabold text-sm text-emerald-900">
                            ✓ {correctOpt?.text}
                          </p>
                          {correctOpt?.description && (
                            <div className="font-medium text-slate-800 bg-white/80 p-3.5 rounded-xl border border-slate-200 space-y-1">
                              <span className="font-extrabold text-slate-900 block uppercase tracking-wider text-[10px]">
                                Behavioral & Strategic Rationale:
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                {correctOpt.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })()}

              {/* "WHY ARE WE ASKING THIS?" INFORMATION CARD */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start gap-3">
                <HelpCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-extrabold uppercase tracking-wider block text-amber-950">
                    Why are we asking this?
                  </span>
                  <p className="font-medium text-amber-900 leading-relaxed">
                    {currentQ.whyAsking ||
                      'This scenario evaluates your behavioral decision-making, emotional regulation, and peer collaboration under realistic workplace dynamics.'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* CONTROLS: PREVIOUS / NEXT QUESTION BUTTONS */}
              <div className="pt-4 border-t border-[#9FB2AC]/40 flex items-center justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] font-bold text-xs shadow-md hover:bg-[#7A1424] disabled:opacity-40 flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    disabled={!userAnswers[currentQ.id]}
                    className="px-6 py-2.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] font-bold text-xs shadow-md hover:bg-[#7A1424] disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitAssessment}
                    disabled={!allAnswered || submitting}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] font-extrabold text-sm shadow-lg shadow-[#5D0D1A]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Evaluating Responses...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Submit Skill Assessment</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* RESULTS SUMMARY CARD */}
        {step === 'results' && submissionResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-[28px] p-8 md:p-10 border border-[#9FB2AC] shadow-md text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5D0D1A] to-[#7A1424] text-[#FFF9EB] flex items-center justify-center mx-auto shadow-lg shadow-[#5D0D1A]/20">
                <Award size={40} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#5A6C66]">
                  Assessment Complete 🎉
                </span>
                <h2 className="text-3xl font-extrabold text-[#5D0D1A]">
                  {submissionResult.category}
                </h2>
                <p className="text-xs font-semibold text-[#5A6C66]">
                  Your results have been saved to your student profile.
                </p>
              </div>

              <div className="inline-block p-6 rounded-3xl bg-[#FFF9EB] border border-[#9FB2AC]/60 max-w-xs w-full mx-auto">
                <div className="text-5xl font-black text-[#5D0D1A]">
                  {submissionResult.score}%
                </div>
                <div className="text-xs font-bold text-[#5A6C66] mt-1">
                  Overall Skill Performance Score
                </div>
              </div>

              {/* AI Feedback Summary */}
              {submissionResult.aiFeedback?.summary && (
                <div className="bg-[#FFF9EB]/60 p-5 rounded-2xl border border-[#9FB2AC]/40 text-left max-w-2xl mx-auto space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#5D0D1A]">
                    AI Evaluator Summary:
                  </span>
                  <p className="text-xs font-medium text-[#5A6C66] leading-relaxed">
                    {submissionResult.aiFeedback.summary}
                  </p>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => setStep('overview')}
                  className="px-8 py-3.5 rounded-xl bg-[#5D0D1A] text-[#FFF9EB] font-extrabold text-sm shadow-md hover:bg-[#7A1424] transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  <span>Return to Soft Skills Overview</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SoftSkillAssessment;
