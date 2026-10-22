import User from '../models/User.js';
import Recruiter from '../models/Recruiter.js';
import Admin from '../models/Admin.js';
import Mentor from '../models/Mentor.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import StudentProfile from '../models/StudentProfile.js';
import Course from '../models/Course.js';
import CourseModule from '../models/CourseModule.js';
import CourseLesson from '../models/CourseLesson.js';
import CoursePDFResource from '../models/CoursePDFResource.js';
import CourseTextResource from '../models/CourseTextResource.js';
import CourseQuiz from '../models/CourseQuiz.js';
import CourseEnrollment from '../models/CourseEnrollment.js';

// Helper to format mentor info
const formatMentorInfo = async (mentorId) => {
  if (!mentorId) return { _id: null, name: 'Unknown Mentor', fullName: 'Unknown Mentor', email: 'N/A' };
  let mentor = await Mentor.findById(mentorId).select('fullName name email profilePhoto company professionalTitle');
  if (!mentor) {
    mentor = await User.findById(mentorId).select('fullName name email avatar role');
  }
  if (!mentor) {
    return { _id: mentorId, name: 'Mentor', fullName: 'Mentor', email: 'N/A' };
  }
  return {
    _id: mentor._id,
    name: mentor.fullName || mentor.name || 'Mentor',
    fullName: mentor.fullName || mentor.name || 'Mentor',
    email: mentor.email || 'N/A',
    avatar: mentor.profilePhoto || mentor.avatar || '',
  };
};

// @desc    Get system overview & dashboard stats for Admin
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getAdminStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalMentorsInCollection = await Mentor.countDocuments();
    const totalMentorsInUsers = await User.countDocuments({ role: 'mentor' });
    const totalMentors = totalMentorsInCollection + totalMentorsInUsers;
    const totalRecruiters = await Recruiter.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    const totalJobs = await Job.countDocuments({ isDeleted: { $ne: true } });
    const totalApplications = await Application.countDocuments();

    // Accurately count profiles with analyzed resumes in MongoDB
    const totalResumesAnalyzed = await StudentProfile.countDocuments({
      'resumeAnalysis.analyzedAt': { $ne: null, $exists: true }
    });

    // Course counts
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ status: 'published' });
    const draftCourses = await Course.countDocuments({ status: 'draft' });
    const deactivatedCourses = await Course.countDocuments({ status: 'deactivated' });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: totalStudents + totalMentors + totalRecruiters + totalAdmins,
        students: totalStudents,
        mentors: totalMentors,
        recruiters: totalRecruiters,
        admins: totalAdmins,
        jobs: totalJobs,
        applications: totalApplications,
        resumesAnalyzed: totalResumesAnalyzed,
        courses: {
          total: totalCourses,
          published: publishedCourses,
          draft: draftCourses,
          deactivated: deactivatedCourses,
        },
        collections: {
          users: totalStudents,
          mentors: totalMentors,
          recruiters: totalRecruiters,
          admins: totalAdmins,
          job_postings: totalJobs,
          applications: totalApplications,
          resumes: totalResumesAnalyzed,
          courses: totalCourses,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin system statistics'
    });
  }
};

// @desc    Get all users across all collections for Admin
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    const recruiters = await Recruiter.find({}).select('-password').sort({ createdAt: -1 });
    const mentors = await Mentor.find({}).select('-password').sort({ createdAt: -1 });
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });

    const formattedUsers = users.map((u) => ({
      _id: u._id,
      name: u.fullName || u.name,
      fullName: u.fullName || u.name,
      email: u.email,
      role: u.role || 'student',
      isActive: u.isActive !== false,
      collectionName: 'users',
      createdAt: u.createdAt
    }));

    const formattedRecruiters = recruiters.map((r) => ({
      _id: r._id,
      name: r.fullName,
      fullName: r.fullName,
      email: r.email,
      role: 'recruiter',
      companyName: r.companyName || 'N/A',
      phone: r.phone || 'N/A',
      isActive: r.isActive !== false,
      collectionName: 'recruiters',
      createdAt: r.createdAt
    }));

    const formattedMentors = mentors.map((m) => ({
      _id: m._id,
      name: m.fullName,
      fullName: m.fullName,
      email: m.email,
      role: 'mentor',
      companyName: m.company || 'N/A',
      phone: m.phone || 'N/A',
      isActive: m.isActive !== false,
      collectionName: 'mentors',
      createdAt: m.createdAt
    }));

    const formattedAdmins = admins.map((a) => ({
      _id: a._id,
      username: a.username,
      name: a.fullName || a.username,
      fullName: a.fullName || a.username,
      email: a.email,
      role: 'admin',
      isActive: true,
      collectionName: 'admins',
      createdAt: a.createdAt,
      lastLogin: a.lastLogin
    }));

    const all = [...formattedAdmins, ...formattedRecruiters, ...formattedMentors, ...formattedUsers];

    return res.status(200).json({
      success: true,
      count: all.length,
      users: all
    });
  } catch (error) {
    console.error('Error fetching all users for admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user list'
    });
  }
};

