import User from '../models/User.js';
import Recruiter from '../models/Recruiter.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import StudentProfile from '../models/StudentProfile.js';
import { extractTextFromBuffer } from '../services/aiService.js';

/**
 * Get recruiter dashboard statistics (real counts from MongoDB)
 */
export const getRecruiterStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const activeJobs = await Job.countDocuments({ recruiter: userId, status: 'Active' });
    const totalJobs = await Job.countDocuments({ recruiter: userId });
    const totalApplications = await Application.countDocuments({ recruiter: userId });
    const shortlistedCandidates = await Application.countDocuments({ recruiter: userId, status: 'Shortlisted' });
    const interviews = await Application.countDocuments({ recruiter: userId, status: 'Interview' });

    return res.status(200).json({
      success: true,
      data: {
        activeJobs,
        totalJobs,
        totalApplications,
        shortlistedCandidates,
        interviews,
      },
    });
  } catch (error) {
    console.error('Error fetching recruiter stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * Get recruiter profile
 */
export const getRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await Recruiter.findOne({ $or: [{ _id: userId }, { user: userId }] });
    const userFullName = req.user.fullName || req.user.name || req.user.username || '';
    const userEmail = req.user.email || '';

    if (!profile) {
      profile = await Recruiter.create({
        _id: userId,
        fullName: userFullName,
        email: userEmail,
        companyName: '',
        industry: '',
        designation: '',
      });
    } else {
      let updated = false;
      if (!profile.fullName && userFullName) {
        profile.fullName = userFullName;
        updated = true;
      }
      if (!profile.email && userEmail) {
        profile.email = userEmail;
        updated = true;
      }
      if (updated) {
        await profile.save();
      }
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching recruiter profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter profile',
    });
  }
};

/**
 * Update recruiter profile
 */
export const updateRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    let profile = await Recruiter.findOne({ $or: [{ _id: userId }, { user: userId }] });
    if (!profile) {
      profile = new Recruiter({ _id: userId, email: req.user.email });
    }

    // Update profile fields
    if (updateData.fullName !== undefined) profile.fullName = updateData.fullName;
    if (updateData.profilePhoto !== undefined) profile.profilePhoto = updateData.profilePhoto;
    if (updateData.companyName !== undefined) profile.companyName = updateData.companyName;
    if (updateData.companyWebsite !== undefined) profile.companyWebsite = updateData.companyWebsite;
    if (updateData.industry !== undefined) profile.industry = updateData.industry;
    if (updateData.phone !== undefined) profile.phone = updateData.phone;
    if (updateData.location !== undefined) profile.location = updateData.location;
    if (updateData.designation !== undefined) profile.designation = updateData.designation;
    if (updateData.companyDescription !== undefined) profile.companyDescription = updateData.companyDescription;

    await profile.save();

    // Also update User full name if exists
    if (updateData.fullName) {
      await User.findByIdAndUpdate(userId, { fullName: updateData.fullName }).catch(() => { });
    }

    return res.status(200).json({
      success: true,
      message: 'Recruiter profile updated successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Error updating recruiter profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update recruiter profile',
    });
  }
};

/**
 * Post a new Job
 */
export const createJob = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      companyName,
      location,
      employmentType,
      description,
      experienceRequired,
      salaryRange,
      education,
      requiredSkills,
      preferredSkills,
      jdFileName,
      jdFileBase64,
      jdMimeType,
      deadline,
      status,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in required fields: Job Title and Job Description.',
      });
    }

    // Fetch company name from profile if not provided
    let finalCompany = companyName;
    if (!finalCompany) {
      const recProfile = await Recruiter.findOne({ $or: [{ _id: userId }, { user: userId }] });
      finalCompany = recProfile?.companyName || 'CareerPilot Hiring Partner';
    }

    const job = await Job.create({
      recruiter: userId,
      companyName: finalCompany,
      title,
      location: location || 'Remote / Hybrid',
      employmentType: employmentType || 'Full-time',
      description,
      experienceRequired: experienceRequired || '',
      salaryRange: salaryRange || '',
      education: education || '',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
      jdFileName: jdFileName || '',
      jdFileBase64: jdFileBase64 || '',
      jdMimeType: jdMimeType || 'application/pdf',
      deadline: deadline ? new Date(deadline) : null,
      status: status || 'Active',
    });

    return res.status(201).json({
      success: true,
      message: 'Job posted successfully!',
      data: job,
    });
  } catch (error) {
    console.error('Error posting job:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create job posting',
    });
  }
};

/**
 * Get all jobs for recruiter with status filter
 */
export const getRecruiterJobs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const filter = { recruiter: userId };
    if (status && status !== 'All') {
      filter.status = status;
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job postings',
    });
  }
};

/**
 * Get single job by ID
 */
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job details',
    });
  }
};

/**
 * Update job
 */
export const updateJob = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobId = req.params.id;

    const job = await Job.findOne({ _id: jobId, recruiter: userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized',
      });
    }

    Object.assign(job, req.body);
    await job.save();

    return res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update job posting',
    });
  }
};

/**
 * Delete job
 */
export const deleteJob = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobId = req.params.id;

    const job = await Job.findOneAndDelete({ _id: jobId, recruiter: userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job',
    });
  }
};

