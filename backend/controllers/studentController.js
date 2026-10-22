import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import AssessmentScore from '../models/AssessmentScore.js';
import SoftSkillAttempt from '../models/SoftSkillAttempt.js';
import CareerRecommendation from '../models/CareerRecommendation.js';
import CareerRoadmap from '../models/CareerRoadmap.js';
import Resume from '../models/Resume.js';
import PortfolioAnalysis from '../models/PortfolioAnalysis.js';
import Course from '../models/Course.js';
import CourseModule from '../models/CourseModule.js';
import CourseLesson from '../models/CourseLesson.js';
import CoursePDFResource from '../models/CoursePDFResource.js';
import CourseTextResource from '../models/CourseTextResource.js';
import CourseQuiz from '../models/CourseQuiz.js';
import CourseQuizAttempt from '../models/CourseQuizAttempt.js';
import CourseProgress from '../models/CourseProgress.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import Payment from '../models/Payment.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import fs from 'fs';
import path from 'path';

import {
  extractTextFromBuffer,
  analyzeResumeContent,
  validateIsResume,
  fetchPortfolioTextContent,
  analyzePortfolioContent,
  generateCodingAssessmentQuestion,
  executeCodeAgainstTestCases,
  generateAICodeReview,
  generateCareerRecommendations as generateCareerRecommendationsService,
  generateAIRoadmapForCareer,
  generateSoftSkillAssessmentQuestion,
  evaluateSoftSkillAssessment,
} from '../services/aiService.js';


/**
 * Reusable function to calculate dynamic Profile Completion Percentage (0 - 100%)
 * Evaluates 8 key profile sections/fields
 */
export const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;

  const checks = [
    // 1. Personal Phone
    Boolean(profile.phone && profile.phone.trim()),
    // 2. Academic Info (College + Degree)
    Boolean(profile.college && profile.college.trim() && profile.degree && profile.degree.trim()),
    // 3. Career Goal or Preferred Job Role
    Boolean((profile.targetCareer && profile.targetCareer.trim()) || (profile.preferredJobRole && profile.preferredJobRole.trim())),
    // 4. Technical Skills
    Boolean(profile.technicalSkills && profile.technicalSkills.length > 0),
    // 5. Soft Skills
    Boolean(profile.softSkills && profile.softSkills.length > 0),
    // 6. LinkedIn Link
    Boolean(profile.linkedin && profile.linkedin.trim()),
    // 7. GitHub Link
    Boolean(profile.github && profile.github.trim()),
    // 8. Portfolio Link
    Boolean(profile.portfolio && profile.portfolio.trim()),
  ];

  const completedSections = checks.filter(Boolean).length;
  return Math.round((completedSections / 8) * 100);
};

// URL validation helper
const isValidUrl = (urlStr) => {
  if (!urlStr || !urlStr.trim()) return true;
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$',
    'i'
  );
  return pattern.test(urlStr.trim());
};

// @desc    Get authenticated student profile
// @route   GET /api/student/profile
// @access  Private (Student)
export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch User for authenticated name and email
    const user = await User.findById(userId).select('fullName name email role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Authenticated user not found' });
    }

    const userName = user.fullName || user.name || req.user.fullName || req.user.name || 'Student';

    // Find or initialize StudentProfile safely handling concurrency
    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      try {
        profile = await StudentProfile.create({ user: userId });
      } catch (createErr) {
        if (createErr.code === 11000 || createErr.name === 'MongoError' || createErr.name === 'MongoServerError') {
          profile = await StudentProfile.findOne({ user: userId });
        }
        if (!profile) {
          profile = new StudentProfile({ user: userId });
          await profile.save();
        }
      }
    }

    // Calculate completion percentage
    const completion = calculateProfileCompletion(profile);
    if (profile.profileCompletion !== completion) {
      profile.profileCompletion = completion;
      await profile.save().catch(() => { });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: userName,
          email: user.email,
          role: user.role,
        },
        profile: profile.toObject ? profile.toObject() : profile,
      },
    });
  } catch (error) {
    console.error('[Get Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch student profile from database',
    });
  }
};

// @desc    Create or update authenticated student profile
// @route   PUT /api/student/profile
// @access  Private (Student)
export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      try {
        profile = new StudentProfile({ user: userId });
      } catch (createErr) {
        if (createErr.code === 11000) {
          profile = await StudentProfile.findOne({ user: userId });
        } else {
          throw createErr;
        }
      }
    }

    const {
      phone,
      profilePhoto,
      college,
      degree,
      specialization,
      graduationYear,
      cgpa,
      targetCareer,
      preferredJobRole,
      careerInterests,
      technicalSkills,
      softSkills,
      linkedin,
      github,
      portfolio,
    } = req.body;

    // --- Strict Backend Validation Rules ---

    // 1. Phone Number Validation
    if (phone && String(phone).trim()) {
      const strVal = String(phone).trim();
      let numberPart = strVal;
      if (strVal.startsWith('+')) {
        const spaceIdx = strVal.indexOf(' ');
        numberPart = spaceIdx > 0 ? strVal.slice(spaceIdx + 1) : strVal.replace(/^\+\d{1,4}/, '');
      } else if (/^91[6-9]\d{9}$/.test(strVal)) {
        numberPart = strVal.slice(2);
      } else if (/^0[6-9]\d{9}$/.test(strVal)) {
        numberPart = strVal.slice(1);
      }

      const digitsOnly = numberPart.replace(/\D/g, '');
      if (digitsOnly.length > 0) {
        if (!/^[6-9]/.test(digitsOnly)) {
          return res.status(400).json({
            success: false,
            message: 'Phone number must start with 6, 7, 8, or 9',
          });
        }
        if (digitsOnly.length !== 10) {
          return res.status(400).json({
            success: false,
            message: `Phone number must contain exactly 10 digits (got ${digitsOnly.length})`,
          });
        }
      }
    }

    // 2. CGPA / Percentage Validation
    if (cgpa !== undefined && cgpa !== null && String(cgpa).trim() !== '') {
      const numCgpa = parseFloat(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 100) {
        return res.status(400).json({
          success: false,
          message: 'CGPA / Percentage must be a valid number between 0 and 100',
        });
      }
    }

    // 3. Graduation Year Validation
    if (graduationYear && String(graduationYear).trim() !== '') {
      const yr = parseInt(graduationYear);
      if (isNaN(yr) || yr < 2000 || yr > 2035) {
        return res.status(400).json({
          success: false,
          message: 'Graduation year must be between 2000 and 2035',
        });
      }
    }

    // 4. LinkedIn URL Validation
    if (linkedin && linkedin.trim() !== '') {
      if (!isValidUrl(linkedin) || !linkedin.toLowerCase().includes('linkedin')) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn must be a valid URL (e.g. https://linkedin.com/in/username)',
        });
      }
    }

    // 5. GitHub URL Validation
    if (github && github.trim() !== '') {
      if (!isValidUrl(github) || !github.toLowerCase().includes('github')) {
        return res.status(400).json({
          success: false,
          message: 'GitHub must be a valid URL (e.g. https://github.com/username)',
        });
      }
    }

    // 6. Portfolio URL Validation
    if (portfolio && portfolio.trim() !== '') {
      if (!isValidUrl(portfolio)) {
        return res.status(400).json({
          success: false,
          message: 'Portfolio must be a valid web URL (e.g. https://myportfolio.dev)',
        });
      }
    }

    // --- Apply Updates to Document ---
    if (phone !== undefined) profile.phone = String(phone).trim();
    if (profilePhoto !== undefined) profile.profilePhoto = String(profilePhoto).trim();
    if (college !== undefined) profile.college = String(college).trim();
    if (degree !== undefined) profile.degree = String(degree).trim();
    if (specialization !== undefined) profile.specialization = String(specialization).trim();
    if (graduationYear !== undefined) profile.graduationYear = String(graduationYear).trim();
    if (cgpa !== undefined) profile.cgpa = String(cgpa).trim();
    if (targetCareer !== undefined) profile.targetCareer = String(targetCareer).trim();
    if (preferredJobRole !== undefined) profile.preferredJobRole = String(preferredJobRole).trim();
    if (careerInterests !== undefined) profile.careerInterests = String(careerInterests).trim();

    if (Array.isArray(technicalSkills)) {
      profile.technicalSkills = [...new Set(technicalSkills.map((s) => String(s).trim()).filter(Boolean))];
    }
    if (Array.isArray(softSkills)) {
      profile.softSkills = [...new Set(softSkills.map((s) => String(s).trim()).filter(Boolean))];
    }

    if (linkedin !== undefined) profile.linkedin = String(linkedin).trim();
    if (github !== undefined) profile.github = String(github).trim();
    if (portfolio !== undefined) profile.portfolio = String(portfolio).trim();

    // Recalculate Profile Completion Percentage
    const newCompletion = calculateProfileCompletion(profile);
    profile.profileCompletion = newCompletion;

    // Log Activity with accurate current Date timestamp
    const now = new Date();
    profile.activities.unshift({
      title: 'Profile Updated',
      desc: `Updated professional profile (${newCompletion}% completed)`,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
    });

    if (profile.activities.length > 15) {
      profile.activities = profile.activities.slice(0, 15);
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      data: {
        profile,
        profileCompletion: newCompletion,
      },
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while saving student profile',
    });
  }
};