// @desc    Delete a user account from database (Admin only)
// @route   DELETE /api/admin/users/:collectionName/:id
// @access  Private (Admin)
export const deleteUserAdmin = async (req, res) => {
  try {
    const { collectionName, id } = req.params;

    if (collectionName === 'admins') {
      const adminCount = await Admin.countDocuments();
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only remaining admin account'
        });
      }
      await Admin.findByIdAndDelete(id);
    } else if (collectionName === 'recruiters') {
      await Recruiter.findByIdAndDelete(id);
    } else if (collectionName === 'mentors' || collectionName === 'mentor') {
      await Mentor.findByIdAndDelete(id);
    } else {
      await User.findByIdAndDelete(id);
    }

    return res.status(200).json({
      success: true,
      message: `Account deleted successfully from "${collectionName}" collection`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user account'
    });
  }
};

// @desc    Get all jobs for Admin with dynamic applicant counts
// @route   GET /api/admin/jobs
// @access  Private (Admin)
export const getAllJobsAdmin = async (req, res) => {
  try {
    const jobs = await Job.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    // Calculate dynamic applicant counts from database
    const jobIds = jobs.map((j) => j._id);
    const appCounts = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$job', count: { $sum: 1 } } }
    ]);

    const countMap = new Map(appCounts.map((a) => [a._id.toString(), a.count]));

    const jobsWithRealCounts = jobs.map((j) => {
      const realCount = countMap.get(j._id.toString()) || 0;
      return {
        ...j.toObject(),
        applicationsCount: realCount,
      };
    });

    return res.status(200).json({
      success: true,
      count: jobsWithRealCounts.length,
      jobs: jobsWithRealCounts
    });
  } catch (error) {
    console.error('Error fetching admin jobs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job postings'
    });
  }
};

// @desc    Toggle active status of a job (Activate / Deactivate)
// @route   PUT /api/admin/jobs/:id/toggle-status
// @access  Private (Admin)
export const toggleJobStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    const currentStatus = (job.status || 'Active').toLowerCase();
    const newStatus = currentStatus === 'active' ? 'Deactivated' : 'Active';
    job.status = newStatus;
    await job.save();

    const actualCount = await Application.countDocuments({ job: job._id });

    return res.status(200).json({
      success: true,
      message: `Job "${job.title}" has been ${newStatus === 'Active' ? 'reactivated' : 'deactivated'}.`,
      job: {
        ...job.toObject(),
        applicationsCount: actualCount,
      }
    });
  } catch (error) {
    console.error('Error toggling job status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update job status'
    });
  }
};

// @desc    Soft delete job while preserving application records
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin)
export const deleteJobAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Soft delete to preserve related application records
    job.isDeleted = true;
    job.deletedAt = new Date();
    job.status = 'Closed';
    await job.save();

    // Preserve all application records
    const preservedAppsCount = await Application.countDocuments({ job: id });

    return res.status(200).json({
      success: true,
      message: `Job "${job.title}" has been deleted. ${preservedAppsCount} applicant records preserved.`,
      jobId: id,
      preservedApplicationsCount: preservedAppsCount
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job posting'
    });
  }
};

// @desc    Get detailed job record with applicant list for Admin
// @route   GET /api/admin/jobs/:id
// @access  Private (Admin)
export const getJobDetailsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Fetch related applications and applicant records
    const applications = await Application.find({ job: id })
      .select('applicantName applicantEmail applicantPhone degree institution experienceType status createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      job: {
        ...job.toObject(),
        applicationsCount: applications.length,
        applications,
      }
    });
  } catch (error) {
    console.error('Error fetching job details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load job details'
    });
  }
};

