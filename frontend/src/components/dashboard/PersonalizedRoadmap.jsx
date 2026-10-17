import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Code2,
  Compass,
  Zap,
  ChevronRight,
  Target,
  ShieldAlert,
  User,
  Terminal,
  FileText,
  Globe,
  Calendar,
  Check,
  ChevronDown,
  Layers,
  Database,
  Shield,
  Briefcase,
  Flag,
  Server,
  ExternalLink,
  BookMarked,
} from 'lucide-react';
import api from '../../services/api';

export const PersonalizedRoadmap = ({ selectedCareer, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // API Data States
  const [hasCareerRec, setHasCareerRec] = useState(false);
  const [hasRoadmap, setHasRoadmap] = useState(Boolean(selectedCareer));
  const [recommendedCareer, setRecommendedCareer] = useState(null);
  const [roadmapData, setRoadmapData] = useState(selectedCareer || null);
  const [requirements, setRequirements] = useState({
    profile: false,
    assessment: false,
    resumeAnalysis: false,
    portfolioAnalysis: false,
    careerRecommendation: false,
  });

  // Expandable Phase Accordion State
  const [expandedPhaseId, setExpandedPhaseId] = useState(null);

  // Interactive Task Progress State (Default 0 for new tasks, calculated dynamically)
  const [topicProgress, setTopicProgress] = useState({});

  // Helper to calculate dynamic phase progress from sub-tasks
  const calculatePhaseProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const total = tasks.reduce((sum, t) => sum + (topicProgress[t.id] ?? t.progress ?? 0), 0);
    return Math.round(total / tasks.length);
  };

  const fetchStudentRoadmap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/roadmap');
      if (res.data && res.data.success) {
        const {
          hasCareerRecommendation,
          hasRoadmap: apiHasRoadmap,
          requirements: reqs,
          recommendedCareer: recCareer,
          roadmap: savedRoadmap,
        } = res.data;

        setHasCareerRec(Boolean(hasCareerRecommendation));
        setRequirements(
          reqs || {
            profile: false,
            assessment: false,
            resumeAnalysis: false,
            portfolioAnalysis: false,
            careerRecommendation: Boolean(hasCareerRecommendation),
          }
        );
        setRecommendedCareer(recCareer || null);

        if (selectedCareer) {
          setRoadmapData(selectedCareer);
          setHasRoadmap(true);
        } else if (apiHasRoadmap && savedRoadmap) {
          setRoadmapData(savedRoadmap);
          setHasRoadmap(true);
        } else {
          setRoadmapData(null);
          setHasRoadmap(false);
        }
      } else {
        setHasCareerRec(false);
        setHasRoadmap(false);
        setRoadmapData(null);
      }
    } catch (err) {
      console.error('Error fetching student isolated roadmap from API:', err);
      setHasCareerRec(false);
      setHasRoadmap(false);
      setRoadmapData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCareer]);

  useEffect(() => {
    fetchStudentRoadmap();
  }, [fetchStudentRoadmap]);

  const handleGenerateRoadmap = async (careerToSave) => {
    const target = careerToSave || recommendedCareer;
    if (!target || !target.careerTitle) return;

    setGenerating(true);
    try {
      const res = await api.post('/student/roadmap/select', {
        careerTitle: target.careerTitle,
        matchPercentage: target.matchPercentage || 85,
        matchingSkills: target.matchingSkills || [],
        skillGaps: target.skillGaps || [],
      });

      if (res.data && res.data.success) {
        const saved = res.data.roadmap || target;
        setRoadmapData(saved);
        setHasRoadmap(true);
      }
    } catch (err) {
      console.error('Error generating and saving roadmap:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Toggle/Update task progress
  const handleTaskAction = (taskId) => {
    setTopicProgress((prev) => {
      const current = prev[taskId] || 0;
      let next = 0;
      if (current === 0) next = 50;
      else if (current === 50) next = 100;
      else next = 0;
      return { ...prev, [taskId]: next };
    });
  };

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse py-4 max-w-7xl mx-auto">
        <div className="h-44 bg-[#9FB2AC]/20 rounded-[28px] border border-[#9FB2AC]/30" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-[#9FB2AC]/20 rounded-[22px] border border-[#9FB2AC]/30" />
          ))}
        </div>
      </div>
    );
  }

  // 2. STATE 1: Career Recommendation is NOT generated (Pending / Action Required State)
  if (!hasCareerRec && !hasRoadmap && !selectedCareer) {
    return (
      <div className="space-y-8 pb-12 font-sans text-[#2D060D] max-w-7xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#5A6C66] flex items-center gap-1">
            <span>Roadmap</span>
            <ChevronRight size={12} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#5D0D1A]">
            Your Personalized Roadmap
          </h1>
          <p className="text-xs text-[#5A6C66] font-medium">
            A step-by-step plan to help you achieve your career goals.
          </p>
        </div>

        {/* Action Required Pending Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[26px] p-6 sm:p-10 border border-[#9FB2AC] shadow-md space-y-8 max-w-3xl mx-auto"
        >
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
              <ShieldAlert size={28} />
            </div>

            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/80 px-3.5 py-1 rounded-full border border-amber-300">
              Action Required
            </span>

            <h2 className="text-2xl font-extrabold text-[#5D0D1A]">
              Complete Your Career Recommendation First
            </h2>

            <p className="text-[#5A6C66] text-xs sm:text-sm font-medium leading-relaxed">
              Your personalized roadmap will be generated after CareerPilot AI analyzes your profile, assessments, resume, portfolio, and recommends a suitable career.
            </p>
          </div>

          {/* Checklist Prerequisite Data Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-[#5D0D1A] uppercase tracking-wider">
              Prerequisite Completion Checklist:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => onNavigate && onNavigate('profile')}
                className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${
                  requirements.profile ? 'bg-emerald-50/60 border-emerald-300' : 'bg-[#FFF9EB]/60 border-amber-300 hover:border-[#5D0D1A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User size={18} className={requirements.profile ? 'text-emerald-700' : 'text-[#5D0D1A]'} />
                  <span className="text-xs font-extrabold text-[#5D0D1A]">Student Profile</span>
                </div>
                {requirements.profile ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={15} /> Complete
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700">⏳ Pending</span>
                )}
              </div>

              <div
                onClick={() => onNavigate && onNavigate('assessments')}
                className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${
                  requirements.assessment ? 'bg-emerald-50/60 border-emerald-300' : 'bg-[#FFF9EB]/60 border-amber-300 hover:border-[#5D0D1A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Terminal size={18} className={requirements.assessment ? 'text-emerald-700' : 'text-[#5D0D1A]'} />
                  <span className="text-xs font-extrabold text-[#5D0D1A]">Skill Assessment</span>
                </div>
                {requirements.assessment ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={15} /> Complete
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700">⏳ Pending</span>
                )}
              </div>

              <div
                onClick={() => onNavigate && onNavigate('resume')}
                className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${
                  requirements.resumeAnalysis ? 'bg-emerald-50/60 border-emerald-300' : 'bg-[#FFF9EB]/60 border-amber-300 hover:border-[#5D0D1A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className={requirements.resumeAnalysis ? 'text-emerald-700' : 'text-[#5D0D1A]'} />
                  <span className="text-xs font-extrabold text-[#5D0D1A]">Resume Analysis</span>
                </div>
                {requirements.resumeAnalysis ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={15} /> Complete
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700">⏳ Pending</span>
                )}
              </div>

              <div
                onClick={() => onNavigate && onNavigate('portfolio')}
                className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${
                  requirements.portfolioAnalysis ? 'bg-emerald-50/60 border-emerald-300' : 'bg-[#FFF9EB]/60 border-amber-300 hover:border-[#5D0D1A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe size={18} className={requirements.portfolioAnalysis ? 'text-emerald-700' : 'text-[#5D0D1A]'} />
                  <span className="text-xs font-extrabold text-[#5D0D1A]">Portfolio Analysis</span>
                </div>
                {requirements.portfolioAnalysis ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={15} /> Complete
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700">⏳ Pending</span>
                )}
              </div>
            </div>

            <div
              onClick={() => onNavigate && onNavigate('recommendations')}
              className="cursor-pointer p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between hover:border-[#5D0D1A] transition-all"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-amber-800" />
                <span className="text-xs font-extrabold text-amber-950">Career Recommendation</span>
              </div>
              <span className="text-xs font-bold text-amber-800">⏳ Pending</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => onNavigate && onNavigate('recommendations')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] text-[#FFF9EB] text-sm font-extrabold shadow-lg shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles size={18} className="text-[#FFF9EB]" />
              <span>Go to Career Recommendations</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. STATE 2: Career Recommendation EXISTS, but Roadmap is NOT generated/selected yet
  if (hasCareerRec && !hasRoadmap && !roadmapData) {
    const career = recommendedCareer || {};
    return (
      <div className="space-y-8 pb-12 font-sans text-[#2D060D] max-w-7xl mx-auto">
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#5A6C66] flex items-center gap-1">
            <span>Roadmap</span>
            <ChevronRight size={12} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#5D0D1A]">
            Your Personalized Roadmap
          </h1>
          <p className="text-xs text-[#5A6C66] font-medium">
            A step-by-step plan to help you achieve your career goals.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[26px] p-6 sm:p-10 border border-[#9FB2AC] shadow-md space-y-8 max-w-3xl mx-auto"
        >
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF9EB] text-[#5D0D1A] flex items-center justify-center mx-auto border border-[#9FB2AC] shadow-xs">
              <Compass size={28} />
            </div>

            <h2 className="text-2xl font-extrabold text-[#5D0D1A]">
              Your Career Roadmap Is Ready to Generate
            </h2>

            <p className="text-[#5A6C66] text-xs sm:text-sm font-medium leading-relaxed">
              CareerPilot AI has analyzed your candidate profile and recommended a top matching career path. Click below to generate your step-by-step learning roadmap.
            </p>
          </div>

          <div className="bg-[#FFF9EB]/60 rounded-2xl p-6 border border-[#9FB2AC]/70 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#9FB2AC]/40 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A6C66]">
                  Top AI Recommended Role
                </span>
                <h3 className="text-xl font-extrabold text-[#5D0D1A]">
                  {career.careerTitle || 'AI Recommended Career'}
                </h3>
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-[#5D0D1A] text-[#FFF9EB] text-xs font-black flex items-center gap-1.5 shadow-xs">
                <Zap size={14} />
                <span>{career.matchPercentage || 85}% Career Match</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-[#5D0D1A] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  <span>Current Skills:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {career.matchingSkills && career.matchingSkills.length > 0 ? (
                    career.matchingSkills.map((sk) => (
                      <span key={sk} className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#5A6C66]">Core Candidate Skills</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold text-[#5D0D1A] flex items-center gap-1.5">
                  <Target size={14} className="text-amber-700" />
                  <span>Target Skill Gaps:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {career.skillGaps && career.skillGaps.length > 0 ? (
                    career.skillGaps.map((sg) => (
                      <span key={sg} className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                        {sg}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#5A6C66]">Target Technical Mastery</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => handleGenerateRoadmap(career)}
              disabled={generating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5D0D1A] via-[#7A1424] to-[#9FB2AC] text-[#FFF9EB] text-sm font-extrabold shadow-lg shadow-[#5D0D1A]/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Roadmap...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-[#FFF9EB]" />
                  <span>Generate My Roadmap</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. STATE 3: FULL ROADMAP VIEW (NEW REDESIGNED TIMELINE MATCHING REFERENCE UI)
  const careerTitle = roadmapData?.careerTitle || 'Backend Engineer';

  // Construct 6 Phased Stepper Items matching reference design
  const defaultPhases = [
    {
      id: 0,
      phaseNum: 1,
      name: 'Foundations & Core Programming',
      subtitle: 'Build a strong foundation in programming and computer fundamentals.',
      tags: ['Programming Basics', 'Data Structures', 'Algorithms', 'Problem Solving'],
      timeline: 'Weeks 1–2',
      iconBg: 'bg-[#FDF0F3] text-[#5D0D1A]',
      iconType: 'book',
      tasks: [
        { id: 'p1-t1', title: 'Programming Fundamentals & Syntax', desc: 'Master variables, data types, logic loops, functions, and memory basics.', tags: ['Basics', 'Logic'], progress: 0 },
        { id: 'p1-t2', title: 'Data Structures & Algorithms', desc: 'Arrays, Objects, Hash Maps, Searching, Sorting, and Time Complexity.', tags: ['DSA', 'LeetCode'], progress: 0 },
      ],
    },
    {
      id: 1,
      phaseNum: 2,
      name: careerTitle.toLowerCase().includes('backend')
        ? 'Backend Development with Node.js'
        : careerTitle.toLowerCase().includes('full stack')
        ? 'Frontend & Web Architecture'
        : `${careerTitle} Core Development`,
      subtitle: 'Learn server-side development and build RESTful APIs.',
      tags: careerTitle.toLowerCase().includes('backend')
        ? ['Node.js', 'Express.js', 'REST APIs', 'API Design']
        : (roadmapData?.matchingSkills?.slice(0, 4) || ['Node.js', 'Express.js', 'REST APIs', 'API Design']),
      timeline: 'Weeks 3–4',
      iconBg: 'bg-[#EEF2FF] text-[#4F46E5]',
      iconType: 'server',
      tasks: [
        { id: 'p2-t1', title: 'Node.js Event Loop & Modules', desc: 'Non-blocking I/O, asynchronous promises, async/await, and core modules.', tags: ['Node.js', 'Async'], progress: 0 },
        { id: 'p2-t2', title: 'Express.js RESTful API Architecture', desc: 'Routing, middleware, request validation, error handling, and JSON serialization.', tags: ['Express.js', 'APIs'], progress: 0 },
      ],
    },
    {
      id: 2,
      phaseNum: 3,
      name: 'Databases & Data Management',
      subtitle: 'Work with databases and learn data modeling.',
      tags: ['MongoDB', 'SQL Basics', 'Database Design', 'Mongoose'],
      timeline: 'Weeks 5–6',
      iconBg: 'bg-[#FEF3C7] text-[#D97706]',
      iconType: 'database',
      tasks: [
        { id: 'p3-t1', title: 'Relational SQL & PostgreSQL Modeling', desc: 'Schemas, primary/foreign keys, joins, subqueries, and indexing.', tags: ['SQL', 'PostgreSQL'], progress: 0 },
        { id: 'p3-t2', title: 'NoSQL Databases with MongoDB', desc: 'Collections, BSON documents, Mongoose ODM, and aggregation pipelines.', tags: ['MongoDB', 'Mongoose'], progress: 0 },
      ],
    },
    {
      id: 3,
      phaseNum: 4,
      name: 'Authentication & Security',
      subtitle: 'Implement secure authentication and authorization.',
      tags: ['JWT', 'Password Hashing', 'Role-based Access', 'Security Best Practices'],
      timeline: 'Weeks 7–8',
      iconBg: 'bg-[#ECFDF5] text-[#059669]',
      iconType: 'shield',
      tasks: [
        { id: 'p4-t1', title: 'JWT Access & Refresh Tokens', desc: 'Secure stateless authentication, token expiration, and auth middleware.', tags: ['JWT', 'Security'], progress: 0 },
        { id: 'p4-t2', title: 'Bcrypt Hashing & Role-Based Access Control', desc: 'Password salting/hashing, user role permissions, and CORS policy.', tags: ['RBAC', 'Bcrypt'], progress: 0 },
      ],
    },
    {
      id: 4,
      phaseNum: 5,
      name: careerTitle.toLowerCase().includes('backend') ? 'Advanced Backend Concepts' : 'Advanced Architecture Concepts',
      subtitle: 'Explore advanced backend technologies and system design.',
      tags: ['Docker', 'Microservices', 'System Design', 'Caching (Redis)'],
      timeline: 'Weeks 9–10',
      iconBg: 'bg-[#FCE7F3] text-[#DB2777]',
      iconType: 'code',
      tasks: [
        { id: 'p5-t1', title: 'High-Performance Redis Caching', desc: 'In-memory caching patterns, Cache-Aside pattern, and TTL key management.', tags: ['Redis', 'Caching'], progress: 0 },
        { id: 'p5-t2', title: 'Docker Containerization & System Design', desc: 'Containerizing services, Docker-Compose, and high-level system architecture.', tags: ['Docker', 'Microservices'], progress: 0 },
      ],
    },
    {
      id: 5,
      phaseNum: 6,
      name: 'Projects & Portfolio',
      subtitle: 'Build real-world projects to showcase your skills.',
      tags: ['Build APIs', 'Deploy Projects', 'Documentation', 'Git & GitHub'],
      timeline: 'Weeks 11–12',
      iconBg: 'bg-[#F3E8FF] text-[#9333EA]',
      iconType: 'briefcase',
      tasks: [
        { id: 'p6-t1', title: 'Build Full-Stack Capstone Project', desc: 'Architect and deploy a live project with complete documentation and GitHub repo.', tags: ['Capstone', 'Portfolio'], progress: 0 },
        { id: 'p6-t2', title: 'Technical Interview & Resume Prep', desc: 'ATS resume optimization, LeetCode practice, and system design mock screens.', tags: ['Interview', 'Resume'], progress: 0 },
      ],
    },
  ];

  // Extract dynamic phases from roadmapData or use 6 default phases matching reference design
  const rawPhases = (roadmapData?.phases && roadmapData.phases.length >= 5)
    ? roadmapData.phases
    : defaultPhases;

  const phasesList = rawPhases.map((ph, idx) => {
    const tasks = ph.tasks || defaultPhases[idx % defaultPhases.length]?.tasks || [];
    const phaseProgress = calculatePhaseProgress(tasks);

    return {
      id: idx,
      phaseNum: ph.phaseNum || idx + 1,
      name: ph.name || defaultPhases[idx % defaultPhases.length]?.name || `Phase ${idx + 1}`,
      subtitle: ph.subtitle || defaultPhases[idx % defaultPhases.length]?.subtitle || 'Master essential skills for this phase.',
      tags: (ph.tags && ph.tags.length > 0)
        ? ph.tags
        : (ph.tasks?.[0]?.tags && ph.tasks[0].tags.length > 0)
        ? ph.tasks[0].tags
        : defaultPhases[idx % defaultPhases.length]?.tags || ['Core Skills'],
      timeline: ph.duration || ph.timeline || defaultPhases[idx % defaultPhases.length]?.timeline || `Weeks ${idx * 2 + 1}–${idx * 2 + 2}`,
      progress: phaseProgress,
      iconBg: defaultPhases[idx % defaultPhases.length]?.iconBg || 'bg-[#FDF0F3] text-[#5D0D1A]',
      iconType: defaultPhases[idx % defaultPhases.length]?.iconType || 'book',
      tasks,
    };
  });

  // Calculate Overall Progress across all 6 phases dynamically
  const calculatedOverallProgress = Math.round(
    phasesList.reduce((sum, p) => sum + (p.progress || 0), 0) / (phasesList.length || 1)
  );

  const estimatedTimeline = roadmapData?.estimatedTimeline || '12 Months';
  const quoteText = roadmapData?.quote || "Small, consistent steps lead to big career breakthroughs.";

  return (
    <div className="space-y-8 pb-12 font-sans text-[#2D060D] max-w-7xl mx-auto">
      {/* 1. HEADER BANNER (BURGUNDY CARD WITH TIMELINE & QUOTE - EXACT MATCH TO REFERENCE DESIGN) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#5D0D1A] via-[#4A0B17] to-[#5D0D1A] rounded-[26px] p-6 sm:p-8 text-[#FFF9EB] shadow-xl border border-[#5D0D1A]/30">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#9FB2AC]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title & Subtitle */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF9EB]/15 text-[#FFF9EB] text-xs font-extrabold border border-[#FFF9EB]/20">
              <BookMarked size={14} className="text-[#FFF9EB]" />
              <span>Learning Roadmap</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {careerTitle} Roadmap
            </h1>

            <p className="text-[#FFF9EB]/80 text-xs sm:text-sm font-medium leading-relaxed">
              A step-by-step learning path to help you become a {careerTitle}.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-bold text-[#FFF9EB]/90">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                <User size={14} className="text-[#FFF9EB]" />
                Personalized for you
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                <Sparkles size={14} className="text-[#FFF9EB]" />
                Based on your profile, assessments and skill gaps
              </span>
            </div>
          </div>

          {/* Right Estimated Timeline Card & Motivational Quote */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 shrink-0 lg:border-l border-white/20 lg:pl-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-pink-100/90 text-[#5D0D1A] flex items-center justify-center shrink-0 shadow-xs">
                <Target size={24} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-[#FFF9EB]/70 uppercase tracking-wider block">
                  Estimated Timeline
                </span>
                <span className="text-xl font-black text-white block">
                  {estimatedTimeline}
                </span>
                <span className="text-[10px] font-medium text-[#FFF9EB]/70 block">
                  Based on your current level
                </span>
              </div>
            </div>

            <div className="hidden xl:block max-w-[200px] text-xs italic font-medium text-[#FFF9EB]/80 leading-relaxed border-l border-white/20 pl-6">
              "{quoteText}"
            </div>
          </div>
        </div>
      </div>

      {/* 2. VERTICAL TIMELINE STEPPER & STACKED PHASE CARDS (1 TO 6) */}
      <div className="space-y-4 relative pl-4 sm:pl-6">
        {/* Continuous Dashed Connecting Vertical Line */}
        <div className="absolute left-[29px] sm:left-[37px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-[#9FB2AC]/50 pointer-events-none z-0" />

        {phasesList.map((phase) => {
          const isCompleted = phase.progress === 100;
          const isInProgress = phase.progress > 0 && phase.progress < 100;
          const isExpanded = expandedPhaseId === phase.id;

          return (
            <div key={phase.id} className="relative flex items-start gap-4 sm:gap-6 z-10">
              {/* Left Stepper Circle (Solid Burgundy for Active/Completed, Hollow White for Pending) */}
              <div className="shrink-0 pt-4">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full font-black text-xs sm:text-sm flex items-center justify-center border-2 transition-all shadow-xs ${
                    phase.progress > 0
                      ? 'bg-[#5D0D1A] text-[#FFF9EB] border-[#5D0D1A]'
                      : 'bg-white text-[#5D0D1A] border-[#9FB2AC]'
                  }`}
                >
                  {phase.phaseNum}
                </div>
              </div>

              {/* Stacked Horizontal Phase Card */}
              <div
                onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                className={`flex-1 bg-white rounded-[22px] p-5 sm:p-6 border transition-all duration-200 cursor-pointer space-y-4 shadow-xs ${
                  isExpanded ? 'border-[#5D0D1A] ring-2 ring-[#5D0D1A]/10' : 'border-[#9FB2AC]/60 hover:border-[#5D0D1A]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Tinted Square Icon Box + Title/Subtitle/Tags */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${phase.iconBg}`}>
                      {phase.iconType === 'book' && <BookOpen size={24} />}
                      {phase.iconType === 'server' && <Server size={24} />}
                      {phase.iconType === 'database' && <Database size={24} />}
                      {phase.iconType === 'shield' && <Shield size={24} />}
                      {phase.iconType === 'code' && <Code2 size={24} />}
                      {phase.iconType === 'briefcase' && <Briefcase size={24} />}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-[#2D060D]">
                        {phase.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5A6C66] font-medium leading-relaxed">
                        {phase.subtitle}
                      </p>

                      {/* Skill Tags Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {phase.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-lg bg-[#F5EBF0] text-[#5D0D1A] text-[11px] font-extrabold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Timeline Badge, Progress Bar, Status Check Icon */}
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-[#9FB2AC]/30 pt-3 md:pt-0">
                    {/* Timeline Weeks Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-900 border border-pink-200/70 text-xs font-extrabold">
                      <Calendar size={14} className="text-pink-800" />
                      <span>{phase.timeline}</span>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="flex items-center gap-3 w-32 sm:w-36">
                      <span className="text-xs font-black text-[#5D0D1A] w-9 text-right">
                        {phase.progress}%
                      </span>
                      <div className="flex-1 h-2.5 bg-[#FFF9EB] rounded-full overflow-hidden border border-[#9FB2AC]/40">
                        <div
                          className="h-full bg-[#5D0D1A] rounded-full transition-all duration-300"
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Check Icon */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <div className="w-7 h-7 rounded-full bg-[#5D0D1A] text-white flex items-center justify-center shadow-xs">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      ) : isInProgress ? (
                        <div className="w-7 h-7 rounded-full bg-[#5D0D1A] text-white flex items-center justify-center shadow-xs">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-[#9FB2AC] bg-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Learning Modules & Resources Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-[#9FB2AC]/30 pt-4 mt-2 space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5D0D1A]">
                            Phase Sub-Modules & Learning Tasks:
                          </h4>
                          <span className="text-[11px] font-bold text-[#5A6C66]">
                            Click a task to update status
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {phase.tasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskAction(task.id);
                              }}
                              className="p-3.5 rounded-xl bg-[#FFF9EB]/80 border border-[#9FB2AC]/40 hover:border-[#5D0D1A] transition-all flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                    (topicProgress[task.id] ?? task.progress) === 100
                                      ? 'bg-[#5D0D1A] border-[#5D0D1A] text-white'
                                      : 'bg-white border-[#9FB2AC]'
                                  }`}
                                >
                                  {(topicProgress[task.id] ?? task.progress) === 100 && <Check size={12} strokeWidth={3} />}
                                </div>
                                <div>
                                  <h5 className="text-xs font-extrabold text-[#5D0D1A]">{task.title}</h5>
                                  <p className="text-[11px] text-[#5A6C66] font-medium">{task.desc}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-white border border-[#9FB2AC]/50 text-[#5D0D1A] shrink-0">
                                {(topicProgress[task.id] ?? task.progress) === 100 ? '✓ Completed' : (topicProgress[task.id] ?? task.progress) > 0 ? '⏳ In Progress' : '○ Start Task'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. BOTTOM PROGRESS BANNER (EXACT MATCH TO REFERENCE DESIGN) */}
      <div className="bg-[#FDF0F3] rounded-[22px] p-5 sm:p-6 border border-[#5D0D1A]/15 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#5D0D1A] text-[#FFF9EB] flex items-center justify-center shrink-0 shadow-xs">
            <Flag size={22} />
          </div>

          <div className="space-y-0.5">
            <h3 className="text-base font-extrabold text-[#5D0D1A]">
              Keep Going!
            </h3>
            <p className="text-xs text-[#5A6C66] font-medium leading-relaxed">
              You're {calculatedOverallProgress}% through your {careerTitle.toLowerCase()} roadmap. Stay consistent and complete your next milestone!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-extrabold text-[#5D0D1A]">
            Overall Progress
          </span>
          <span className="text-sm font-black text-[#5D0D1A] min-w-[32px]">
            {calculatedOverallProgress}%
          </span>
          <div className="w-28 sm:w-36 h-2.5 bg-white rounded-full overflow-hidden border border-[#5D0D1A]/20">
            <div
              className="h-full bg-[#5D0D1A] rounded-full transition-all duration-300"
              style={{ width: `${calculatedOverallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