// @desc    Get authenticated student dashboard statistics
// @route   GET /api/student/dashboard-stats
// @access  Private (Student)
export const getStudentDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      try {
        profile = await StudentProfile.create({ user: userId });
      } catch (createErr) {
        if (createErr.code === 11000 || createErr.name === 'MongoError' || createErr.name === 'MongoServerError') {
          profile = await StudentProfile.findOne({ user: userId });
        }
        if (!profile) {
          profile = new StudentProfile({ user: userId });
          await profile.save().catch(() => { });
        }
      }
    }

    // 1. Profile Completion – calculate from the student's completed profile fields
    const profileCompletion = calculateProfileCompletion(profile);
    if (profile && profile.profileCompletion !== profileCompletion) {
      profile.profileCompletion = profileCompletion;
      await profile.save().catch(() => { });
    }

    const allSkills = profile ? [
      ...(profile.technicalSkills || []),
      ...(profile.softSkills || []),
    ] : [];

    // 2. Resume Score – show the latest AI resume analysis score out of 100 from MongoDB
    let resumeDoc = await Resume.findOne({ user: userId, status: 'active' }).sort({ createdAt: -1 });
    if (!resumeDoc) {
      resumeDoc = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
    }

    const hasUploadedResume = Boolean(
      resumeDoc || (profile && profile.resumeAnalysis && profile.resumeAnalysis.analyzedAt)
    );

    let resumeScoreVal = 0;
    if (resumeDoc) {
      resumeScoreVal = resumeDoc.atsScore || 0;
    } else if (profile?.resumeAnalysis?.atsScore !== undefined && profile?.resumeAnalysis?.atsScore !== null) {
      resumeScoreVal = profile.resumeAnalysis.atsScore;
    } else if (profile?.resumeScore !== null && profile?.resumeScore !== undefined) {
      resumeScoreVal = profile.resumeScore;
    }

    const resumeScoreDisplay = hasUploadedResume ? `${resumeScoreVal}` : '0';
    const resumeStatus = hasUploadedResume ? `Score: ${resumeScoreVal}/100` : 'Resume Not Uploaded';

    // 3. Assessment Score – show the student's actual overall assessment score and number of completed assessments
    const codingAttempts = await AssessmentAttempt.find({ student: userId }).sort({ completedAt: -1 });
    const softSkillAttempts = await SoftSkillAttempt.find({ student: userId }).sort({ completedAt: -1 });

    const totalCompletedAssessments = codingAttempts.length + softSkillAttempts.length;
    const hasCompletedAssessment = totalCompletedAssessments > 0 || Boolean(profile && profile.assessmentsCompleted > 0);

    let overallAssessmentScoreVal = 0;
    if (totalCompletedAssessments > 0) {
      const allAttempts = [...codingAttempts, ...softSkillAttempts];
      const sumScores = allAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
      overallAssessmentScoreVal = Math.round(sumScores / totalCompletedAssessments);

      // Auto-sync AssessmentScore aggregate document in MongoDB if missing
      let scoreDoc = await AssessmentScore.findOne({ student: userId });
      if (!scoreDoc && codingAttempts.length > 0) {
        const totalCount = codingAttempts.length;
        const scores = codingAttempts.map((a) => a.score || 0);
        const maxScore = Math.max(...scores);
        const avgCodeQuality = Math.round(codingAttempts.reduce((sum, a) => sum + (a.skillScores?.codeQuality || 0), 0) / totalCount);
        const avgProblemSolving = Math.round(codingAttempts.reduce((sum, a) => sum + (a.skillScores?.problemSolving || 0), 0) / totalCount);
        const avgTestCorrectness = Math.round(codingAttempts.reduce((sum, a) => sum + (a.skillScores?.testCorrectness || 0), 0) / totalCount);

        scoreDoc = await AssessmentScore.create({
          student: userId,
          overallScore: overallAssessmentScoreVal,
          codeQualityScore: avgCodeQuality,
          problemSolvingScore: avgProblemSolving,
          testCorrectnessScore: avgTestCorrectness,
          assessmentsCompleted: totalCompletedAssessments,
          highestScore: maxScore,
          averageScore: overallAssessmentScoreVal,
          lastAssessmentLanguage: codingAttempts[0]?.language || 'JavaScript',
          lastAssessmentDifficulty: codingAttempts[0]?.difficulty || 'Beginner',
          lastCompletedAt: codingAttempts[0]?.completedAt || new Date(),
          latestAttempt: codingAttempts[0]?._id,
        }).catch((err) => console.warn('[AssessmentScore Sync Warning]:', err.message));
      }
    } else if (profile?.assessmentScore !== null && profile?.assessmentScore !== undefined && profile.assessmentsCompleted > 0) {
      overallAssessmentScoreVal = profile.assessmentScore;
    }

    const assessmentScoreDisplay = hasCompletedAssessment ? `${overallAssessmentScoreVal}%` : '0%';
    const assessmentStatus = hasCompletedAssessment
      ? `${totalCompletedAssessments} assessment${totalCompletedAssessments === 1 ? '' : 's'} completed`
      : 'Assessment Not Attempted';

    // 4. Career Match – show the latest AI career recommendation match percentage and recommended career
    let careerRecDoc = await CareerRecommendation.findOne({ user: userId, status: 'active' }).sort({ createdAt: -1 });
    if (!careerRecDoc) {
      careerRecDoc = await CareerRecommendation.findOne({ user: userId }).sort({ createdAt: -1 });
    }

    let recommendedCareerTitle = '';
    let careerMatchPct = null;

    if (careerRecDoc) {
      recommendedCareerTitle = careerRecDoc.topMatch?.careerTitle || careerRecDoc.recommendations?.[0]?.careerTitle || '';
      careerMatchPct = careerRecDoc.topMatch?.matchPercentage ?? careerRecDoc.recommendations?.[0]?.matchPercentage ?? null;
    } else if (profile?.careerRecommendations?.recommendations?.length > 0) {
      const topRec = profile.careerRecommendations.recommendations[0];
      recommendedCareerTitle = topRec.careerTitle;
      careerMatchPct = topRec.matchPercentage;
    } else if (profile?.careerMatch !== null && profile?.careerMatch !== undefined && profile.careerMatchTitle) {
      recommendedCareerTitle = profile.careerMatchTitle;
      careerMatchPct = profile.careerMatch;
    }

    const hasCareerMatch = Boolean(careerMatchPct !== null && careerMatchPct !== undefined && recommendedCareerTitle && recommendedCareerTitle.trim());
    const careerMatchDisplay = hasCareerMatch ? `${careerMatchPct}%` : '0%';
    const careerMatchTitleStr = hasCareerMatch ? recommendedCareerTitle : 'No career recommendation yet';
    const careerMatchStatus = hasCareerMatch ? `Recommended: ${recommendedCareerTitle}` : 'No recommendation yet';

    // 5. Learning Progress – calculate actual progress from enrolled courses/roadmap tasks. Show 0% for students with no learning activity
    const enrollments = await CourseEnrollment.find({ studentId: userId, status: { $ne: 'dropped' } });
    let totalCourseTrackedItems = 0;
    let totalCourseCompletedItems = 0;

    if (enrollments.length > 0) {
      for (const enr of enrollments) {
        const courseId = enr.courseId;
        if (!courseId) continue;

        const progressDoc = await CourseProgress.findOne({ studentId: userId, courseId }).lean();
        const modules = await CourseModule.find({ courseId }).lean();

        for (const mod of modules) {
          const lessonsCount = await CourseLesson.countDocuments({ courseId, moduleId: mod._id });
          const pdfsCount = await CoursePDFResource.countDocuments({ courseId, moduleId: mod._id });
          const textsCount = await CourseTextResource.countDocuments({ courseId, moduleId: mod._id });
          const quizzesCount = await CourseQuiz.countDocuments({ courseId, moduleId: mod._id, status: 'published' });

          totalCourseTrackedItems += (lessonsCount + pdfsCount + textsCount + quizzesCount);
        }

        if (progressDoc) {
          totalCourseCompletedItems += (progressDoc.completedLessons?.length || 0) +
            (progressDoc.completedPDFs?.length || 0) +
            (progressDoc.completedResources?.length || 0) +
            (progressDoc.completedQuizzes?.length || 0) +
            (progressDoc.completedAssignments?.length || 0);
        }
      }
    }

    const courseProgressPct = totalCourseTrackedItems > 0
      ? Math.round((totalCourseCompletedItems / totalCourseTrackedItems) * 100)
      : 0;

    const activeRoadmap = await CareerRoadmap.findOne({ user: userId, status: 'active' }).sort({ createdAt: -1 });
    const roadmapProgressPct = activeRoadmap
      ? (activeRoadmap.progress || 0)
      : (profile?.selectedRoadmap?.matchPercentage ? (profile?.selectedRoadmap?.progress || 0) : 0);

    let overallLearningProgress = 0;
    if (enrollments.length > 0 && activeRoadmap) {
      overallLearningProgress = Math.round((courseProgressPct + roadmapProgressPct) / 2);
    } else if (enrollments.length > 0) {
      overallLearningProgress = courseProgressPct;
    } else if (activeRoadmap) {
      overallLearningProgress = roadmapProgressPct;
    } else if (profile?.learningProgress) {
      overallLearningProgress = profile.learningProgress;
    }

    overallLearningProgress = Math.min(100, Math.max(0, overallLearningProgress));

    let learningProgressStatus = 'No Learning Progress Yet';
    if (overallLearningProgress > 0) {
      if (totalCourseTrackedItems > 0) {
        learningProgressStatus = `${totalCourseCompletedItems} of ${totalCourseTrackedItems} items completed`;
      } else if (activeRoadmap?.completedMilestones?.length) {
        learningProgressStatus = `${activeRoadmap.completedMilestones.length} milestone(s) completed`;
      } else {
        learningProgressStatus = `${overallLearningProgress}% overall progress`;
      }
    }

    const learningProgressDisplay = `${overallLearningProgress}%`;

    // 6. Projects Completed – show the actual number of completed projects. Show 0 for new students
    const allProgressDocs = await CourseProgress.find({ studentId: userId });
    let completedAssignmentsCount = 0;
    allProgressDocs.forEach((doc) => {
      if (Array.isArray(doc.completedAssignments)) {
        completedAssignmentsCount += doc.completedAssignments.length;
      }
    });

    let completedRoadmapProjects = 0;
    if (activeRoadmap?.completedMilestones?.length) {
      completedRoadmapProjects = activeRoadmap.completedMilestones.filter((m) =>
        typeof m === 'string' && (m.toLowerCase().includes('project') || m.toLowerCase().includes('build'))
      ).length;
    }

    const baseProfileProjects = profile ? (profile.projectsCompleted || 0) : 0;
    const totalProjectsCompleted = Math.max(baseProfileProjects, completedAssignmentsCount + completedRoadmapProjects);

    const skillsCompleted = allSkills.length;
    const targetSkillsCount = profile ? (profile.targetSkillsCount || (allSkills.length > 0 ? Math.max(allSkills.length, 10) : 0)) : 0;
    const skillsDisplay = `${skillsCompleted} / ${targetSkillsCount}`;

    return res.status(200).json({
      success: true,
      data: {
        profileCompletion,
        resumeScore: resumeScoreDisplay,
        resumeStatus,
        hasUploadedResume,
        assessmentScore: assessmentScoreDisplay,
        assessmentStatus,
        hasCompletedAssessment,
        careerMatch: careerMatchDisplay,
        careerMatchTitle: careerMatchTitleStr,
        careerMatchStatus,
        hasCareerMatch,
        careerMatchSkills: allSkills.length > 0 ? allSkills.slice(0, 4) : [],
        learningProgress: learningProgressDisplay,
        learningProgressValue: overallLearningProgress,
        learningProgressStatus,
        projectsCompleted: totalProjectsCompleted,
        skillsCompleted,
        targetSkillsCount,
        skillsDisplay,
        activities: profile ? (profile.activities || []) : [],
      },
    });
  } catch (error) {
    console.error('[Get Student Stats Error]:', error);
    return res.status(200).json({
      success: true,
      data: {
        profileCompletion: 0,
        resumeScore: '0',
        resumeStatus: 'Resume Not Uploaded',
        hasUploadedResume: false,
        assessmentScore: '0%',
        assessmentStatus: 'Assessment Not Attempted',
        hasCompletedAssessment: false,
        careerMatch: '0%',
        careerMatchTitle: 'No career recommendation yet',
        careerMatchStatus: 'No recommendation yet',
        hasCareerMatch: false,
        careerMatchSkills: [],
        learningProgress: '0%',
        learningProgressValue: 0,
        learningProgressStatus: 'No Learning Progress Yet',
        projectsCompleted: 0,
        skillsCompleted: 0,
        targetSkillsCount: 0,
        skillsDisplay: '0 / 0',
        activities: [],
      },
    });
  }
};

// @desc    Analyze uploaded student resume using AI
// @route   POST /api/student/resume/analyze
// @access  Private (Student)
export const analyzeStudentResume = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file && !req.body.resumeText) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file (PDF, DOCX, or TXT)',
      });
    }

    let rawText = '';
    let fileName = 'Uploaded Resume';
    let fileSize = '';

    if (req.file) {
      fileName = req.file.originalname || 'Uploaded Resume';
      fileSize = `${(req.file.size / 1024).toFixed(1)} KB`;
      rawText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, fileName);
    } else if (req.body.resumeText) {
      rawText = req.body.resumeText;
      fileName = req.body.fileName || 'Pasted Resume Content';
      fileSize = `${(rawText.length / 1024).toFixed(1)} KB`;
    }

    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract readable text from the uploaded document. Please ensure the document is not password-protected or image-only.',
      });
    }

    // Validate if document is a genuine resume/CV
    const resumeCheck = validateIsResume(rawText);
    if (!resumeCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: resumeCheck.reason,
      });
    }


    // Get user details for personalized prompt
    const user = await User.findById(userId).select('fullName name email');
    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      profile = new StudentProfile({ user: userId });
    }

    const targetRole = req.body.targetRole || profile.preferredJobRole || profile.targetCareer || 'Software Engineer';

    // Perform AI Analysis
    const analysisResult = await analyzeResumeContent(rawText, targetRole, {
      name: user?.fullName || user?.name || 'Student',
    });

    const now = new Date();
    const resumeAnalysis = {
      analyzedAt: now,
      fileName,
      fileSize,
      fileBuffer: req.file ? req.file.buffer : null,
      fileMimeType: req.file ? req.file.mimetype : 'application/pdf',
      targetRole,
      atsScore: analysisResult.atsScore,
      atsCompatibility: analysisResult.atsCompatibility,
      summary: analysisResult.summary,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      improvements: analysisResult.improvements,
      detectedSkills: analysisResult.detectedSkills,
      missingKeywords: analysisResult.missingKeywords,
      sectionScores: analysisResult.sectionScores,
      suggestedBulletRewrites: analysisResult.suggestedBulletRewrites,
    };

    // Save analysis to profile
    profile.resumeAnalysis = resumeAnalysis;
    profile.resumeScore = analysisResult.atsScore;

    // Recalculate profile completion
    profile.profileCompletion = calculateProfileCompletion(profile);

    // Push activity log
    profile.activities.unshift({
      title: 'Resume Analyzed with AI',
      desc: `Scored ${analysisResult.atsScore}/100 ATS compatibility for ${targetRole}`,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
    });

    if (profile.activities.length > 15) {
      profile.activities = profile.activities.slice(0, 15);
    }

    await profile.save();

    // Archive previous active resume analyses in MongoDB resumes collection
    await Resume.updateMany({ user: userId, status: 'active' }, { status: 'archived' });

    // Store new resume analysis in dedicated MongoDB resumes collection
    await Resume.create({
      user: userId,
      fileName,
      fileSize,
      fileBuffer: req.file ? req.file.buffer : null,
      fileMimeType: req.file ? req.file.mimetype : 'application/pdf',
      targetRole,
      atsScore: analysisResult.atsScore,
      atsCompatibility: analysisResult.atsCompatibility,
      summary: analysisResult.summary,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      improvements: analysisResult.improvements,
      detectedSkills: analysisResult.detectedSkills,
      missingKeywords: analysisResult.missingKeywords,
      sectionScores: analysisResult.sectionScores,
      suggestedBulletRewrites: analysisResult.suggestedBulletRewrites,
      status: 'active',
      analyzedAt: now,
    });

    return res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: {
        analysis: resumeAnalysis,
        resumeScore: profile.resumeScore,
      },
    });
  } catch (error) {
    console.error('[Analyze Resume Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while analyzing resume',
    });
  }
};