// @desc    Toggle active status of a user (Activate / Deactivate)
// @route   PUT /api/admin/users/:collectionName/:id/toggle-status
// @access  Private (Admin)
export const toggleUserStatusAdmin = async (req, res) => {
  try {
    const { collectionName, id } = req.params;
    let updatedDoc = null;

    if (collectionName === 'users') {
      updatedDoc = await User.findById(id);
      if (!updatedDoc) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      updatedDoc.isActive = updatedDoc.isActive === false ? true : false;
      await updatedDoc.save();
    } else if (collectionName === 'recruiters') {
      updatedDoc = await Recruiter.findById(id);
      if (!updatedDoc) {
        return res.status(404).json({ success: false, message: 'Recruiter not found' });
      }
      updatedDoc.isActive = updatedDoc.isActive === false ? true : false;
      await updatedDoc.save();
    } else if (collectionName === 'mentors' || collectionName === 'mentor') {
      updatedDoc = await Mentor.findById(id);
      if (!updatedDoc) {
        return res.status(404).json({ success: false, message: 'Mentor not found' });
      }
      updatedDoc.isActive = updatedDoc.isActive === false ? true : false;
      await updatedDoc.save();
    } else {
      return res.status(400).json({ success: false, message: 'Status cannot be toggled for admin accounts' });
    }

    const newStatus = updatedDoc.isActive;
    const statusText = newStatus ? 'activated' : 'deactivated';

    return res.status(200).json({
      success: true,
      message: `Account "${updatedDoc.fullName || updatedDoc.email}" has been ${statusText}.`,
      data: {
        _id: updatedDoc._id,
        isActive: newStatus,
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user active status'
    });
  }
};

// @desc    Get all courses with mentor & student enrollment count
// @route   GET /api/admin/courses
// @access  Private (Admin)
export const getAllCoursesAdmin = async (req, res) => {
  try {
    const { status, category, difficulty, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { shortDescription: searchRegex },
      ];
    }

    const courses = await Course.find(query).sort({ createdAt: -1 });

    const formattedCourses = await Promise.all(
      courses.map(async (c) => {
        const mentorInfo = await formatMentorInfo(c.mentorId);
        const enrollments = await CourseEnrollment.find({ courseId: c._id })
          .populate('studentId', 'fullName name email avatar role')
          .sort({ enrolledAt: -1 });

        const enrolledStudents = enrollments.map((e) => {
          const student = e.studentId || {};
          return {
            _id: student._id || e._id,
            fullName: student.fullName || student.name || 'Enrolled Student',
            name: student.fullName || student.name || 'Enrolled Student',
            email: student.email || 'N/A',
            avatar: student.avatar || '',
            enrolledAt: e.enrolledAt || e.createdAt,
            status: e.status || 'active',
          };
        });

        const moduleCount = await CourseModule.countDocuments({ courseId: c._id });
        const lessonCount = await CourseLesson.countDocuments({ courseId: c._id });

        return {
          ...c.toObject(),
          mentor: mentorInfo,
          studentsEnrolled: enrolledStudents.length,
          enrolledStudents,
          modulesCount: moduleCount,
          lessonsCount: lessonCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: formattedCourses.length,
      courses: formattedCourses,
    });
  } catch (error) {
    console.error('Error fetching admin courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve course list',
    });
  }
};

// @desc    Get complete course details (enrolled students, modules, lessons, resources, quizzes, mentor info)
// @route   GET /api/admin/courses/:id
// @access  Private (Admin)
export const getCourseDetailsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const mentorInfo = await formatMentorInfo(course.mentorId);
    const enrollments = await CourseEnrollment.find({ courseId: id })
      .populate('studentId', 'fullName name email avatar role')
      .sort({ enrolledAt: -1 });

    const enrolledStudents = enrollments.map((e) => {
      const student = e.studentId || {};
      return {
        _id: student._id || e._id,
        fullName: student.fullName || student.name || 'Enrolled Student',
        name: student.fullName || student.name || 'Enrolled Student',
        email: student.email || 'N/A',
        avatar: student.avatar || '',
        enrolledAt: e.enrolledAt || e.createdAt,
        status: e.status || 'active',
      };
    });

    const modules = await CourseModule.find({ courseId: id }).sort({ order: 1 });
    const lessons = await CourseLesson.find({ courseId: id }).sort({ order: 1 });
    const pdfResources = await CoursePDFResource.find({ courseId: id }).select('-fileData');
    const textResources = await CourseTextResource.find({ courseId: id });
    const quizzes = await CourseQuiz.find({ courseId: id });

    return res.status(200).json({
      success: true,
      data: {
        course: {
          ...course.toObject(),
          mentor: mentorInfo,
          studentsEnrolled: enrolledStudents.length,
        },
        enrolledStudents,
        modules,
        lessons,
        pdfResources,
        textResources,
        quizzes,
      },
    });
  } catch (error) {
    console.error('Error fetching admin course details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve course details',
    });
  }
};