/**
 * Get Applications for recruiter
 */
export const getApplications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, jobId } = req.query;

    const filter = { recruiter: userId };
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (jobId) {
      filter.job = jobId;
    }

    const applications = await Application.find(filter)
      .populate('job', 'title location employmentType')
      .populate('student', 'fullName email')
      .populate('studentProfile')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
    });
  }
};

/**
 * Update Application Status (Shortlist, Reject, Interview, etc.)
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'Reviewing', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application status',
      });
    }

    const app = await Application.findOne({ _id: id, recruiter: userId });
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    app.status = status;
    await app.save();

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      data: app,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update application status',
    });
  }
};

/**
 * Delete Application by recruiter
 */
export const deleteApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const recruiterJobs = await Job.find({ recruiter: userId }).select('_id');
    const jobIds = recruiterJobs.map((j) => j._id);

    const app = await Application.findOneAndDelete({
      _id: id,
      $or: [{ recruiter: userId }, { job: { $in: jobIds } }],
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized to delete',
      });
    }

    if (app.job) {
      await Job.findByIdAndUpdate(app.job, { $inc: { applicationsCount: -1 } }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete application',
    });
  }
};

/**
 * Get Candidates (real student profiles from MongoDB)
 */
export const getCandidates = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search } = req.query;

    // 1. Find all jobs posted by this recruiter
    const recruiterJobs = await Job.find({ recruiter: userId }).select('_id title companyName');
    const jobIds = recruiterJobs.map((j) => j._id);

    // 2. Find applications submitted for this recruiter's jobs
    const applications = await Application.find({
      $or: [{ recruiter: userId }, { job: { $in: jobIds } }],
    })
      .populate('student', 'fullName name email')
      .populate('job', 'title companyName location')
      .sort({ createdAt: -1 });

    if (applications.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // 3. Fetch StudentProfiles for applied students
    const studentUserIds = [...new Set(applications.map((app) => app.student?._id).filter(Boolean))];
    const profiles = await StudentProfile.find({ user: { $in: studentUserIds } }).populate('user', 'fullName name email');
    const profileMap = new Map(profiles.map((p) => [p.user?._id?.toString(), p]));

    // 4. Format applied candidates list
    let candidates = applications.map((app) => {
      const studentUser = app.student;
      const sId = studentUser?._id?.toString();
      const p = profileMap.get(sId) || {};

      return {
        _id: app._id,
        applicationId: app._id,
        studentId: sId,
        name: studentUser?.fullName || studentUser?.name || 'Student Applicant',
        email: studentUser?.email || '',
        appliedJobTitle: app.job?.title || 'Job Position',
        targetRole: p.preferredJobRole || p.targetCareer || app.job?.title || 'Applicant',
        skills: [...(p.technicalSkills || []), ...(p.softSkills || [])],
        degree: p.degree || '',
        college: p.college || '',
        location: p.careerInterests || app.job?.location || '',
        resumeScore: app.matchScore || p.resumeScore || p.resumeAnalysis?.atsScore || 0,
        assessmentScore: p.assessmentScore || 0,
        status: app.status || 'New',
        appliedAt: app.createdAt,
      };
    });

    // Filter by search string if provided
    if (search) {
      const q = search.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.targetRole.toLowerCase().includes(q) ||
          c.appliedJobTitle.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    console.error('Error fetching job applicants:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job applicants',
    });
  }
};

/**
 * Parse uploaded Job Description document (PDF/DOCX/TXT) and extract text & skills
 */
export const parseJobDescription = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload a valid PDF, DOCX, or TXT file.' });
    }

    const rawText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ success: false, message: 'Could not extract readable text from this file.' });
    }

    const text = rawText.trim();

    // Extract title heuristic (first clean line)
    let extractedTitle = '';
    const cleanLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (cleanLines.length > 0) {
      const firstLine = cleanLines[0];
      if (firstLine.length > 3 && firstLine.length < 80) {
        extractedTitle = firstLine.replace(/^(job description|jd|position|role):?\s*/i, '');
      }
    }

    // Extract skills explicitly listed under skills sections/headers in document
    let detectedSkills = [];
    const skillsSectionMatch = text.match(/(?:required skills|technical skills|skills & expertise|skills|technologies|tech stack|key skills):?\s*([^\n\r]+(?:\n[^\n\r]+){0,5})/i);
    if (skillsSectionMatch && skillsSectionMatch[1]) {
      const skillsChunk = skillsSectionMatch[1];
      const parsed = skillsChunk
        .split(/[,•|\n\r]+/)
        .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
        .filter((s) => s.length >= 2 && s.length <= 30 && !/^(and|or|with|in|the|a|for|to)$/i.test(s));
      detectedSkills = Array.from(new Set(parsed));
    }

    return res.status(200).json({
      success: true,
      message: 'Job Description parsed successfully',
      data: {
        fileName: req.file.originalname,
        fileSize: `${(req.file.size / 1024).toFixed(1)} KB`,
        text,
        title: extractedTitle,
        extractedSkills: detectedSkills,
      },
    });
  } catch (error) {
    console.error('Error parsing Job Description document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to extract text from Job Description document',
    });
  }
};