// @desc    Get latest stored resume analysis for student
// @route   GET /api/student/resume/latest
// @access  Private (Student)
export const getLatestResumeAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ user: userId });
    let standaloneResume = await Resume.findOne({ user: userId, status: 'active' }).sort({ createdAt: -1 });

    // Auto-sync profile.resumeAnalysis to resumes collection if standalone doc is missing
    if (!standaloneResume && profile?.resumeAnalysis?.analyzedAt) {
      try {
        standaloneResume = await Resume.create({
          user: userId,
          fileName: profile.resumeAnalysis.fileName || '',
          fileSize: profile.resumeAnalysis.fileSize || '',
          fileBuffer: profile.resumeAnalysis.fileBuffer || null,
          fileMimeType: profile.resumeAnalysis.fileMimeType || 'application/pdf',
          targetRole: profile.resumeAnalysis.targetRole || 'Software Engineer',
          atsScore: profile.resumeAnalysis.atsScore || 0,
          atsCompatibility: profile.resumeAnalysis.atsCompatibility || '',
          summary: profile.resumeAnalysis.summary || '',
          strengths: profile.resumeAnalysis.strengths || [],
          weaknesses: profile.resumeAnalysis.weaknesses || [],
          improvements: profile.resumeAnalysis.improvements || [],
          detectedSkills: profile.resumeAnalysis.detectedSkills || [],
          missingKeywords: profile.resumeAnalysis.missingKeywords || [],
          sectionScores: profile.resumeAnalysis.sectionScores || {},
          suggestedBulletRewrites: profile.resumeAnalysis.suggestedBulletRewrites || [],
          status: 'active',
          analyzedAt: profile.resumeAnalysis.analyzedAt,
        });
      } catch (syncErr) {
        console.warn('[Sync Resume Warning]:', syncErr.message);
      }
    }

    const analysisData = standaloneResume || (profile?.resumeAnalysis?.analyzedAt ? profile.resumeAnalysis : null);

    if (!analysisData) {
      return res.status(200).json({
        success: true,
        data: {
          hasAnalysis: false,
          analysis: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        hasAnalysis: true,
        analysis: analysisData,
        resumeScore: analysisData.atsScore || profile?.resumeScore || 0,
      },
    });
  } catch (error) {
    console.error('[Get Latest Resume Analysis Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve resume analysis',
    });
  }
};

// @desc    Delete stored resume analysis for student
// @route   DELETE /api/student/resume
// @access  Private (Student)
export const deleteStudentResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ user: userId });

    if (profile) {
      profile.resumeAnalysis = undefined;
      profile.resumeScore = null;
      profile.profileCompletion = calculateProfileCompletion(profile);
      await profile.save();
    }

    await Resume.updateMany({ user: userId, status: 'active' }, { status: 'archived' });

    return res.status(200).json({
      success: true,
      message: 'Resume analysis deleted successfully',
      data: {
        hasAnalysis: false,
        resumeScore: null,
      },
    });
  } catch (error) {
    console.error('[Delete Student Resume Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete resume analysis',
    });
  }
};

// @desc    Sync detected resume skills to student profile
// @route   POST /api/student/resume/sync-skills
// @access  Private (Student)
export const syncResumeSkills = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ user: userId });

    if (!profile || !profile.resumeAnalysis || !profile.resumeAnalysis.detectedSkills) {
      return res.status(400).json({
        success: false,
        message: 'No analyzed resume skills found to sync.',
      });
    }

    const detected = profile.resumeAnalysis.detectedSkills || [];
    const currentTech = profile.technicalSkills || [];
    const merged = [...new Set([...currentTech, ...detected])];

    profile.technicalSkills = merged;
    profile.profileCompletion = calculateProfileCompletion(profile);

    const now = new Date();
    profile.activities.unshift({
      title: 'Skills Synced from Resume',
      desc: `Added ${detected.length} skills from resume analysis to profile`,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
    });

    await profile.save();

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${detected.length} skills to profile`,
      data: {
        technicalSkills: profile.technicalSkills,
        profileCompletion: profile.profileCompletion,
      },
    });
  } catch (error) {
    console.error('[Sync Resume Skills Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync skills to profile',
    });
  }
};

/**
 * Get active recruiter job postings for students
 */
export const getAvailableJobsForStudent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { q, type, location } = req.query;

    const filter = { status: 'Active', isDeleted: { $ne: true } };

    if (type && type !== 'All') {
      filter.employmentType = new RegExp(type, 'i');
    }

    if (location && location.trim()) {
      filter.location = new RegExp(location.trim(), 'i');
    }

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { companyName: searchRegex },
        { description: searchRegex },
        { requiredSkills: searchRegex },
        { location: searchRegex },
      ];
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    // Fetch existing applications by this student
    const studentApplications = await Application.find({ student: userId }).select('job status createdAt');
    const appMap = new Map(studentApplications.map((app) => [app.job.toString(), app.status]));

    const formattedJobs = jobs.map((job) => {
      const isApplied = appMap.has(job._id.toString());
      return {
        ...job.toObject(),
        hasApplied: isApplied,
        applicationStatus: isApplied ? appMap.get(job._id.toString()) : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedJobs.length,
      data: formattedJobs,
    });
  } catch (error) {
    console.error('[Get Student Jobs Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job opportunities',
    });
  }
};

/**
 * Student Job Application Handler
 */
export const applyToJob = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      jobId,
      fullName,
      email,
      phone,
      degree,
      institution,
      graduationYear,
      skills,
      experienceType,
      experienceDetails,
      coverNote,
    } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job ID is required.' });
    }

    if (!skills || !String(skills).trim()) {
      return res.status(400).json({ success: false, message: 'Skills field is required to submit your job application.' });
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'Active' || job.isDeleted) {
      return res.status(404).json({ success: false, message: 'Job position not found or no longer active.' });
    }

    // Check if student already applied
    const existingApp = await Application.findOne({ job: jobId, student: userId });
    if (existingApp) {
      return res.status(400).json({ success: false, message: 'You have already applied to this job position.' });
    }

    const user = await User.findById(userId);
    const studentProfile = await StudentProfile.findOne({ user: userId });

    let resumeFileName = studentProfile?.resumeAnalysis?.fileName || 'Resume Document';
    let resumeFileBuffer = studentProfile?.resumeAnalysis?.fileBuffer || null;
    let resumeMimeType = studentProfile?.resumeAnalysis?.fileMimeType || 'application/pdf';

    if (req.file) {
      resumeFileName = req.file.originalname;
      resumeFileBuffer = req.file.buffer;
      resumeMimeType = req.file.mimetype;
    }

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    const isFresher = experienceType === 'Fresher' || !experienceType;
    const finalExpDetails = isFresher ? 'Fresher' : (experienceDetails || 'Experienced');

    const application = await Application.create({
      job: jobId,
      student: userId,
      studentProfile: studentProfile ? studentProfile._id : null,
      recruiter: job.recruiter,
      status: 'New',
      applicantName: fullName || user?.fullName || user?.name || 'Student Applicant',
      applicantEmail: email || user?.email || '',
      applicantPhone: phone || studentProfile?.phone || '',
      degree: degree || studentProfile?.degree || '',
      institution: institution || studentProfile?.college || '',
      graduationYear: graduationYear || studentProfile?.graduationYear || '',
      skills: parsedSkills,
      experienceType: isFresher ? 'Fresher' : 'Experienced',
      experienceDetails: finalExpDetails,
      resumeFileName: resumeFileName,
      resumeFileBuffer: resumeFileBuffer,
      resumeMimeType: resumeMimeType,
      coverNote: coverNote || '',
      matchScore: studentProfile?.resumeScore || 85,
    });

    // Increment applicationsCount on Job model
    job.applicationsCount = (job.applicationsCount || 0) + 1;
    await job.save();

    // Log activity on StudentProfile
    if (studentProfile) {
      const now = new Date();
      studentProfile.activities.unshift({
        title: `Applied to ${job.title}`,
        desc: `Submitted application to ${job.companyName} (${job.location})`,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: now,
      });
      await studentProfile.save();
    }

    return res.status(201).json({
      success: true,
      message: `Successfully applied to ${job.title} at ${job.companyName}!`,
      data: application,
    });
  } catch (error) {
    console.error('[Apply Job Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit job application',
    });
  }
};

/**
 * Helper function to generate a valid PDF 1.4 binary buffer for Job Descriptions
 */
const createJobDescriptionPdfBuffer = (job) => {
  const reqSkillsStr = job.requiredSkills && job.requiredSkills.length > 0 ? job.requiredSkills.join(', ') : 'Not specified';
  const prefSkillsStr = job.preferredSkills && job.preferredSkills.length > 0 ? job.preferredSkills.join(', ') : 'None';

  const textLines = [
    `CAREER PILOT AI - OFFICIAL JOB DESCRIPTION`,
    `--------------------------------------------------`,
    `Position Title: ${job.title || 'Job Position'}`,
    `Company: ${job.companyName || 'CareerPilot Hiring Partner'}`,
    `Location: ${job.location || 'Remote/Hybrid'}`,
    `Employment Type: ${job.employmentType || 'Full-time'}`,
    `Experience Required: ${job.experienceRequired || 'Not specified'}`,
    `Salary Range: ${job.salaryRange || 'Competitive'}`,
    `Education Required: ${job.education || 'Not specified'}`,
    ` `,
    `REQUIRED SKILLS: ${reqSkillsStr}`,
    `PREFERRED SKILLS: ${prefSkillsStr}`,
    ` `,
    `FULL JOB DESCRIPTION:`,
    ...(job.description || 'No description provided.')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 35)
  ];

  const streamContent = textLines
    .map((line) => `(${line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) '`)
    .join('\n');

  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength + 40} >>
stream
BT
/F1 11 Tf
40 740 Td
16 TL
${streamContent}
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000380 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;

  return Buffer.from(pdfString, 'utf-8');
};

/**
 * Download Job Description Document (PDF) for a job posting
 */
export const downloadJobDescriptionPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job position not found.' });
    }

    let buffer;
    let mimeType = 'application/pdf';
    let fileName = job.jdFileName;

    if (!fileName || !fileName.toLowerCase().endsWith('.pdf')) {
      const cleanCompany = (job.companyName || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanTitle = (job.title || 'Job_Position').replace(/[^a-zA-Z0-9_-]/g, '_');
      fileName = `${cleanCompany}_${cleanTitle}_JD.pdf`;
    }

    if (job.jdFileBase64 && job.jdFileBase64.trim()) {
      const matches = job.jdFileBase64.match(/^data:(.+);base64,(.+)$/);
      let rawBuffer;
      if (matches && matches.length === 3) {
        rawBuffer = Buffer.from(matches[2], 'base64');
      } else {
        rawBuffer = Buffer.from(job.jdFileBase64, 'base64');
      }

      // Verify if rawBuffer is a valid binary PDF (%PDF)
      const isPdfBinary = rawBuffer.slice(0, 4).toString() === '%PDF';
      if (isPdfBinary) {
        buffer = rawBuffer;
        mimeType = 'application/pdf';
      } else {
        // Generate valid PDF binary buffer
        buffer = createJobDescriptionPdfBuffer(job);
        mimeType = 'application/pdf';
      }
    } else {
      // Generate valid PDF binary buffer for jobs without raw PDF attached
      buffer = createJobDescriptionPdfBuffer(job);
      mimeType = 'application/pdf';
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error) {
    console.error('[Download JD Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download job description document',
    });
  }
};

// @desc    Analyze student portfolio website via AI
// @route   POST /api/student/portfolio/analyze
// @access  Private (Student)
export const analyzeStudentPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;
    const { portfolioUrl, apiKey, targetRole } = req.body;

    if (!portfolioUrl || !portfolioUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid portfolio URL (e.g. https://myportfolio.dev)',
      });
    }

    const trimmedUrl = portfolioUrl.trim();
    if (!isValidUrl(trimmedUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid website URL (e.g. https://myportfolio.dev)',
      });
    }

    const user = await User.findById(userId).select('fullName name email');
    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      profile = await StudentProfile.create({ user: userId });
    }

    // Fetch portfolio website text content
    console.log(`[Portfolio Controller]: Scraping & extracting text from ${trimmedUrl}...`);
    const extractedText = await fetchPortfolioTextContent(trimmedUrl);

    const userContext = {
      name: user?.fullName || user?.name || 'Student',
      email: user?.email || '',
    };

    const roleToAssess = (targetRole && targetRole.trim()) ? targetRole.trim() : (profile.targetCareer || profile.preferredJobRole || 'Software Engineer');

    // Run AI analysis
    const analysisResult = await analyzePortfolioContent(trimmedUrl, extractedText, roleToAssess, apiKey, userContext);

    // Save portfolio URL and portfolio analysis to profile
    profile.portfolio = trimmedUrl;
    profile.portfolioAnalysis = {
      analyzedAt: new Date(),
      portfolioUrl: trimmedUrl,
      overallScore: analysisResult.overallScore,
      overallReview: analysisResult.overallReview,
      ratingBreakdown: analysisResult.ratingBreakdown,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      recommendations: analysisResult.recommendations,
      detectedSkills: analysisResult.detectedSkills,
    };

    // Update Profile completion
    const newCompletion = calculateProfileCompletion(profile);
    profile.profileCompletion = newCompletion;

    // Log Activity
    const now = new Date();
    profile.activities.unshift({
      title: 'Portfolio Website Analyzed',
      desc: `Evaluated ${trimmedUrl} with AI (Score: ${analysisResult.overallScore}/100)`,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
    });

    if (profile.activities.length > 15) {
      profile.activities = profile.activities.slice(0, 15);
    }

    await profile.save();

    // Archive previous active portfolio entries in MongoDB portfolio_analyses collection
    await PortfolioAnalysis.updateMany({ user: userId, status: 'active' }, { status: 'archived' });

    // Store new portfolio analysis in dedicated MongoDB portfolio_analyses collection
    await PortfolioAnalysis.create({
      user: userId,
      portfolioUrl: trimmedUrl,
      targetRole: roleToAssess,
      overallScore: analysisResult.overallScore,
      overallReview: analysisResult.overallReview,
      ratingBreakdown: analysisResult.ratingBreakdown,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      recommendations: analysisResult.recommendations,
      detectedSkills: analysisResult.detectedSkills,
      status: 'active',
      analyzedAt: now,
    });

    return res.status(200).json({
      success: true,
      message: 'Portfolio analysis completed successfully!',
      data: {
        portfolioUrl: trimmedUrl,
        portfolioAnalysis: profile.portfolioAnalysis,
        profileCompletion: newCompletion,
      },
    });
  } catch (error) {
    console.error('[Portfolio Analysis Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while analyzing portfolio',
    });
  }
};