// @desc    Get enrolled students list for a specific course
// @route   GET /api/admin/courses/:id/enrollments
// @access  Private (Admin)
export const getCourseEnrollmentsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).select('title mentorId');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollments = await CourseEnrollment.find({ courseId: id })
      .populate('studentId', 'fullName name email avatar role createdAt')
      .sort({ enrolledAt: -1 });

    const enrolledStudents = enrollments.map((e) => {
      const student = e.studentId || {};
      return {
        _id: student._id || e._id,
        fullName: student.fullName || student.name || 'Enrolled Student',
        email: student.email || 'N/A',
        avatar: student.avatar || '',
        enrolledAt: e.enrolledAt || e.createdAt,
        status: e.status || 'active',
      };
    });

    return res.status(200).json({
      success: true,
      courseTitle: course.title,
      count: enrolledStudents.length,
      enrolledStudents,
    });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrolled students',
    });
  }
};

// @desc    Update course status (published, draft, deactivated)
// @route   PATCH /api/admin/courses/:id/status
// @access  Private (Admin)
export const updateCourseStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['published', 'draft', 'deactivated'];
    if (!status || !allowedStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    course.status = status.toLowerCase();
    await course.save();

    return res.status(200).json({
      success: true,
      message: `Course status updated to ${course.status}`,
      data: { course },
    });
  } catch (error) {
    console.error('Error updating course status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update course status',
    });
  }
};

// @desc    Get all course resources (PDFs & Text resources across all courses)
// @route   GET /api/admin/resources
// @access  Private (Admin)
export const getCourseResourcesAdmin = async (req, res) => {
  try {
    const pdfs = await CoursePDFResource.find({}).select('-fileData').sort({ createdAt: -1 });
    const texts = await CourseTextResource.find({}).sort({ createdAt: -1 });

    const allCoursesMap = new Map();
    const courses = await Course.find({}).select('title mentorId');
    courses.forEach((c) => allCoursesMap.set(c._id.toString(), c));

    const allModulesMap = new Map();
    const modules = await CourseModule.find({}).select('title');
    modules.forEach((m) => allModulesMap.set(m._id.toString(), m));

    // Combine PDF and Text resources
    const formattedPDFs = await Promise.all(
      pdfs.map(async (p) => {
        const parentCourse = allCoursesMap.get(p.courseId?.toString()) || {};
        const parentModule = allModulesMap.get(p.moduleId?.toString()) || {};
        const mentorInfo = await formatMentorInfo(p.mentorId || parentCourse.mentorId);

        return {
          _id: p._id,
          title: p.title,
          description: p.description || '',
          resourceType: 'pdf',
          filePath: p.filePath,
          originalName: p.originalName,
          fileSize: p.fileSize,
          course: {
            _id: p.courseId,
            title: parentCourse.title || 'Unknown Course',
          },
          module: {
            _id: p.moduleId,
            title: parentModule.title || 'General Module',
          },
          mentor: mentorInfo,
          createdAt: p.createdAt,
          sourceCollection: 'pdf',
        };
      })
    );

    const formattedTexts = await Promise.all(
      texts.map(async (t) => {
        const parentCourse = allCoursesMap.get(t.courseId?.toString()) || {};
        const parentModule = allModulesMap.get(t.moduleId?.toString()) || {};
        const mentorInfo = await formatMentorInfo(t.mentorId || parentCourse.mentorId);

        return {
          _id: t._id,
          title: t.title,
          description: t.description || '',
          resourceType: t.type || 'reference_link',
          url: t.url || '',
          content: t.content || '',
          course: {
            _id: t.courseId,
            title: parentCourse.title || 'Unknown Course',
          },
          module: {
            _id: t.moduleId,
            title: parentModule.title || 'General Module',
          },
          mentor: mentorInfo,
          createdAt: t.createdAt,
          sourceCollection: 'text',
        };
      })
    );

    const combined = [...formattedPDFs, ...formattedTexts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: combined.length,
      resources: combined,
    });
  } catch (error) {
    console.error('Error fetching course resources:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve course resources',
    });
  }
};

