import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { extractTextFromBuffer, analyzeResumeContent, validateIsResume } from '../services/aiService.js';

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
      await profile.save().catch(() => {});
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
    if (phone && phone.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number (7 to 15 digits)',
        });
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
          await profile.save().catch(() => {});
        }
      }
    }

    // Dynamic profile completion
    const profileCompletion = calculateProfileCompletion(profile);
    if (profile && profile.profileCompletion !== profileCompletion) {
      profile.profileCompletion = profileCompletion;
      await profile.save().catch(() => {});
    }

    const allSkills = profile ? [
      ...(profile.technicalSkills || []),
      ...(profile.softSkills || []),
    ] : [];

    const resumeScoreDisplay = (profile && profile.resumeScore !== null && profile.resumeScore !== undefined) ? `${profile.resumeScore}` : '0';
    const resumeStatus = (profile && profile.resumeScore !== null && profile.resumeScore !== undefined) ? `Score: ${profile.resumeScore}/100` : 'Resume Not Uploaded';

    const assessmentScoreDisplay = (profile && profile.assessmentScore !== null && profile.assessmentScore !== undefined) ? `${profile.assessmentScore}%` : '0%';
    const assessmentStatus = (profile && profile.assessmentScore !== null && profile.assessmentScore !== undefined) ? `${profile.assessmentsCompleted || 0} assessments completed` : 'Assessment Not Attempted';

    const careerMatchDisplay = (profile && profile.careerMatch !== null && profile.careerMatch !== undefined) ? `${profile.careerMatch}%` : 'Not Available';
    const careerMatchTitle = (profile && profile.careerMatchTitle && profile.careerMatchTitle.trim()) ? profile.careerMatchTitle : 'No career recommendation yet';
    const careerMatchStatus = (profile && profile.careerMatch !== null && profile.careerMatch !== undefined) ? `Match Score: ${profile.careerMatch}%` : 'Not Available';

    const learningProgressValue = profile ? (profile.learningProgress || 0) : 0;
    const learningProgressDisplay = `${learningProgressValue}%`;
    const learningProgressStatus = learningProgressValue > 0 ? `${profile.completedModules || 0} of ${profile.totalModules || 0} modules completed` : 'No Learning Progress Yet';

    const projectsCompleted = profile ? (profile.projectsCompleted || 0) : 0;
    const skillsCompleted = allSkills.length;
    const targetSkillsCount = profile ? (profile.targetSkillsCount || (allSkills.length > 0 ? Math.max(allSkills.length, 10) : 0)) : 0;
    const skillsDisplay = `${skillsCompleted} / ${targetSkillsCount}`;

    return res.status(200).json({
      success: true,
      data: {
        profileCompletion,
        resumeScore: resumeScoreDisplay,
        resumeStatus,
        hasUploadedResume: Boolean(profile && profile.resumeScore !== null && profile.resumeScore !== undefined),
        assessmentScore: assessmentScoreDisplay,
        assessmentStatus,
        hasCompletedAssessment: Boolean(profile && profile.assessmentScore !== null && profile.assessmentScore !== undefined),
        careerMatch: careerMatchDisplay,
        careerMatchTitle,
        careerMatchStatus,
        hasCareerMatch: Boolean(profile && profile.careerMatch !== null && profile.careerMatch !== undefined),
        careerMatchSkills: allSkills.length > 0 ? allSkills.slice(0, 4) : [],
        learningProgress: learningProgressDisplay,
        learningProgressValue,
        learningProgressStatus,
        projectsCompleted,
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
        careerMatch: 'Not Available',
        careerMatchTitle: 'No career recommendation yet',
        careerMatchStatus: 'Not Available',
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

    if (!profile || !profile.resumeAnalysis || !profile.resumeAnalysis.analyzedAt) {
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
        analysis: profile.resumeAnalysis,
        resumeScore: profile.resumeScore,
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

    const filter = { status: 'Active' };

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
    const appliedJobIds = new Set(studentApplications.map((app) => app.job.toString()));

    const formattedJobs = jobs.map((job) => {
      const isApplied = appliedJobIds.has(job._id.toString());
      return {
        ...job.toObject(),
        hasApplied: isApplied,
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
    const { jobId, coverNote } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job ID is required.' });
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'Active') {
      return res.status(404).json({ success: false, message: 'Job position not found or no longer active.' });
    }

    // Check if student already applied
    const existingApp = await Application.findOne({ job: jobId, student: userId });
    if (existingApp) {
      return res.status(400).json({ success: false, message: 'You have already applied to this job position.' });
    }

    const studentProfile = await StudentProfile.findOne({ user: userId });

    const application = await Application.create({
      job: jobId,
      student: userId,
      studentProfile: studentProfile ? studentProfile._id : null,
      recruiter: job.recruiter,
      status: 'New',
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