// @desc    Get latest portfolio analysis results
// @route   GET /api/student/portfolio/latest
// @access  Private (Student)
export const getLatestPortfolioAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ user: userId });
    let standalonePortfolio = await PortfolioAnalysis.findOne({ user: userId, status: 'active' }).sort({ createdAt: -1 });

    // Auto-sync profile.portfolioAnalysis to portfolio_analyses collection if standalone doc is missing
    if (!standalonePortfolio && profile?.portfolioAnalysis?.analyzedAt) {
      try {
        standalonePortfolio = await PortfolioAnalysis.create({
          user: userId,
          portfolioUrl: profile.portfolioAnalysis.portfolioUrl || profile.portfolio || '',
          targetRole: profile.targetCareer || profile.preferredJobRole || 'Software Engineer',
          overallScore: profile.portfolioAnalysis.overallScore || 0,
          overallReview: profile.portfolioAnalysis.overallReview || '',
          ratingBreakdown: profile.portfolioAnalysis.ratingBreakdown || {},
          strengths: profile.portfolioAnalysis.strengths || [],
          weaknesses: profile.portfolioAnalysis.weaknesses || [],
          recommendations: profile.portfolioAnalysis.recommendations || [],
          detectedSkills: profile.portfolioAnalysis.detectedSkills || [],
          status: 'active',
          analyzedAt: profile.portfolioAnalysis.analyzedAt,
        });
      } catch (syncErr) {
        console.warn('[Sync Portfolio Warning]:', syncErr.message);
      }
    }

    const analysisData = standalonePortfolio || (profile?.portfolioAnalysis?.analyzedAt ? profile.portfolioAnalysis : null);

    if (!analysisData) {
      return res.status(200).json({
        success: true,
        data: {
          hasAnalysis: false,
          portfolioUrl: profile?.portfolio || '',
          portfolioAnalysis: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        hasAnalysis: true,
        portfolioUrl: analysisData.portfolioUrl || profile?.portfolio || '',
        portfolioAnalysis: analysisData,
      },
    });
  } catch (error) {
    console.error('[Get Latest Portfolio Analysis Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching portfolio analysis',
    });
  }
};

// @desc    Delete stored portfolio analysis for student
// @route   DELETE /api/student/portfolio
// @access  Private (Student)
export const deleteStudentPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ user: userId });

    if (profile) {
      profile.portfolio = '';
      profile.portfolioAnalysis = undefined;
      profile.profileCompletion = calculateProfileCompletion(profile);
      await profile.save();
    }

    await PortfolioAnalysis.updateMany({ user: userId, status: 'active' }, { status: 'archived' });

    return res.status(200).json({
      success: true,
      message: 'Portfolio analysis deleted successfully',
      data: {
        hasAnalysis: false,
        portfolioUrl: '',
        portfolioAnalysis: null,
      },
    });
  } catch (error) {
    console.error('[Delete Student Portfolio Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete portfolio analysis',
    });
  }
};

// @desc    Generate AI Coding Assessment Challenge
// @route   POST /api/student/assessment/generate-challenge
// @access  Private (Student)
export const generateAssessmentChallenge = async (req, res) => {
  try {
    const { language = 'JavaScript', difficulty = 'Beginner' } = req.body;
    const question = await generateCodingAssessmentQuestion(language, difficulty);

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('[Generate Assessment Challenge Error]:', error);
    if (error.statusCode === 429 || error.isQuotaExhausted || (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')))) {
      return res.status(429).json({
        success: false,
        isQuotaExhausted: true,
        message: 'Gemini AI rate limit or quota exceeded (429 RESOURCE_EXHAUSTED). Please wait a moment and try again.',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate coding assessment challenge',
    });
  }
};

// @desc    Run student code against test cases
// @route   POST /api/student/assessment/run-code
// @access  Private (Student)
export const runAssessmentCode = async (req, res) => {
  try {
    const { language = 'JavaScript', code = '', testCases = [] } = req.body;
    const testResults = await executeCodeAgainstTestCases(language, code, testCases);

    return res.status(200).json({
      success: true,
      data: testResults,
    });
  } catch (error) {
    console.error('[Run Assessment Code Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute code against test cases',
    });
  }
};

// @desc    Submit coding assessment and generate AI review
// @route   POST /api/student/assessment/submit
// @access  Private (Student)
export const submitAssessmentCode = async (req, res) => {
  try {
    const userId = req.user._id;
    const { language = 'JavaScript', difficulty = 'Beginner', question, submittedCode } = req.body;

    if (!question || !submittedCode) {
      return res.status(400).json({
        success: false,
        message: 'Question details and submitted code are required',
      });
    }

    // 1. Run actual test cases
    const testResults = await executeCodeAgainstTestCases(language, submittedCode, question.testCases || []);

    // 2. Perform AI Code Review
    const review = await generateAICodeReview(question, submittedCode, language, testResults);

    // 3. Create AssessmentAttempt document
    const attempt = await AssessmentAttempt.create({
      student: userId,
      language,
      difficulty,
      question,
      submittedCode,
      testResults,
      score: review.score,
      skillScores: review.skillScores,
      aiFeedback: review.aiFeedback,
      completedAt: new Date(),
    });

    // 4. Calculate cumulative overall metrics across ALL attempts for this student
    const allAttempts = await AssessmentAttempt.find({ student: userId });
    const totalCount = allAttempts.length;
    const scores = allAttempts.map((a) => a.score || 0);
    const avgScore = Math.round(scores.reduce((sum, val) => sum + val, 0) / (totalCount || 1));
    const maxScore = Math.max(...scores, review.score);

    const avgCodeQuality = Math.round(allAttempts.reduce((sum, a) => sum + (a.skillScores?.codeQuality || 0), 0) / (totalCount || 1));
    const avgProblemSolving = Math.round(allAttempts.reduce((sum, a) => sum + (a.skillScores?.problemSolving || 0), 0) / (totalCount || 1));
    const avgTestCorrectness = Math.round(allAttempts.reduce((sum, a) => sum + (a.skillScores?.testCorrectness || 0), 0) / (totalCount || 1));

    // Update StudentProfile stats with cumulative overall score across all attempts
    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      profile = new StudentProfile({ user: userId });
    }

    profile.assessmentScore = avgScore; // Overall score based on all attempts
    profile.assessmentsCompleted = totalCount;

    const now = new Date();
    profile.activities.unshift({
      title: 'Coding Assessment Completed',
      desc: `Scored ${review.score}/100 on ${question.title} (${language}) • Overall Score: ${avgScore}% across ${totalCount} attempt(s)`,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
    });

    if (profile.activities.length > 15) {
      profile.activities = profile.activities.slice(0, 15);
    }

    await profile.save();

    // 5. Save/Update to new MongoDB Collection (AssessmentScore)
    const overallScoreDoc = await AssessmentScore.findOneAndUpdate(
      { student: userId },
      {
        student: userId,
        overallScore: avgScore, // Cumulative score across all student attempts
        codeQualityScore: avgCodeQuality,
        problemSolvingScore: avgProblemSolving,
        testCorrectnessScore: avgTestCorrectness,
        assessmentsCompleted: totalCount,
        highestScore: maxScore,
        averageScore: avgScore,
        lastAssessmentLanguage: language,
        lastAssessmentDifficulty: difficulty,
        lastCompletedAt: now,
        latestAttempt: attempt._id,
      },
      { upsert: true, new: true }
    );

    console.log(`[MongoDB assessmentscores]: Saved overall assessment score document for student ${userId} (Overall Score: ${avgScore}%, Total Attempts: ${totalCount})`);


    return res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: {
        attempt,
        overallScoreRecord: overallScoreDoc,
      },
    });


  } catch (error) {
    console.error('[Submit Assessment Code Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit assessment code',
    });
  }
};

// @desc    Get student assessment attempt history
// @route   GET /api/student/assessment/history
// @access  Private (Student)
export const getAssessmentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const attempts = await AssessmentAttempt.find({ student: userId })
      .sort({ completedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    console.error('[Get Assessment History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment history',
    });
  }
};

// @desc    Get existing career recommendations & prerequisite check for student
// @route   GET /api/student/career-recommendations
// @access  Private (Student)
export const getCareerRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ user: userId });
    const assessmentScoreDoc = await AssessmentScore.findOne({ student: userId });
    let standaloneDoc = await CareerRecommendation.findOne({ user: userId, status: 'active' }).sort({ createdAt: -1 });

    // Auto-sync embedded recommendations to career_recommendations collection if missing
    if (!standaloneDoc && profile?.careerRecommendations?.recommendations?.length > 0) {
      const recs = profile.careerRecommendations.recommendations;
      const topRec = recs[0] || {};
      try {
        standaloneDoc = await CareerRecommendation.create({
          user: userId,
          topMatch: {
            careerTitle: topRec.careerTitle || profile.careerMatchTitle || '',
            matchPercentage: topRec.matchPercentage || profile.careerMatch || 0,
            matchingSkills: topRec.matchingSkills || profile.careerMatchSkills || [],
          },
          recommendations: recs.map((r) => ({
            careerTitle: r.careerTitle,
            matchPercentage: r.matchPercentage,
            matchingSkills: r.matchingSkills || [],
            skillGaps: r.skillGaps || [],
            reason: r.reason || '',
            recommendedImprovements: r.recommendedImprovements || [],
          })),
          inputSnapshot: {
            technicalSkills: profile.technicalSkills || [],
            softSkills: profile.softSkills || [],
            degree: profile.degree || '',
            specialization: profile.specialization || '',
            targetCareer: profile.targetCareer || '',
            preferredJobRole: profile.preferredJobRole || '',
            resumeScore: profile.resumeScore,
            assessmentScore: assessmentScoreDoc?.overallScore || profile.assessmentScore || 0,
            portfolioScore: profile.portfolioAnalysis?.overallScore || 0,
          },
          status: 'active',
          generatedAt: profile.careerRecommendations?.generatedAt || new Date(),
        });
      } catch (syncErr) {
        console.warn('[Sync Career Recommendation Warning]:', syncErr.message);
      }
    }

    const hasProfile = Boolean(profile && (profile.technicalSkills?.length > 0 || profile.targetCareer || profile.careerInterests));
    const hasAssessment = Boolean((assessmentScoreDoc && assessmentScoreDoc.assessmentsCompleted > 0) || (profile && profile.assessmentsCompleted > 0));
    const hasResume = Boolean(profile && profile.resumeAnalysis && (profile.resumeAnalysis.atsScore > 0 || profile.resumeAnalysis.analyzedAt));
    const hasPortfolio = Boolean(profile && profile.portfolioAnalysis && (profile.portfolioAnalysis.overallScore > 0 || profile.portfolioAnalysis.analyzedAt));

    const isComplete = hasProfile && hasAssessment && hasResume && hasPortfolio;

    const requirements = {
      profile: hasProfile,
      assessment: hasAssessment,
      resumeAnalysis: hasResume,
      portfolioAnalysis: hasPortfolio,
    };

    const recommendationData = (standaloneDoc && standaloneDoc.recommendations?.length > 0)
      ? { generatedAt: standaloneDoc.generatedAt, recommendations: standaloneDoc.recommendations }
      : (profile?.careerRecommendations || { generatedAt: null, recommendations: [] });

    return res.status(200).json({
      success: true,
      hasEnoughData: isComplete,
      requirements,
      data: recommendationData,
      message: isComplete
        ? 'Prerequisites met.'
        : 'Complete your profile, assessment, resume analysis and portfolio analysis before generating career recommendations.',
    });
  } catch (error) {
    console.error('[Get Career Recommendations Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching career recommendations.',
    });
  }
};