// @desc    Delete a course resource (PDF or Text)
// @route   DELETE /api/admin/resources/:resourceType/:id
// @access  Private (Admin)
export const deleteCourseResourceAdmin = async (req, res) => {
  try {
    const { resourceType, id } = req.params;

    if (resourceType === 'pdf') {
      await CoursePDFResource.findByIdAndDelete(id);
    } else {
      await CourseTextResource.findByIdAndDelete(id);
    }

    return res.status(200).json({
      success: true,
      message: 'Course resource deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete course resource',
    });
  }
};

// @desc    Get all quizzes and assignments across all courses
// @route   GET /api/admin/quizzes-assignments
// @access  Private (Admin)
export const getQuizzesAndAssignmentsAdmin = async (req, res) => {
  try {
    const quizzes = await CourseQuiz.find({}).sort({ createdAt: -1 });
    const assignments = await CourseTextResource.find({ type: 'assignment' }).sort({ createdAt: -1 });

    const allCoursesMap = new Map();
    const courses = await Course.find({}).select('title mentorId');
    courses.forEach((c) => allCoursesMap.set(c._id.toString(), c));

    const allModulesMap = new Map();
    const modules = await CourseModule.find({}).select('title');
    modules.forEach((m) => allModulesMap.set(m._id.toString(), m));

    const formattedQuizzes = await Promise.all(
      quizzes.map(async (q) => {
        const parentCourse = allCoursesMap.get(q.courseId?.toString()) || {};
        const parentModule = allModulesMap.get(q.moduleId?.toString()) || {};
        const mentorInfo = await formatMentorInfo(q.mentorId || parentCourse.mentorId);

        const totalMarks = (q.questions || []).reduce((acc, curr) => acc + (curr.marks || 1), 0);

        return {
          _id: q._id,
          title: q.title,
          description: q.description || '',
          itemType: 'quiz',
          status: q.status || 'published',
          questionsCount: (q.questions || []).length,
          questions: q.questions || [],
          totalMarks,
          course: {
            _id: q.courseId,
            title: parentCourse.title || 'Unknown Course',
          },
          module: {
            _id: q.moduleId,
            title: parentModule.title || 'General Module',
          },
          mentor: mentorInfo,
          createdAt: q.createdAt,
        };
      })
    );

    const formattedAssignments = await Promise.all(
      assignments.map(async (a) => {
        const parentCourse = allCoursesMap.get(a.courseId?.toString()) || {};
        const parentModule = allModulesMap.get(a.moduleId?.toString()) || {};
        const mentorInfo = await formatMentorInfo(a.mentorId || parentCourse.mentorId);

        return {
          _id: a._id,
          title: a.title,
          description: a.description || '',
          content: a.content || '',
          url: a.url || '',
          itemType: 'assignment',
          status: 'published',
          course: {
            _id: a.courseId,
            title: parentCourse.title || 'Unknown Course',
          },
          module: {
            _id: a.moduleId,
            title: parentModule.title || 'General Module',
          },
          mentor: mentorInfo,
          createdAt: a.createdAt,
        };
      })
    );

    const combined = [...formattedQuizzes, ...formattedAssignments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: combined.length,
      items: combined,
    });
  } catch (error) {
    console.error('Error fetching quizzes and assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve quizzes and assignments',
    });
  }
};

// @desc    Delete a quiz or assignment
// @route   DELETE /api/admin/quizzes-assignments/:itemType/:id
// @access  Private (Admin)
export const deleteQuizOrAssignmentAdmin = async (req, res) => {
  try {
    const { itemType, id } = req.params;

    if (itemType === 'quiz') {
      await CourseQuiz.findByIdAndDelete(id);
    } else {
      await CourseTextResource.findByIdAndDelete(id);
    }

    return res.status(200).json({
      success: true,
      message: `${itemType === 'quiz' ? 'Quiz' : 'Assignment'} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting quiz/assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete item',
    });
  }
};
