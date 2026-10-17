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
      .populate('student', 'fullName name email role')
      .populate('studentProfile')
      .sort({ createdAt: -1 });

    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const appObj = app.toObject ? app.toObject() : app;
        if (!appObj.studentProfile && appObj.student?._id) {
          const profile = await StudentProfile.findOne({ user: appObj.student._id });
          if (profile) {
            appObj.studentProfile = profile.toObject ? profile.toObject() : profile;
          }
        }
        return appObj;
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedApplications.length,
      data: enrichedApplications,
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
 * Fetch Live Student Profile from student_profile collection for an Application
 * @route GET /api/recruiter/applications/:id/student-profile
 */
export const getStudentProfileForRecruiter = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const application = await Application.findOne({ _id: id, recruiter: userId })
      .populate('student', 'fullName name email role createdAt')
      .populate('studentProfile');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    let profileDoc = application.studentProfile;
    if (!profileDoc && application.student?._id) {
      profileDoc = await StudentProfile.findOne({ user: application.student._id });
    }

    if (!profileDoc && application.student) {
      profileDoc = await StudentProfile.findOne({ user: application.student });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: application.student,
        profile: profileDoc ? (profileDoc.toObject ? profileDoc.toObject() : profileDoc) : null,
        application: {
          _id: application._id,
          applicantName: application.applicantName,
          applicantEmail: application.applicantEmail,
          applicantPhone: application.applicantPhone,
          degree: application.degree,
          institution: application.institution,
          graduationYear: application.graduationYear,
          skills: application.skills,
          experienceType: application.experienceType,
          experienceDetails: application.experienceDetails,
          resumeFileName: application.resumeFileName,
          status: application.status,
          createdAt: application.createdAt,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student profile for recruiter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student profile'
    });
  }
};

/**
 * Download Candidate Resume for an Application
 * @route GET /api/recruiter/applications/:id/download-resume
 */
export const downloadCandidateResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const application = await Application.findOne({ _id: id, recruiter: userId })
      .populate('studentProfile')
      .populate('student', 'fullName email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    let fileBuffer = application.resumeFileBuffer;
    let mimeType = application.resumeMimeType || 'application/pdf';
    let fileName = application.resumeFileName || `${application.applicantName || 'Candidate'}_Resume.pdf`;

    if (!fileBuffer && application.studentProfile?.resumeAnalysis?.fileBuffer) {
      fileBuffer = application.studentProfile.resumeAnalysis.fileBuffer;
      mimeType = application.studentProfile.resumeAnalysis.fileMimeType || 'application/pdf';
      if (application.studentProfile.resumeAnalysis.fileName) {
        fileName = application.studentProfile.resumeAnalysis.fileName;
      }
    }

    if (!fileBuffer) {
      const candidateName = application.applicantName || application.student?.fullName || 'Candidate';
      const email = application.applicantEmail || application.student?.email || 'N/A';
      const phone = application.applicantPhone || application.studentProfile?.phone || 'N/A';
      const degree = application.degree || application.studentProfile?.degree || 'N/A';
      const college = application.institution || application.studentProfile?.college || 'N/A';
      const gradYear = application.graduationYear || application.studentProfile?.graduationYear || 'N/A';
      const skills = (application.skills && application.skills.length > 0) ? application.skills.join(', ') : 'Not specified';
      const experience = application.experienceDetails || application.experienceType || 'Fresher';

      const pdfText = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kinds [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 18 Tf
50 720 Td
(${candidateName} - Candidate Profile Resume) Tj
0 -30 Td
/F1 12 Tf
(Email: ${email} | Phone: ${phone}) Tj
0 -25 Td
(Education: ${degree} - ${college} \\(${gradYear}\\)) Tj
0 -25 Td
(Skills: ${skills}) Tj
0 -25 Td
(Experience: ${experience}) Tj
0 -30 Td
(CareerPilot AI Verified Application Document) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
00000000115 00000 n 
0000000300 00000 n 
0000000230 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
600
%%EOF`;

      fileBuffer = Buffer.from(pdfText, 'utf-8');
      mimeType = 'application/pdf';
      fileName = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(fileBuffer);
  } catch (error) {
    console.error('Error downloading candidate resume:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download candidate resume'
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

    const app = await Application.findOne({ _id: id, recruiter: userId }).populate('job');
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const previousStatus = app.status;
    app.status = status;
    await app.save();

    // Inform candidate if application status changed
    if (previousStatus !== status && app.student) {
      try {
        const studentId = app.student._id || app.student;
        const jobTitle = app.job?.title || 'Job Position';
        const companyName = app.job?.companyName || 'Recruiter';

        let activityTitle = '';
        let activityDesc = '';

        if (status === 'Shortlisted') {
          activityTitle = `🎉 Shortlisted for ${jobTitle}`;
          activityDesc = `Great news! ${companyName} has shortlisted your application for ${jobTitle}.`;
        } else if (status === 'Interview') {
          activityTitle = `📅 Interview Stage: ${jobTitle}`;
          activityDesc = `${companyName} moved your application for ${jobTitle} to the Interview round.`;
        } else if (status === 'Selected') {
          activityTitle = `🌟 Selected for ${jobTitle}`;
          activityDesc = `Congratulations! ${companyName} has selected you for ${jobTitle}.`;
        } else if (status === 'Rejected') {
          activityTitle = `Update on ${jobTitle} Application`;
          activityDesc = `${companyName} updated your application status for ${jobTitle}.`;
        } else if (status === 'Reviewing') {
          activityTitle = `Application Under Review: ${jobTitle}`;
          activityDesc = `${companyName} is reviewing your application for ${jobTitle}.`;
        }

        if (activityTitle) {
          let studentProfile = await StudentProfile.findOne({ user: studentId });
          if (!studentProfile) {
            studentProfile = new StudentProfile({ user: studentId, activities: [] });
          }
          if (!Array.isArray(studentProfile.activities)) {
            studentProfile.activities = [];
          }
          studentProfile.activities.unshift({
            title: activityTitle,
            desc: activityDesc,
            time: 'Just now',
            timestamp: new Date(),
          });
          if (studentProfile.activities.length > 30) {
            studentProfile.activities = studentProfile.activities.slice(0, 30);
          }
          await studentProfile.save();
        }
      } catch (notifyErr) {
        console.error('Error logging student application status notification:', notifyErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      data: app,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
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