// @desc    Generate AI Career Recommendations based on real student data
// @route   POST /api/student/career-recommendations/generate
// @access  Private (Student)
export const generateCareerRecommendationsController = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ user: userId });
    const assessmentScoreDoc = await AssessmentScore.findOne({ student: userId });

    const hasProfile = Boolean(profile && (profile.technicalSkills?.length > 0 || profile.targetCareer || profile.careerInterests));
    const hasAssessment = Boolean((assessmentScoreDoc && assessmentScoreDoc.assessmentsCompleted > 0) || (profile && profile.assessmentsCompleted > 0));
    const hasResume = Boolean(profile && profile.resumeAnalysis && (profile.resumeAnalysis.atsScore > 0 || profile.resumeAnalysis.analyzedAt));
    const hasPortfolio = Boolean(profile && profile.portfolioAnalysis && (profile.portfolioAnalysis.overallScore > 0 || profile.portfolioAnalysis.analyzedAt));

    const isComplete = hasProfile && hasAssessment && hasResume && hasPortfolio;

    if (!isComplete) {
      return res.status(400).json({
        success: false,
        incompleteData: true,
        requirements: {
          profile: hasProfile,
          assessment: hasAssessment,
          resumeAnalysis: hasResume,
          portfolioAnalysis: hasPortfolio,
        },
        message: 'Complete your profile, assessment, resume analysis and portfolio analysis before generating career recommendations.',
      });
    }

    // Build structured data payload from MongoDB for AI service
    const studentData = {
      name: req.user.name || profile.user?.name || 'Student',
      degree: profile.degree,
      specialization: profile.specialization,
      graduationYear: profile.graduationYear,
      cgpa: profile.cgpa,
      targetCareer: profile.targetCareer,
      preferredJobRole: profile.preferredJobRole,
      careerInterests: profile.careerInterests,
      technicalSkills: profile.technicalSkills || [],
      softSkills: profile.softSkills || [],
      resumeScore: profile.resumeScore,
      resumeAnalysis: profile.resumeAnalysis || {},
      portfolioAnalysis: profile.portfolioAnalysis || {},
      assessmentScore: assessmentScoreDoc || {
        overallScore: profile.assessmentScore || 0,
        codeQualityScore: 0,
        problemSolvingScore: 0,
        testCorrectnessScore: 0,
        assessmentsCompleted: profile.assessmentsCompleted || 0,
      },
    };

    const recommendations = await generateCareerRecommendationsService(studentData);

    const topRec = recommendations[0] || {};

    // Archive previous active career recommendations in MongoDB collection
    await CareerRecommendation.updateMany({ user: userId, status: 'active' }, { status: 'archived' });

    // Store generated recommendations in dedicated MongoDB career_recommendations collection
    await CareerRecommendation.create({
      user: userId,
      topMatch: {
        careerTitle: topRec.careerTitle || '',
        matchPercentage: topRec.matchPercentage || 0,
        matchingSkills: topRec.matchingSkills || [],
      },
      recommendations,
      inputSnapshot: {
        technicalSkills: profile.technicalSkills || [],
        softSkills: profile.softSkills || [],
        degree: profile.degree || '',
        specialization: profile.specialization || '',
        targetCareer: profile.targetCareer || '',
        preferredJobRole: profile.preferredJobRole || '',
        resumeScore: profile.resumeScore,
        assessmentScore: assessmentScoreDoc?.overallScore || profile.assessmentScore || 0,
        portfolioScore: profile.portfolioAnalysis?.overallScore || 0,
      },
      status: 'active',
      generatedAt: new Date(),
    });

    profile.careerRecommendations = {
      generatedAt: new Date(),
      recommendations,
    };

    if (topRec.careerTitle) {
      profile.careerMatchTitle = topRec.careerTitle;
      profile.careerMatch = topRec.matchPercentage;
      profile.careerMatchSkills = topRec.matchingSkills;
    }

    // Record Activity
    profile.activities.unshift({
      title: 'AI Career Recommendations Generated',
      desc: `Generated ${recommendations.length} recommendations. Top match: ${topRec.careerTitle || 'N/A'} (${topRec.matchPercentage || 0}% match).`,
      time: 'Just now',
      timestamp: new Date(),
    });

    await profile.save();

    return res.status(200).json({
      success: true,
      data: profile.careerRecommendations,
      message: 'Career recommendations successfully generated.',
    });
  } catch (error) {
    console.error('[Generate Career Recommendations Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate career recommendations.',
    });
  }
};

// @desc    Get authenticated student roadmap from MongoDB (isolated per user ID)
// @route   GET /api/student/roadmap
// @access  Private (Student)
export const getStudentRoadmap = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ user: userId });
    const assessmentScoreDoc = await AssessmentScore.findOne({ student: userId });
    let standaloneRoadmap = await CareerRoadmap.findOne({ user: userId, status: 'active' }).sort({ createdAt: -1 });

    const hasProfile = Boolean(profile && (profile.technicalSkills?.length > 0 || profile.targetCareer || profile.careerInterests));
    const hasAssessment = Boolean((assessmentScoreDoc && assessmentScoreDoc.assessmentsCompleted > 0) || (profile && profile.assessmentsCompleted > 0));
    const hasResume = Boolean(profile && profile.resumeAnalysis && (profile.resumeAnalysis.atsScore > 0 || profile.resumeAnalysis.analyzedAt));
    const hasPortfolio = Boolean(profile && profile.portfolioAnalysis && (profile.portfolioAnalysis.overallScore > 0 || profile.portfolioAnalysis.analyzedAt));
    const hasCareerRec = Boolean(profile && profile.careerRecommendations?.recommendations?.length > 0);

    const requirements = {
      profile: hasProfile,
      assessment: hasAssessment,
      resumeAnalysis: hasResume,
      portfolioAnalysis: hasPortfolio,
      careerRecommendation: hasCareerRec,
    };

    // Auto-sync embedded profile.selectedRoadmap to CareerRoadmap collection if missing
    if (!standaloneRoadmap && profile?.selectedRoadmap?.careerTitle) {
      try {
        standaloneRoadmap = await CareerRoadmap.create({
          user: userId,
          careerTitle: profile.selectedRoadmap.careerTitle,
          matchPercentage: profile.selectedRoadmap.matchPercentage || 85,
          matchingSkills: profile.selectedRoadmap.matchingSkills || [],
          skillGaps: profile.selectedRoadmap.skillGaps || [],
          phases: profile.selectedRoadmap.phases || [],
          recommendedResources: profile.selectedRoadmap.recommendedResources || [],
          milestonesList: profile.selectedRoadmap.milestonesList || [],
          aiTip: profile.selectedRoadmap.aiTip || '',
          status: 'active',
        });
      } catch (syncErr) {
        console.warn('[Sync Career Roadmap Warning]:', syncErr.message);
      }
    }

    let roadmapData = standaloneRoadmap || (profile?.selectedRoadmap?.careerTitle ? profile.selectedRoadmap : null);
    if (!roadmapData && hasCareerRec) {
      roadmapData = profile.careerRecommendations.recommendations[0];
    }

    if (!roadmapData || !roadmapData.careerTitle) {
      return res.status(200).json({
        success: true,
        hasCareerRecommendation: hasCareerRec,
        hasRoadmap: false,
        requirements,
        recommendedCareer: profile?.careerRecommendations?.recommendations?.[0] || null,
        roadmap: null,
      });
    }

    // If existing stored roadmap lacks dynamic phases, generate dynamic AI roadmap
    if (!roadmapData.phases || roadmapData.phases.length === 0) {
      const generated = await generateAIRoadmapForCareer(
        roadmapData.careerTitle,
        roadmapData.matchingSkills || [],
        roadmapData.skillGaps || [],
        { name: req.user.name || 'Student' }
      );

      if (profile) {
        profile.selectedRoadmap = {
          careerTitle: roadmapData.careerTitle,
          matchPercentage: roadmapData.matchPercentage || 85,
          matchingSkills: roadmapData.matchingSkills || [],
          skillGaps: roadmapData.skillGaps || [],
          phases: generated.phases,
          recommendedResources: generated.recommendedResources,
          milestonesList: generated.milestonesList,
          aiTip: generated.aiTip,
          updatedAt: new Date(),
        };
        await profile.save();
      }

      await CareerRoadmap.updateMany({ user: userId, status: 'active' }, { status: 'archived' });
      standaloneRoadmap = await CareerRoadmap.create({
        user: userId,
        careerTitle: roadmapData.careerTitle,
        matchPercentage: roadmapData.matchPercentage || 85,
        matchingSkills: roadmapData.matchingSkills || [],
        skillGaps: roadmapData.skillGaps || [],
        phases: generated.phases,
        recommendedResources: generated.recommendedResources,
        milestonesList: generated.milestonesList,
        aiTip: generated.aiTip,
        status: 'active',
      });
      roadmapData = standaloneRoadmap;
    }

    return res.status(200).json({
      success: true,
      hasCareerRecommendation: hasCareerRec,
      hasRoadmap: true,
      requirements,
      recommendedCareer: profile?.careerRecommendations?.recommendations?.[0] || null,
      roadmap: roadmapData,
    });
  } catch (error) {
    console.error('[Get Student Roadmap Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching student roadmap',
    });
  }
};

// @desc    Save/Select personalized roadmap for authenticated student in MongoDB
// @route   POST /api/student/roadmap/select
// @access  Private (Student)
export const saveStudentRoadmap = async (req, res) => {
  try {
    const userId = req.user._id;
    const { careerTitle, matchPercentage, matchingSkills, skillGaps } = req.body;

    if (!careerTitle) {
      return res.status(400).json({
        success: false,
        message: 'Career title is required to select roadmap',
      });
    }

    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      profile = new StudentProfile({ user: userId });
    }

    // Generate custom AI Roadmap (phases + course recommendations) for selected career title
    const roadmapResult = await generateAIRoadmapForCareer(
      careerTitle,
      matchingSkills || [],
      skillGaps || [],
      { name: req.user.name || 'Student' }
    );

    const roadmapDataPayload = {
      careerTitle,
      matchPercentage: matchPercentage || roadmapResult.matchPercentage || 85,
      matchingSkills: matchingSkills || roadmapResult.matchingSkills || [],
      skillGaps: skillGaps || roadmapResult.skillGaps || [],
      phases: roadmapResult.phases,
      recommendedResources: roadmapResult.recommendedResources,
      milestonesList: roadmapResult.milestonesList,
      aiTip: roadmapResult.aiTip,
      updatedAt: new Date(),
    };

    profile.selectedRoadmap = roadmapDataPayload;
    profile.careerMatchTitle = careerTitle;
    profile.careerMatch = matchPercentage || 85;
    profile.careerMatchSkills = matchingSkills || [];

    await profile.save();

    // Archive old active roadmaps in MongoDB career_roadmaps collection
    await CareerRoadmap.updateMany({ user: userId, status: 'active' }, { status: 'archived' });

    // Store generated roadmap entry in standalone MongoDB career_roadmaps collection
    const createdRoadmap = await CareerRoadmap.create({
      user: userId,
      careerTitle,
      matchPercentage: matchPercentage || roadmapResult.matchPercentage || 85,
      matchingSkills: matchingSkills || roadmapResult.matchingSkills || [],
      skillGaps: skillGaps || roadmapResult.skillGaps || [],
      phases: roadmapResult.phases,
      recommendedResources: roadmapResult.recommendedResources,
      milestonesList: roadmapResult.milestonesList,
      aiTip: roadmapResult.aiTip,
      status: 'active',
    });

    return res.status(200).json({
      success: true,
      roadmap: createdRoadmap,
      message: `Roadmap selected for ${careerTitle}`,
    });
  } catch (error) {
    console.error('[Save Student Roadmap Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save roadmap selection',
    });
  }
};

// @desc    Generate AI Soft Skill Assessment Scenarios
// @route   POST /api/student/assessment/soft-skill/generate
// @access  Private (Student)
export const generateSoftSkillAssessment = async (req, res) => {
  try {
    const { category = 'Communication & Active Listening', difficulty = 'Beginner' } = req.body;
    const questions = await generateSoftSkillAssessmentQuestion(category, difficulty);

    return res.status(200).json({
      success: true,
      data: {
        category,
        difficulty,
        questions,
      },
    });
  } catch (error) {
    console.error('[Generate Soft Skill Assessment Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate soft skill assessment scenarios',
    });
  }
};

// @desc    Submit Soft Skill Assessment and Evaluate Result
// @route   POST /api/student/assessment/soft-skill/submit
// @access  Private (Student)
export const submitSoftSkillAssessment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category = 'Communication & Active Listening', difficulty = 'Beginner', questions = [], userAnswers = {} } = req.body;

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assessment questions and answers are required',
      });
    }

    // AI Evaluation
    const evaluation = await evaluateSoftSkillAssessment(category, difficulty, questions, userAnswers);

    // Save Attempt to DB
    const attempt = await SoftSkillAttempt.create({
      student: userId,
      category,
      difficulty,
      questions: questions.map((q) => ({
        id: q.id,
        scenario: q.scenario,
        context: q.context,
        options: q.options,
        selectedOptionId: userAnswers[q.id] || '',
      })),
      score: evaluation.score,
      skillScores: evaluation.skillScores,
      aiFeedback: evaluation.aiFeedback,
      completedAt: new Date(),
    });

    // Update Student Profile Activity & Stats
    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      profile = new StudentProfile({ user: userId });
    }

    const now = new Date();
    profile.activities.unshift({
      title: 'Soft Skill Assessment Completed',
      desc: `Scored ${evaluation.score}/100 in ${category} (${difficulty})`,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
    });

    if (profile.activities.length > 15) {
      profile.activities = profile.activities.slice(0, 15);
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        score: evaluation.score,
        skillScores: evaluation.skillScores,
        aiFeedback: evaluation.aiFeedback,
        category,
        difficulty,
      },
    });
  } catch (error) {
    console.error('[Submit Soft Skill Assessment Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate soft skill assessment',
    });
  }
};

// @desc    Get Soft Skill Assessment History
// @route   GET /api/student/assessment/soft-skill/history
// @access  Private (Student)
export const getSoftSkillAssessmentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await SoftSkillAttempt.find({ student: userId })
      .sort({ completedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('[Get Soft Skill Assessment History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch soft skill assessment history',
    });
  }
};

// @desc    Get Published Courses for Student Catalog
// @route   GET /api/student/courses
// @access  Private (Student)
export const getPublishedCoursesForStudent = async (req, res) => {
  try {
    const rawCourses = await Course.find({ status: 'published' })
      .populate('mentorId', 'fullName name email profilePhoto bio title designation professionalTitle company')
      .sort({ createdAt: -1 })
      .lean();

    // Filter out any courses where mentorId is null/undefined or not a valid mentor
    const validCourses = rawCourses.filter((course) => course.mentorId && (course.mentorId._id || course.mentorId.id));

    // Enrich each course with module count and resource counts
    const enrichedCourses = await Promise.all(
      validCourses.map(async (course) => {
        const moduleCount = await CourseModule.countDocuments({ courseId: course._id });
        const pdfCount = await CoursePDFResource.countDocuments({ courseId: course._id });
        const lessonCount = await CourseLesson.countDocuments({ courseId: course._id });
        const textResourceCount = await CourseTextResource.countDocuments({ courseId: course._id });

        const mentorObj = course.mentorId || {};
        const mentorName = mentorObj.fullName || mentorObj.name || 'Mentor';

        return {
          ...course,
          mentorId: {
            ...mentorObj,
            name: mentorName,
          },
          moduleCount,
          lessonCount,
          pdfCount,
          textResourceCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedCourses,
    });
  } catch (error) {
    console.error('[Get Published Courses Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch published courses',
    });
  }
};

// @desc    Get Full Published Course Details for Student (Modules, Lessons, PDF Resources, Text Resources)
// @route   GET /api/student/courses/:courseId
// @access  Private (Student)
export const getStudentCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId)
      .populate('mentorId', 'name email profilePhoto bio title')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'This course is not published yet and is unavailable for students.',
      });
    }

    // Fetch modules sorted by order
    const modules = await CourseModule.find({ courseId }).sort({ order: 1 }).lean();

    // Fetch lessons, PDF resources & Text resources for all modules
    const enrichedModules = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await CourseLesson.find({ courseId, moduleId: mod._id })
          .sort({ order: 1 })
          .lean();

        const pdfResources = await CoursePDFResource.find({ courseId, moduleId: mod._id })
          .select('-fileData') // Exclude heavy raw base64 buffer in metadata JSON
          .sort({ createdAt: -1 })
          .lean();

        const textResources = await CourseTextResource.find({ courseId, moduleId: mod._id })
          .sort({ createdAt: -1 })
          .lean();

        // Fetch published quizzes for module
        const rawQuizzes = await CourseQuiz.find({ courseId, moduleId: mod._id, status: 'published' })
          .sort({ createdAt: -1 })
          .lean();

        // Attach question counts, total marks, and student's latest attempt score
        const quizzes = await Promise.all(
          rawQuizzes.map(async (q) => {
            const questionCount = q.questions?.length || 0;
            const maxScore = q.questions?.reduce((sum, item) => sum + (item.marks || 1), 0) || 0;
            const latestAttempt = await CourseQuizAttempt.findOne({ quizId: q._id, studentId: req.user._id })
              .sort({ completedAt: -1 })
              .lean();

            return {
              _id: q._id,
              courseId: q.courseId,
              moduleId: q.moduleId,
              title: q.title,
              description: q.description,
              questionCount,
              maxScore,
              // Strip correctOptionIndex and explanations from listing (revealed only upon submission or details)
              questions: q.questions.map((item) => ({
                _id: item._id,
                questionText: item.questionText,
                options: item.options,
                marks: item.marks || 1,
              })),
              latestAttempt: latestAttempt
                ? {
                    attemptId: latestAttempt._id,
                    totalScore: latestAttempt.totalScore,
                    maxScore: latestAttempt.maxScore,
                    percentage: latestAttempt.percentage,
                    completedAt: latestAttempt.completedAt,
                  }
                : null,
            };
          })
        );

        return {
          ...mod,
          lessons,
          pdfResources,
          textResources,
          quizzes,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        ...course,
        modules: enrichedModules,
      },
    });
  } catch (error) {
    console.error('[Get Student Course Details Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course details',
    });
  }
};

// @desc    Stream PDF Resource for Student (In-Platform Secure PDF Reading)
// @route   GET /api/student/courses/:courseId/pdf-resources/:resourceId/stream
// @access  Private (Student)
export const streamStudentCoursePDF = async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;

    // Verify course exists & is published
    const course = await Course.findById(courseId);
    if (!course || course.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Course is unavailable.',
      });
    }

    const resource = await CoursePDFResource.findOne({ _id: resourceId, courseId }).select('+fileData');
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'PDF Resource not found',
      });
    }

    // Set secure anti-download headers for in-app inline rendering
    res.setHeader('Content-Type', resource.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resource.originalName || 'document.pdf')}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    // 1. Memory base64 buffer fallback
    if (resource.fileData) {
      const buffer = Buffer.from(resource.fileData, 'base64');
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    }

    // 2. Physical file stream on disk fallback
    if (resource.filePath && fs.existsSync(resource.filePath)) {
      const stat = fs.statSync(resource.filePath);
      res.setHeader('Content-Length', stat.size);
      const readStream = fs.createReadStream(resource.filePath);
      return readStream.pipe(res);
    }

    return res.status(404).json({
      success: false,
      message: 'PDF file content unavailable on server',
    });
  } catch (error) {
    console.error('[Stream Student PDF Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to stream PDF resource',
    });
  }
};

// @desc    Submit Student Quiz Answers, Calculate Score & Return Explanations
// @route   POST /api/student/courses/:courseId/quizzes/:quizId/submit
// @access  Private (Student)
export const submitStudentQuizAttempt = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;
    const studentId = req.user._id;

    // 1. Verify published course & quiz
    const course = await Course.findById(courseId);
    if (!course || course.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Course is unavailable or unpublished',
      });
    }

    const quiz = await CourseQuiz.findOne({ _id: quizId, courseId, status: 'published' });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Published Quiz not found',
      });
    }

    const { userAnswers } = req.body; // Array of { questionIndex: Number, selectedOptionIndex: Number }
    if (!Array.isArray(userAnswers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answers format',
      });
    }

    // 2. Evaluate answers server-side
    let totalScore = 0;
    let maxScore = 0;
    const answerBreakdown = [];
    const detailedFeedback = [];

    quiz.questions.forEach((question, index) => {
      const qMarks = question.marks || 1;
      maxScore += qMarks;

      const userAns = userAnswers.find((a) => Number(a.questionIndex) === index);
      const selectedIndex = userAns !== undefined ? Number(userAns.selectedOptionIndex) : -1;
      const isCorrect = selectedIndex === Number(question.correctOptionIndex);
      const marksObtained = isCorrect ? qMarks : 0;

      if (isCorrect) {
        totalScore += qMarks;
      }

      answerBreakdown.push({
        questionIndex: index,
        selectedOptionIndex: selectedIndex,
        isCorrect,
        marksObtained,
      });

      detailedFeedback.push({
        questionIndex: index,
        questionText: question.questionText,
        options: question.options,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect,
        explanation: question.explanation || 'No explanation provided for this question.',
        marks: qMarks,
        marksObtained,
      });
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // 3. Persist attempt record in MongoDB
    const attempt = await CourseQuizAttempt.create({
      quizId: quiz._id,
      courseId: course._id,
      moduleId: quiz.moduleId,
      studentId,
      answers: answerBreakdown,
      totalScore,
      maxScore,
      percentage,
      completedAt: new Date(),
    });

    // 4. Update student CourseProgress document
    try {
      let progress = await CourseProgress.findOne({ studentId, courseId });
      if (!progress) {
        progress = await CourseProgress.create({ studentId, courseId });
      }
      if (!Array.isArray(progress.completedQuizzes)) {
        progress.completedQuizzes = [];
      }
      if (!progress.completedQuizzes.some((id) => id.toString() === quizId)) {
        progress.completedQuizzes.push(quiz._id);
      }
      progress.lastAccessedAt = new Date();
      await progress.save();
    } catch (progErr) {
      console.error('[Quiz CourseProgress Update Warning]:', progErr);
    }

    // 5. Return detailed score evaluation & mentor explanations
    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        quizTitle: quiz.title,
        quizDescription: quiz.description,
        totalScore,
        maxScore,
        percentage,
        passed: percentage >= 50,
        detailedFeedback,
        completedAt: attempt.completedAt,
      },
    });
  } catch (error) {
    console.error('[Submit Student Quiz Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate quiz submission',
    });
  }
};

// @desc    Get Student Past Quiz Attempts
// @route   GET /api/student/courses/:courseId/quizzes/:quizId/attempts
// @access  Private (Student)
export const getStudentQuizAttempts = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;
    const studentId = req.user._id;

    const attempts = await CourseQuizAttempt.find({ quizId, courseId, studentId })
      .sort({ completedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    console.error('[Get Student Quiz Attempts Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz attempt history',
    });
  }
};

// ================= STUDENT COURSE LEARNING & PROGRESS CONTROLLERS =================

// Helper to compute overall progress statistics
const calculateCourseProgressStats = (courseData, progressDoc) => {
  let totalTrackedItems = 0;
  let completedItemsCount = 0;

  let totalLessonsCount = 0;
  let completedLessonsCount = 0;

  let totalPDFsCount = 0;
  let completedPDFsCount = 0;

  let totalResourcesCount = 0;
  let completedResourcesCount = 0;

  let totalAssignmentsCount = 0;
  let completedAssignmentsCount = 0;

  let totalQuizzesCount = 0;
  let completedQuizzesCount = 0;

  const quizScoresList = [];

  const completedLessonSet = new Set((progressDoc?.completedLessons || []).map((id) => id.toString()));
  const completedPDFSet = new Set((progressDoc?.completedPDFs || []).map((id) => id.toString()));
  const completedResourceSet = new Set((progressDoc?.completedResources || []).map((id) => id.toString()));
  const completedAssignmentMap = new Map(
    (progressDoc?.completedAssignments || []).map((a) => [a.resourceId?.toString(), a])
  );

  const moduleStatsMap = {};
  let completedModulesCount = 0;
  let totalModulesCount = 0;

  if (courseData.modules && Array.isArray(courseData.modules)) {
    totalModulesCount = courseData.modules.length;

    courseData.modules.forEach((mod) => {
      let modTotalItems = 0;
      let modCompletedItems = 0;
      let modLessonsTotal = 0;
      let modLessonsCompleted = 0;

      // 1. Lessons
      if (mod.lessons && Array.isArray(mod.lessons)) {
        mod.lessons.forEach((les) => {
          totalTrackedItems++;
          totalLessonsCount++;
          modTotalItems++;
          modLessonsTotal++;
          if (completedLessonSet.has(les._id.toString())) {
            completedItemsCount++;
            completedLessonsCount++;
            modCompletedItems++;
            modLessonsCompleted++;
          }
        });
      }

      // 2. PDFs
      if (mod.pdfResources && Array.isArray(mod.pdfResources)) {
        mod.pdfResources.forEach((pdf) => {
          totalTrackedItems++;
          totalPDFsCount++;
          modTotalItems++;
          if (completedPDFSet.has(pdf._id.toString())) {
            completedItemsCount++;
            completedPDFsCount++;
            modCompletedItems++;
          }
        });
      }

      // 3. Text Resources & Assignments
      if (mod.textResources && Array.isArray(mod.textResources)) {
        mod.textResources.forEach((res) => {
          totalTrackedItems++;
          modTotalItems++;
          if (res.type === 'assignment') {
            totalAssignmentsCount++;
            if (completedAssignmentMap.has(res._id.toString())) {
              completedItemsCount++;
              completedAssignmentsCount++;
              modCompletedItems++;
            }
          } else {
            totalResourcesCount++;
            if (completedResourceSet.has(res._id.toString())) {
              completedItemsCount++;
              completedResourcesCount++;
              modCompletedItems++;
            }
          }
        });
      }

      // 4. Quizzes
      if (mod.quizzes && Array.isArray(mod.quizzes)) {
        mod.quizzes.forEach((quiz) => {
          totalTrackedItems++;
          totalQuizzesCount++;
          modTotalItems++;

          if (quiz.latestAttempt) {
            const pct = quiz.latestAttempt.percentage || 0;
            quizScoresList.push(pct);
            if (pct >= 50) {
              completedItemsCount++;
              completedQuizzesCount++;
              modCompletedItems++;
            }
          }
        });
      }

      // Determine Module Status: 'completed' (✓) | 'in_progress' (◐) | 'not_started' (○)
      let modStatus = 'not_started';
      if (modTotalItems > 0 && modCompletedItems === modTotalItems) {
        modStatus = 'completed';
        completedModulesCount++;
      } else if (modCompletedItems > 0) {
        modStatus = 'in_progress';
      }

      const modPercentage = modTotalItems > 0 ? Math.round((modCompletedItems / modTotalItems) * 100) : 0;

      moduleStatsMap[mod._id.toString()] = {
        moduleId: mod._id,
        title: mod.title,
        status: modStatus,
        completedItems: modCompletedItems,
        totalItems: modTotalItems,
        lessonsCompleted: modLessonsCompleted,
        lessonsTotal: modLessonsTotal,
        percentage: modPercentage,
      };
    });
  }

  // Calculate Average Quiz Score Across Attempted Quizzes
  const avgQuizScore = quizScoresList.length > 0
    ? Math.round(quizScoresList.reduce((sum, score) => sum + score, 0) / quizScoresList.length)
    : 0;

  const percentage = totalTrackedItems > 0 ? Math.round((completedItemsCount / totalTrackedItems) * 100) : 0;

  return {
    totalTrackedItems,
    completedItemsCount,
    percentage,
    // Lessons Detailed Stats
    totalLessonsCount,
    completedLessonsCount,
    lessonsSummary: `${completedLessonsCount} / ${totalLessonsCount}`,
    // Quiz Detailed Stats
    totalQuizzesCount,
    completedQuizzesCount,
    averageQuizScore: avgQuizScore,
    quizScoreSummary: `${avgQuizScore}%`,
    // Assignment Detailed Stats
    totalAssignmentsCount,
    completedAssignmentsCount,
    // Module Detailed Breakdown
    totalModulesCount,
    completedModulesCount,
    modulesSummary: `${completedModulesCount} / ${totalModulesCount}`,
    moduleStatsMap,
  };
};

// @desc    Get complete course curriculum and student progress for Student Learning view
// @route   GET /api/student/courses/:courseId/learning
// @access  Private (Student)
export const getStudentCourseLearningData = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId)
      .populate('mentorId', 'fullName name email profilePhoto bio title designation professionalTitle company')
      .lean();

    if (course && course.mentorId) {
      course.mentorId.name = course.mentorId.name || course.mentorId.fullName || 'Mentor';
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'This course is currently in draft mode and unavailable for students.',
      });
    }

    // Ensure student is enrolled in course_enrollments collection
    let enrollment = await CourseEnrollment.findOne({ studentId, courseId });
    if (!enrollment) {
      const isPaid = course.isPaid || course.priceType === 'Paid' || (course.price || 0) > 0;
      if (isPaid) {
        return res.status(403).json({
          success: false,
          message: 'Payment required. Please complete course enrollment to access learning materials.',
        });
      }

      enrollment = await CourseEnrollment.create({
        studentId,
        courseId,
        enrolledAt: new Date(),
        status: 'active',
        lastAccessedAt: new Date(),
      });
    } else {
      enrollment.lastAccessedAt = new Date();
      await enrollment.save();
    }

    // Get or create Student CourseProgress document
    let progress = await CourseProgress.findOne({ studentId, courseId });
    if (!progress) {
      progress = await CourseProgress.create({
        studentId,
        courseId,
        completedLessons: [],
        completedPDFs: [],
        completedResources: [],
        completedAssignments: [],
        lastAccessedAt: new Date(),
      });
    } else {
      progress.lastAccessedAt = new Date();
      await progress.save();
    }

    // Populate modules and items
    const modules = await CourseModule.find({ courseId }).sort({ order: 1 }).lean();

    const enrichedModules = await Promise.all(
      modules.map(async (modItem) => {
        const lessons = await CourseLesson.find({ courseId, moduleId: modItem._id }).sort({ order: 1 }).lean();
        const pdfResources = await CoursePDFResource.find({ courseId, moduleId: modItem._id }).sort({ createdAt: -1 }).lean();
        const textResources = await CourseTextResource.find({ courseId, moduleId: modItem._id }).sort({ createdAt: -1 }).lean();

        // Fetch published quizzes and include student's latest attempt score
        const quizzes = await CourseQuiz.find({ courseId, moduleId: modItem._id, status: 'published' })
          .select('-questions.correctOptionIndex -questions.explanation')
          .sort({ createdAt: -1 })
          .lean();

        const quizzesWithAttempts = await Promise.all(
          quizzes.map(async (q) => {
            const latestAttempt = await CourseQuizAttempt.findOne({ quizId: q._id, studentId })
              .sort({ completedAt: -1 })
              .select('score totalScore maxScore percentage completedAt')
              .lean();
            return {
              ...q,
              latestAttempt: latestAttempt || null,
            };
          })
        );

        return {
          ...modItem,
          lessons,
          pdfResources,
          textResources,
          quizzes: quizzesWithAttempts,
        };
      })
    );

    const fullCourseData = {
      ...course,
      modules: enrichedModules,
    };

    const stats = calculateCourseProgressStats(fullCourseData, progress);

    return res.status(200).json({
      success: true,
      data: {
        course: fullCourseData,
        progress,
        stats,
      },
    });
  } catch (error) {
    console.error('[Get Student Learning Data Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load course learning experience',
    });
  }
};

// @desc    Toggle completion of a lesson, PDF, or text resource for a student
// @route   POST /api/student/courses/:courseId/progress/toggle-item
// @access  Private (Student)
export const toggleStudentItemProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { itemId, itemType } = req.body; // itemType: 'lesson' | 'pdf' | 'resource'
    const studentId = req.user._id;

    if (!itemId || !itemType) {
      return res.status(400).json({
        success: false,
        message: 'itemId and itemType are required',
      });
    }

    let progress = await CourseProgress.findOne({ studentId, courseId });
    if (!progress) {
      progress = await CourseProgress.create({ studentId, courseId });
    }

    const itemObjId = new mongoose.Types.ObjectId(itemId);

    if (itemType === 'lesson') {
      const idx = progress.completedLessons.findIndex((id) => id.toString() === itemId);
      if (idx >= 0) {
        progress.completedLessons.splice(idx, 1);
      } else {
        progress.completedLessons.push(itemObjId);
      }
    } else if (itemType === 'pdf') {
      const idx = progress.completedPDFs.findIndex((id) => id.toString() === itemId);
      if (idx >= 0) {
        progress.completedPDFs.splice(idx, 1);
      } else {
        progress.completedPDFs.push(itemObjId);
      }
    } else if (itemType === 'resource') {
      const idx = progress.completedResources.findIndex((id) => id.toString() === itemId);
      if (idx >= 0) {
        progress.completedResources.splice(idx, 1);
      } else {
        progress.completedResources.push(itemObjId);
      }
    }

    progress.lastAccessedAt = new Date();
    await progress.save();

    return res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: { progress },
    });
  } catch (error) {
    console.error('[Toggle Student Item Progress Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update progress item',
    });
  }
};

// @desc    Submit student text assignment response
// @route   POST /api/student/courses/:courseId/assignments/:resourceId/submit
// @access  Private (Student)
export const submitStudentAssignment = async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;
    const { submissionText, submissionUrl } = req.body;
    const studentId = req.user._id;

    const resource = await CourseTextResource.findOne({ _id: resourceId, courseId, type: 'assignment' });
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Assignment resource not found',
      });
    }

    let progress = await CourseProgress.findOne({ studentId, courseId });
    if (!progress) {
      progress = await CourseProgress.create({ studentId, courseId });
    }

    const existingIdx = progress.completedAssignments.findIndex(
      (a) => a.resourceId?.toString() === resourceId
    );

    const submissionEntry = {
      resourceId,
      submissionText: (submissionText || '').trim(),
      submissionUrl: (submissionUrl || '').trim(),
      completedAt: new Date(),
    };

    if (existingIdx >= 0) {
      progress.completedAssignments[existingIdx] = submissionEntry;
    } else {
      progress.completedAssignments.push(submissionEntry);
    }

    progress.lastAccessedAt = new Date();
    await progress.save();

    return res.status(200).json({
      success: true,
      message: 'Assignment response submitted successfully!',
      data: {
        progress,
        submission: submissionEntry,
      },
    });
  } catch (error) {
    console.error('[Submit Student Assignment Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit assignment response',
    });
  }
};

// @desc    Create Razorpay Order for a paid course
// @route   POST /api/student/courses/:courseId/create-order
// @access  Private (Student)
export const createRazorpayOrder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // 1. Fetch course from MongoDB
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Only published courses can be enrolled in.',
      });
    }

    // 2. Check duplicate enrollment
    const existingEnrollment = await CourseEnrollment.findOne({ studentId, courseId });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        alreadyEnrolled: true,
        message: 'You are already enrolled in this course.',
      });
    }

    // 3. Check if course is free
    const isPaid = course.isPaid || course.priceType === 'Paid' || course.price > 0;
    if (!isPaid || course.price <= 0) {
      return res.status(200).json({
        success: true,
        isFree: true,
        message: 'This course is free. You can enroll directly.',
      });
    }

    // 4. Create Razorpay order using actual course price from MongoDB
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay API credentials not configured on server.',
      });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const amountInPaise = Math.round(course.price * 100);
    const receiptId = `rcpt_${studentId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        courseId: courseId.toString(),
        studentId: studentId.toString(),
        courseTitle: course.title,
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id,
      courseTitle: course.title,
      price: course.price,
    });
  } catch (error) {
    console.error('[Create Razorpay Order Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order.',
    });
  }
};

// @desc    Verify Razorpay payment signature & create student enrollment
// @route   POST /api/student/courses/:courseId/verify-payment
// @access  Private (Student)
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay payment verification parameters.',
      });
    }

    // 1. Fetch course from MongoDB
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // 2. Verify Razorpay Signature server-side using RAZORPAY_KEY_SECRET
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret key not configured on server.',
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.warn(`[Payment Verification Failed]: Signature mismatch for student ${studentId}, order ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid payment signature.',
      });
    }

    // 3. Signature is valid -> Create/Update record in 'payments' collection
    let paymentRecord = await Payment.findOne({ paymentId: razorpay_payment_id });
    if (!paymentRecord) {
      paymentRecord = await Payment.create({
        studentId,
        courseId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount: course.price,
        currency: 'INR',
        paymentStatus: 'paid',
        paidAt: new Date(),
      });
    }

    // 4. Check for existing enrollment to prevent duplicate
    let enrollment = await CourseEnrollment.findOne({ studentId, courseId });
    if (enrollment) {
      enrollment.lastAccessedAt = new Date();
      enrollment.paymentRef = paymentRecord._id;
      enrollment.paymentId = razorpay_payment_id;
      await enrollment.save();

      return res.status(200).json({
        success: true,
        message: 'Payment verified. You are already enrolled in this course.',
        data: { enrollment, payment: paymentRecord, isNew: false },
      });
    }

    // 5. Create new CourseEnrollment referencing the Payment document
    enrollment = await CourseEnrollment.create({
      studentId,
      courseId,
      paymentRef: paymentRecord._id,
      paymentId: razorpay_payment_id,
      enrolledAt: new Date(),
      status: 'active',
      lastAccessedAt: new Date(),
    });

    // 6. Initialize CourseProgress
    let progress = await CourseProgress.findOne({ studentId, courseId });
    if (!progress) {
      await CourseProgress.create({
        studentId,
        courseId,
        completedLessons: [],
        completedPDFs: [],
        completedResources: [],
        completedAssignments: [],
        lastAccessedAt: new Date(),
      });
    }

    console.log(`[Payment Recorded & Course Enrolled]: Payment ID ${razorpay_payment_id} stored in 'payments' collection; Student ${studentId} enrolled in course ${courseId}`);

    return res.status(200).json({
      success: true,
      message: 'Payment verified and saved! Course unlocked.',
      data: { enrollment, payment: paymentRecord, isNew: true },
    });
  } catch (error) {
    console.error('[Verify Razorpay Payment Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed.',
    });
  }
};

// @desc    Enroll authenticated student in a published (free) course
// @route   POST /api/student/courses/:courseId/enroll
// @access  Private (Student)
export const enrollStudentInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // 1. Verify published course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Only published courses can be enrolled in.',
      });
    }

    // Check if course is paid
    const isPaid = course.isPaid || course.priceType === 'Paid' || course.price > 0;
    if (isPaid && course.price > 0) {
      return res.status(400).json({
        success: false,
        message: 'This is a paid course. Please complete payment to enroll.',
      });
    }

    // 2. Check for duplicate enrollment using compound unique constraint / findOne
    let enrollment = await CourseEnrollment.findOne({ studentId, courseId });
    if (enrollment) {
      enrollment.lastAccessedAt = new Date();
      await enrollment.save();

      return res.status(200).json({
        success: true,
        message: 'Student is already enrolled in this course.',
        data: { enrollment, isNew: false },
      });
    }

    // 3. Create new CourseEnrollment record for free course
    enrollment = await CourseEnrollment.create({
      studentId,
      courseId,
      paymentRef: null,
      paymentId: '',
      enrolledAt: new Date(),
      status: 'active',
      lastAccessedAt: new Date(),
    });

    // 4. Ensure Student CourseProgress document exists
    let progress = await CourseProgress.findOne({ studentId, courseId });
    if (!progress) {
      await CourseProgress.create({
        studentId,
        courseId,
        completedLessons: [],
        completedPDFs: [],
        completedResources: [],
        completedAssignments: [],
        lastAccessedAt: new Date(),
      });
    }

    console.log(`[CourseEnrollment]: Student ${studentId} successfully enrolled in free course ${courseId}`);

    return res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course!',
      data: { enrollment, isNew: true },
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await CourseEnrollment.findOne({ studentId: req.user._id, courseId: req.params.courseId });
      return res.status(200).json({
        success: true,
        message: 'Already enrolled in this course.',
        data: { enrollment: existing, isNew: false },
      });
    }

    console.error('[Enroll Student Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
    });
  }
};

// @desc    Get all active course enrollments for authenticated student
// @route   GET /api/student/enrollments
// @access  Private (Student)
export const getStudentEnrollments = async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrollments = await CourseEnrollment.find({ studentId })
      .populate({
        path: 'courseId',
        populate: { path: 'mentorId', select: 'fullName name email profilePhoto title designation' },
      })
      .populate('paymentRef')
      .sort({ lastAccessedAt: -1 })
      .lean();

    // Attach progress statistics and payment information for each enrolled course
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enr) => {
        if (!enr.courseId) return null;
        const targetCourseId = enr.courseId._id;
        const progress = await CourseProgress.findOne({ studentId, courseId: targetCourseId }).lean();
        
        const modules = await CourseModule.find({ courseId: targetCourseId }).sort({ order: 1 }).lean();

        const enrichedModules = await Promise.all(
          modules.map(async (modItem) => {
            const lessons = await CourseLesson.find({ courseId: targetCourseId, moduleId: modItem._id }).sort({ order: 1 }).lean();
            const pdfResources = await CoursePDFResource.find({ courseId: targetCourseId, moduleId: modItem._id }).sort({ createdAt: -1 }).lean();
            const textResources = await CourseTextResource.find({ courseId: targetCourseId, moduleId: modItem._id }).sort({ createdAt: -1 }).lean();

            const quizzes = await CourseQuiz.find({ courseId: targetCourseId, moduleId: modItem._id, status: 'published' })
              .select('-questions.correctOptionIndex -questions.explanation')
              .sort({ createdAt: -1 })
              .lean();

            const quizzesWithAttempts = await Promise.all(
              quizzes.map(async (q) => {
                const latestAttempt = await CourseQuizAttempt.findOne({ quizId: q._id, studentId })
                  .sort({ completedAt: -1 })
                  .select('score totalScore maxScore percentage completedAt')
                  .lean();
                return {
                  ...q,
                  latestAttempt: latestAttempt || null,
                };
              })
            );

            return {
              ...modItem,
              lessons,
              pdfResources,
              textResources,
              quizzes: quizzesWithAttempts,
            };
          })
        );

        const fullCourseData = { ...enr.courseId, modules: enrichedModules };
        const stats = calculateCourseProgressStats(fullCourseData, progress);
        const isCoursePaid = enr.courseId.isPaid || enr.courseId.priceType === 'Paid' || enr.courseId.price > 0;
        const paymentDetails = enr.paymentRef || null;

        return {
          ...enr,
          paymentStatus: paymentDetails ? paymentDetails.paymentStatus || 'paid' : (enr.paymentId ? 'paid' : (isCoursePaid ? 'paid' : 'free')),
          amount: paymentDetails ? paymentDetails.amount : (isCoursePaid ? enr.courseId.price : 0),
          paymentDetails: paymentDetails,
          progressStats: stats,
          progressPercentage: stats.percentage || 0,
        };
      })
    );

    const validEnrollments = enrichedEnrollments.filter((e) => e !== null);

    return res.status(200).json({
      success: true,
      data: validEnrollments,
    });
  } catch (error) {
    console.error('[Get Student Enrollments Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course enrollments',
    });
  }
};

// @desc    Check enrollment status for specific course
// @route   GET /api/student/courses/:courseId/enrollment-status
// @access  Private (Student)
export const getCourseEnrollmentStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const enrollment = await CourseEnrollment.findOne({ studentId, courseId }).lean();

    return res.status(200).json({
      success: true,
      data: {
        isEnrolled: !!enrollment,
        enrollment: enrollment || null,
      },
    });
  } catch (error) {
    console.error('[Get Enrollment Status Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check enrollment status',
    });
  }
};

// @desc    Get all messages sent to authenticated student by mentors
// @desc    Get all messages sent to authenticated student by mentors
// @route   GET /api/student/messages
// @access  Private (Student)
export const getStudentMessages = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Find all messages where student is recipient OR sender (replies)
    const messages = await Message.find({
      $or: [{ recipientId: studentId }, { senderId: studentId }],
    })
      .populate('courseId', 'title category thumbnail difficulty duration mentorId')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich messages with mentor details and sender/recipient details
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        let mentorDoc = null;

        // Try resolving mentor from senderId, recipientId, or course mentorId
        const candidateMentorIds = [
          msg.senderModel === 'Mentor' ? msg.senderId : null,
          msg.recipientModel === 'Mentor' ? msg.recipientId : null,
          msg.senderId,
          msg.recipientId,
          msg.courseId?.mentorId,
        ].filter(Boolean);

        for (const mId of candidateMentorIds) {
          mentorDoc = await Mentor.findById(mId)
            .select('fullName professionalTitle designation company profilePhoto email')
            .lean();
          if (mentorDoc) break;
        }

        // Fallback: check Mentor by User reference or email
        if (!mentorDoc) {
          const userDoc = await User.findById(msg.senderId).select('email').lean();
          if (userDoc?.email) {
            mentorDoc = await Mentor.findOne({ email: userDoc.email.toLowerCase() })
              .select('fullName professionalTitle designation company profilePhoto email')
              .lean();
          }
        }

        const mentorInfo = mentorDoc
          ? {
              _id: mentorDoc._id,
              name: mentorDoc.fullName || 'Course Mentor',
              title: mentorDoc.professionalTitle || mentorDoc.designation || 'Course Mentor',
              company: mentorDoc.company || '',
              profilePhoto: mentorDoc.profilePhoto || '',
              email: mentorDoc.email,
            }
          : {
              name: 'Course Mentor',
              title: 'Course Mentor',
              company: '',
              profilePhoto: '',
            };

        // Resolve sender user if student reply
        let senderUser = null;
        if (msg.messageType === 'student_reply') {
          senderUser = await User.findById(msg.senderId).select('fullName name email profilePhoto avatar').lean();
        }

        return {
          ...msg,
          mentorInfo,
          senderUser: senderUser
            ? {
                name: senderUser.fullName || senderUser.name || 'You',
                email: senderUser.email,
                profilePhoto: senderUser.profilePhoto || senderUser.avatar || '',
              }
            : null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedMessages,
    });
  } catch (error) {
    console.error('[Get Student Messages Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve mentor messages',
    });
  }
};

// @desc    Mark mentor message as read by student
// @route   PUT /api/student/messages/:messageId/read
// @access  Private (Student)
export const markStudentMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const studentId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      recipientId: studentId,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or unauthorized',
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    // Also mark corresponding notification as read if present
    await Notification.updateMany(
      { userId: studentId, relatedMessageId: messageId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message,
    });
  } catch (error) {
    console.error('[Mark Message Read Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
    });
  }
};

// @desc    Reply to mentor message
// @route   POST /api/student/messages/:messageId/reply
// @access  Private (Student)
export const replyToMentorMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { body } = req.body;
    const studentId = req.user._id;

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply message body cannot be empty',
      });
    }

    // Verify parent message exists and belongs to this student
    const parentMessage = await Message.findOne({
      _id: messageId,
      $or: [{ recipientId: studentId }, { senderId: studentId }],
    }).populate('courseId', 'title mentorId');

    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message thread not found or unauthorized',
      });
    }

    // Determine recipient (the mentor who sent the parent message or course owner)
    let recipientId =
      parentMessage.senderId.toString() === studentId.toString()
        ? parentMessage.recipientId
        : parentMessage.senderId;

    if (!recipientId && parentMessage.courseId?.mentorId) {
      recipientId = parentMessage.courseId.mentorId;
    }

    // Root thread ID to keep entire conversation thread grouped
    const rootThreadId = parentMessage.parentMessageId || parentMessage._id;

    const replyMessage = await Message.create({
      senderId: studentId,
      senderModel: 'User',
      recipientId: recipientId,
      recipientModel: 'Mentor',
      courseId: parentMessage.courseId?._id || parentMessage.courseId,
      subject: parentMessage.subject.startsWith('Re:')
        ? parentMessage.subject
        : `Re: ${parentMessage.subject}`,
      body: body.trim(),
      messageType: 'student_reply',
      parentMessageId: rootThreadId,
      isRead: false,
    });

    // Notify mentor in MongoDB
    const studentName = req.user.fullName || req.user.name || 'Student';
    const courseTitle = parentMessage.courseId?.title || 'your course';

    await Notification.create({
      userId: recipientId,
      userModel: 'Mentor',
      senderId: studentId,
      senderModel: 'User',
      title: `Reply from ${studentName}: ${parentMessage.subject}`,
      message: `${studentName} replied regarding "${courseTitle}": "${body.trim().substring(0, 120)}${body.trim().length > 120 ? '...' : ''}"`,
      type: 'mentor_reply',
      link: '/mentor/dashboard',
      relatedCourseId: parentMessage.courseId?._id || parentMessage.courseId,
      relatedMessageId: replyMessage._id,
      isRead: false,
    });

    // Resolve mentor details for enriched reply payload
    let mentorDoc = await Mentor.findById(recipientId)
      .select('fullName professionalTitle designation company profilePhoto email')
      .lean();

    const mentorInfo = mentorDoc
      ? {
          _id: mentorDoc._id,
          name: mentorDoc.fullName || 'Course Mentor',
          title: mentorDoc.professionalTitle || mentorDoc.designation || 'Course Mentor',
          company: mentorDoc.company || '',
          profilePhoto: mentorDoc.profilePhoto || '',
          email: mentorDoc.email,
        }
      : {
          name: 'Course Mentor',
          title: 'Course Mentor',
          company: '',
          profilePhoto: '',
        };

    const replyPayload = {
      ...replyMessage.toObject(),
      mentorInfo,
      senderUser: {
        name: studentName,
        email: req.user.email,
        profilePhoto: req.user.profilePhoto || req.user.avatar || '',
      },
    };

    return res.status(201).json({
      success: true,
      message: 'Reply sent to mentor successfully',
      data: replyPayload,
    });
  } catch (error) {
    console.error('[Reply to Message Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send reply to mentor',
    });
  }
};

// @desc    Get student notifications
// @route   GET /api/student/notifications
// @access  Private (Student)
export const getStudentNotifications = async (req, res) => {
  try {
    const studentId = req.user._id;

    const notifications = await Notification.find({ userId: studentId })
      .populate('senderId', 'fullName name email profilePhoto avatar')
      .populate('relatedCourseId', 'title category thumbnail')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('[Get Student Notifications Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
    });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/student/notifications/:id/read
// @access  Private (Student)
export const markStudentNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: studentId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('[Mark Notification Read Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification',
    });
  }
};

// @desc    Mark all notifications as read for student
// @route   PUT /api/student/notifications/read-all
// @access  Private (Student)
export const markAllStudentNotificationsAsRead = async (req, res) => {
  try {
    const studentId = req.user._id;

    await Notification.updateMany(
      { userId: studentId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('[Mark All Notifications Read Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
};

// @desc    Get unread counts for messages and notifications
// @route   GET /api/student/unread-count
// @access  Private (Student)
export const getStudentUnreadCount = async (req, res) => {
  try {
    const studentId = req.user._id;

    const [unreadMessages, unreadNotifications] = await Promise.all([
      Message.countDocuments({ recipientId: studentId, isRead: false }),
      Notification.countDocuments({ userId: studentId, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        unreadMessages,
        unreadNotifications,
        totalUnread: unreadMessages + unreadNotifications,
      },
    });
  } catch (error) {
    console.error('[Get Unread Count Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread counts',
    });
  }
};




