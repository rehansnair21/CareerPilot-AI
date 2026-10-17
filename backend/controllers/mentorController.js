import fs from 'fs';
import Mentor from '../models/Mentor.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Course from '../models/Course.js';
import CourseModule from '../models/CourseModule.js';
import CourseLesson from '../models/CourseLesson.js';
import CoursePDFResource from '../models/CoursePDFResource.js';
import CourseTextResource from '../models/CourseTextResource.js';
import CourseQuiz from '../models/CourseQuiz.js';
import CourseQuizAttempt from '../models/CourseQuizAttempt.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import CourseProgress from '../models/CourseProgress.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import {
  evaluateStudentProgressStatus,
  calculateCourseProgressPercentage,
  PROGRESS_CONFIG,
} from '../utils/progressEvaluation.js';

// Helper to resolve mentor document ID for req.user
const resolveMentorId = async (user) => {
  const emailVal = (user?.email || '').toLowerCase().trim();
  let mentor = await Mentor.findOne({
    $or: [
      { _id: user._id },
      ...(emailVal ? [{ email: emailVal }] : []),
    ],
  });

  if (!mentor) {
    // Migrate or create mentor entry
    mentor = await Mentor.create({
      fullName: user?.fullName || user?.name || 'Mentor User',
      email: emailVal || `mentor_${user?._id || Date.now()}@careerpilot.ai`,
      role: 'mentor',
    });
  }
  return mentor._id;
};

// @desc    Get authenticated mentor profile
// @route   GET /api/mentor/profile
// @access  Private (Mentor)
export const getMentorProfile = async (req, res) => {
  try {
    let mentor = await Mentor.findOne({
      $or: [
        { _id: req.user._id },
        { email: req.user.email ? req.user.email.toLowerCase() : '' },
      ],
    }).select('-password');

    if (!mentor) {
      const userDoc = await User.findById(req.user._id);
      if (userDoc) {
        mentor = {
          _id: userDoc._id,
          fullName: userDoc.fullName || userDoc.name || 'Mentor User',
          email: userDoc.email,
          role: 'mentor',
          profilePhoto: userDoc.avatar || '',
          professionalTitle: '',
          experience: '',
          bio: '',
          expertise: [],
          linkedin: '',
          github: '',
          availability: '',
          phone: userDoc.phone || '',
        };
      }
    }

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          _id: mentor._id,
          fullName: mentor.fullName || mentor.name || '',
          name: mentor.fullName || mentor.name || '',
          email: mentor.email,
          role: 'mentor',
          profilePhoto: mentor.profilePhoto || '',
          company: mentor.company || '',
          designation: mentor.designation || mentor.professionalTitle || '',
          professionalTitle: mentor.professionalTitle || mentor.designation || '',
          experience: mentor.experience || '',
          bio: mentor.bio || '',
          expertise: Array.isArray(mentor.expertise) ? mentor.expertise : [],
          linkedin: mentor.linkedin || '',
          github: mentor.github || '',
          availability: mentor.availability || '',
          phone: mentor.phone || '',
          location: mentor.location || '',
          createdAt: mentor.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve mentor profile',
    });
  }
};

// @desc    Update authenticated mentor profile
// @route   PUT /api/mentor/profile
// @access  Private (Mentor)
export const updateMentorProfile = async (req, res) => {
  try {
    let mentor = await Mentor.findOne({
      $or: [
        { _id: req.user._id },
        { email: req.user.email ? req.user.email.toLowerCase() : '' },
      ],
    });

    if (!mentor) {
      mentor = await Mentor.create({
        fullName: req.body.fullName || req.user.fullName || req.user.name || 'Mentor User',
        email: req.user.email.toLowerCase(),
        role: 'mentor',
      });
    }

    const {
      fullName,
      name,
      profilePhoto,
      professionalTitle,
      designation,
      company,
      experience,
      bio,
      expertise,
      linkedin,
      github,
      availability,
      phone,
      location,
    } = req.body;

    if (fullName !== undefined || name !== undefined) {
      mentor.fullName = (fullName || name || '').trim();
    }
    if (profilePhoto !== undefined) {
      mentor.profilePhoto = profilePhoto;
    }
    if (professionalTitle !== undefined || designation !== undefined) {
      const titleVal = (professionalTitle || designation || '').trim();
      mentor.professionalTitle = titleVal;
      mentor.designation = titleVal;
    }
    if (company !== undefined) {
      mentor.company = company.trim();
    }
    if (experience !== undefined) {
      mentor.experience = experience.trim();
    }
    if (bio !== undefined) {
      mentor.bio = bio.trim();
    }
    if (expertise !== undefined) {
      mentor.expertise = Array.isArray(expertise) ? expertise : [];
    }
    if (linkedin !== undefined) {
      mentor.linkedin = linkedin.trim();
    }
    if (github !== undefined) {
      mentor.github = github.trim();
    }
    if (availability !== undefined) {
      mentor.availability = availability.trim();
    }
    if (phone !== undefined) {
      mentor.phone = phone.trim();
    }
    if (location !== undefined) {
      mentor.location = location.trim();
    }

    await mentor.save();

    return res.status(200).json({
      success: true,
      message: 'Mentor profile updated successfully!',
      data: {
        profile: {
          _id: mentor._id,
          fullName: mentor.fullName,
          name: mentor.fullName,
          email: mentor.email,
          role: 'mentor',
          profilePhoto: mentor.profilePhoto,
          company: mentor.company,
          designation: mentor.designation,
          professionalTitle: mentor.professionalTitle,
          experience: mentor.experience,
          bio: mentor.bio,
          expertise: mentor.expertise,
          linkedin: mentor.linkedin,
          github: mentor.github,
          availability: mentor.availability,
          phone: mentor.phone,
          location: mentor.location,
          updatedAt: mentor.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update mentor profile',
    });
  }
};

// @desc    Get dashboard overview statistics & preview lists for Mentor
// @route   GET /api/mentor/dashboard-stats
// @access  Private (Mentor)
export const getMentorDashboardStats = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);

    // Fetch all courses created by this mentor
    const mentorCourses = await Course.find({
      $or: [{ mentorId: mentorId }, { mentorId: req.user._id }],
    }).lean();
    const mentorCourseIds = mentorCourses.map((c) => c._id);

    // Fetch real enrollments for courses owned by this mentor
    const enrollments = await CourseEnrollment.find({ courseId: { $in: mentorCourseIds } }).lean();
    const uniqueEnrolledStudentIds = new Set(
      enrollments.map((e) => e.studentId?.toString()).filter(Boolean)
    );

    // Fetch real progress records and lessons for these courses
    const progressDocs = await CourseProgress.find({ courseId: { $in: mentorCourseIds } }).lean();
    const lessons = await CourseLesson.find({ courseId: { $in: mentorCourseIds } }).lean();

    const lessonCountMap = new Map();
    mentorCourseIds.forEach((id) => lessonCountMap.set(id.toString(), 0));
    lessons.forEach((les) => {
      const cId = les.courseId?.toString();
      lessonCountMap.set(cId, (lessonCountMap.get(cId) || 0) + 1);
    });

    let totalProgressSum = 0;
    let needsAttentionCount = 0;

    enrollments.forEach((enr) => {
      const sId = enr.studentId?.toString();
      const cId = enr.courseId?.toString();
      const pDoc = progressDocs.find(
        (p) => p.studentId?.toString() === sId && p.courseId?.toString() === cId
      );
      const totalL = lessonCountMap.get(cId) || 0;
      const compL = (pDoc?.completedLessons || []).length;
      const pct = calculateCourseProgressPercentage(compL, totalL);
      totalProgressSum += pct;

      const evalResult = evaluateStudentProgressStatus({
        completedLessonsCount: compL,
        totalPublishedLessons: totalL,
        enrolledAt: enr.enrolledAt,
        lastActivityDate: pDoc?.lastAccessedAt || enr.lastAccessedAt,
      });

      if (evalResult.needsAttention) {
        needsAttentionCount++;
      }
    });

    const averageProgressPct =
      enrollments.length > 0 ? Math.round(totalProgressSum / enrollments.length) : 0;

    // Count real published courses created by this mentor
    const activeCoursesCount = mentorCourses.filter((c) => c.status === 'published').length;

    // Count real total registered students in database
    const totalStudentsInSystem = await User.countDocuments({ role: 'student' });

    // Count real completed resume & portfolio analyses as recent activities
    const recentProfiles = await StudentProfile.find({})
      .populate('user', 'fullName name email')
      .sort({ updatedAt: -1 })
      .limit(5);

    const activities = recentProfiles.map((sp) => {
      const studentName = sp.user?.fullName || sp.user?.name || 'Student';
      const hasResume = sp.resumeAnalysis?.analyzedAt;
      const hasPortfolio = sp.portfolioAnalysis?.analyzedAt;
      let desc = 'Updated career profile';
      let iconType = 'User';

      if (hasResume && hasPortfolio) {
        desc = 'Completed AI Resume & Portfolio Analysis';
        iconType = 'FileText';
      } else if (hasResume) {
        desc = 'Submitted resume for AI analysis';
        iconType = 'FileText';
      } else if (hasPortfolio) {
        desc = 'Submitted portfolio link for review';
        iconType = 'PieChart';
      }

      return {
        id: sp._id,
        description: desc,
        studentName: studentName,
        timestamp: sp.updatedAt || new Date(),
        timeAgo: 'Recently',
        icon: iconType,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents: uniqueEnrolledStudentIds.size > 0 ? uniqueEnrolledStudentIds.size : totalStudentsInSystem,
          enrolledStudentsCount: uniqueEnrolledStudentIds.size,
          activeCourses: activeCoursesCount,
          upcomingSessions: 0,
          needsAttentionCount,
        },
        studentProgress: {
          avgProgress: averageProgressPct,
          percentage: averageProgressPct,
          guidedStudents: uniqueEnrolledStudentIds.size,
        },
        activities: activities,
        upcomingSessionsList: [],
      },
    });
  } catch (error) {
    console.error('Error fetching mentor dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve mentor dashboard statistics',
    });
  }
};

// @desc    Create a new text-based course
// @route   POST /api/mentor/courses
// @access  Private (Mentor)
export const createCourse = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);

    const {
      title,
      shortDescription,
      detailedDescription,
      description,
      thumbnail,
      category,
      skills,
      learningObjectives,
      prerequisites,
      difficulty,
      duration,
      language,
      priceType,
      price,
      lessons,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Course title is required',
      });
    }

    const shortDesc = (shortDescription || description || '').trim();
    const detailedDesc = (detailedDescription || description || '').trim();

    if (!shortDesc && !detailedDesc) {
      return res.status(400).json({
        success: false,
        message: 'Course description is required',
      });
    }

    const courseStatus = status && ['published', 'draft'].includes(status.toLowerCase())
      ? status.toLowerCase()
      : 'draft';

    const course = await Course.create({
      mentorId,
      title: title.trim(),
      shortDescription: shortDesc,
      detailedDescription: detailedDesc,
      description: detailedDesc || shortDesc,
      thumbnail: thumbnail || '',
      category: category || 'Software Development',
      skills: Array.isArray(skills) ? skills : [],
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [],
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      difficulty: difficulty || 'All Levels',
      duration: duration || '4 Weeks',
      language: language || 'English',
      priceType: priceType || 'Free',
      price: priceType === 'Paid' ? Math.max(0, Number(price) || 0) : 0,
      isPaid: priceType === 'Paid' && (Number(price) || 0) > 0,
      lessons: Array.isArray(lessons) ? lessons : [],
      status: courseStatus,
    });

    return res.status(201).json({
      success: true,
      message: `Course ${courseStatus === 'draft' ? 'saved as Draft' : 'published'} successfully`,
      data: { course },
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create course',
    });
  }
};

// @desc    Get all courses created by authenticated mentor
// @route   GET /api/mentor/courses
// @access  Private (Mentor)
export const getMentorCourses = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);
    const courses = await Course.find({ mentorId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { courses },
    });
  } catch (error) {
    console.error('Error fetching mentor courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve mentor courses',
    });
  }
};

// @desc    Get single course by ID (Mentor scope)
// @route   GET /api/mentor/courses/:id
// @access  Private (Mentor)
export const getCourseById = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);
    const course = await Course.findOne({ _id: req.params.id, mentorId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      data: { course },
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve course details',
    });
  }
};

// @desc    Update an existing course
// @route   PUT /api/mentor/courses/:id
// @access  Private (Mentor)
export const updateCourse = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);
    const course = await Course.findOne({ _id: req.params.id, mentorId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const {
      title,
      shortDescription,
      detailedDescription,
      description,
      thumbnail,
      category,
      skills,
      learningObjectives,
      prerequisites,
      difficulty,
      duration,
      language,
      priceType,
      price,
      lessons,
      status,
    } = req.body;

    if (title !== undefined) course.title = title.trim();
    if (shortDescription !== undefined || description !== undefined) {
      course.shortDescription = (shortDescription || description || '').trim();
    }
    if (detailedDescription !== undefined || description !== undefined) {
      course.detailedDescription = (detailedDescription || description || '').trim();
      course.description = (detailedDescription || description || '').trim();
    }
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (category !== undefined) course.category = category;
    if (skills !== undefined) course.skills = Array.isArray(skills) ? skills : [];
    if (learningObjectives !== undefined) {
      course.learningObjectives = Array.isArray(learningObjectives) ? learningObjectives : [];
    }
    if (prerequisites !== undefined) {
      course.prerequisites = Array.isArray(prerequisites) ? prerequisites : [];
    }
    if (difficulty !== undefined) course.difficulty = difficulty;
    if (duration !== undefined) course.duration = duration;
    if (language !== undefined) course.language = language;
    if (priceType !== undefined) course.priceType = priceType;
    if (price !== undefined) course.price = Math.max(0, Number(price) || 0);
    if (course.priceType === 'Free') course.price = 0;
    course.isPaid = course.priceType === 'Paid' && course.price > 0;
    if (lessons !== undefined) course.lessons = Array.isArray(lessons) ? lessons : [];
    if (status !== undefined && ['published', 'draft'].includes(status.toLowerCase())) {
      course.status = status.toLowerCase();
    }

    await course.save();

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course },
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update course',
    });
  }
};

// @desc    Toggle course published/draft status
// @route   PATCH /api/mentor/courses/:id/status
// @access  Private (Mentor)
export const toggleCourseStatus = async (req, res) => {
  try {
    const courseId = req.params.id || req.params.courseId;
    const mentorId = await resolveMentorId(req.user);
    const course = await Course.findOne({ _id: courseId, mentorId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const { status } = req.body || {};
    if (status && ['published', 'draft'].includes(status.toLowerCase())) {
      course.status = status.toLowerCase();
    } else {
      course.status = course.status === 'published' ? 'draft' : 'published';
    }

    await course.save();

    return res.status(200).json({
      success: true,
      message: `Course status updated to ${course.status}`,
      data: { course, status: course.status },
    });
  } catch (error) {
    console.error('Error toggling course status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update course status',
    });
  }
};

// @desc    Delete a course
// @route   DELETE /api/mentor/courses/:id
// @access  Private (Mentor)
export const deleteCourse = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);
    const course = await Course.findOneAndDelete({ _id: req.params.id, mentorId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    // Also remove any modules associated with deleted course
    await CourseModule.deleteMany({ courseId: req.params.id });

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete course',
    });
  }
};

// ================= COURSE MODULE CONTROLLERS =================

// Helper to verify course ownership for authenticated mentor
const verifyCourseOwnership = async (courseId, user) => {
  const mentorId = await resolveMentorId(user);
  const course = await Course.findOne({ _id: courseId, mentorId });
  if (!course) {
    return null;
  }
  return course;
};

// @desc    Get all modules for a specific course
// @route   GET /api/mentor/courses/:courseId/modules
// @access  Private (Mentor)
export const getCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const modules = await CourseModule.find({ courseId }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      data: {
        courseTitle: course.title,
        modules,
      },
    });
  } catch (error) {
    console.error('Error fetching course modules:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve course modules',
    });
  }
};

// @desc    Add a new module to a course
// @route   POST /api/mentor/courses/:courseId/modules
// @access  Private (Mentor)
export const addCourseModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const { title, description, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Module title is required',
      });
    }

    let moduleOrder = Number(order);
    if (isNaN(moduleOrder) || moduleOrder <= 0) {
      const highestModule = await CourseModule.findOne({ courseId }).sort({ order: -1 });
      moduleOrder = highestModule ? highestModule.order + 1 : 1;
    }

    const moduleItem = await CourseModule.create({
      courseId,
      title: title.trim(),
      description: (description || '').trim(),
      order: moduleOrder,
    });

    return res.status(201).json({
      success: true,
      message: 'Module added successfully',
      data: { module: moduleItem },
    });
  } catch (error) {
    console.error('Error adding course module:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add module',
    });
  }
};

// @desc    Update a course module
// @route   PUT /api/mentor/courses/:courseId/modules/:moduleId
// @access  Private (Mentor)
export const updateCourseModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const moduleItem = await CourseModule.findOne({ _id: moduleId, courseId });
    if (!moduleItem) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    const { title, description, order } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Module title cannot be empty',
        });
      }
      moduleItem.title = title.trim();
    }
    if (description !== undefined) {
      moduleItem.description = description.trim();
    }
    if (order !== undefined && !isNaN(Number(order))) {
      moduleItem.order = Number(order);
    }

    await moduleItem.save();

    return res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: { module: moduleItem },
    });
  } catch (error) {
    console.error('Error updating course module:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update module',
    });
  }
};

// @desc    Delete a course module
// @route   DELETE /api/mentor/courses/:courseId/modules/:moduleId
// @access  Private (Mentor)
export const deleteCourseModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const deletedModule = await CourseModule.findOneAndDelete({ _id: moduleId, courseId });
    if (!deletedModule) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    // Also delete any lessons associated with this deleted module
    await CourseLesson.deleteMany({ courseId, moduleId });

    // Re-index remaining modules for order consistency
    const remainingModules = await CourseModule.find({ courseId }).sort({ order: 1 });
    for (let i = 0; i < remainingModules.length; i++) {
      remainingModules[i].order = i + 1;
      await remainingModules[i].save();
    }

    return res.status(200).json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course module:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete module',
    });
  }
};

// ================= COURSE LESSON CONTROLLERS =================

// @desc    Get all lessons for a specific course module
// @route   GET /api/mentor/courses/:courseId/modules/:moduleId/lessons
// @access  Private (Mentor)
export const getModuleLessons = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const lessons = await CourseLesson.find({ courseId, moduleId }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      data: { lessons },
    });
  } catch (error) {
    console.error('Error fetching module lessons:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve module lessons',
    });
  }
};

// @desc    Add a new text-based lesson to a course module
// @route   POST /api/mentor/courses/:courseId/modules/:moduleId/lessons
// @access  Private (Mentor)
export const addModuleLesson = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const { title, content, duration, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Lesson title is required',
      });
    }

    let lessonOrder = Number(order);
    if (isNaN(lessonOrder) || lessonOrder <= 0) {
      const highestLesson = await CourseLesson.findOne({ courseId, moduleId }).sort({ order: -1 });
      lessonOrder = highestLesson ? highestLesson.order + 1 : 1;
    }

    const lesson = await CourseLesson.create({
      courseId,
      moduleId,
      title: title.trim(),
      content: content || '',
      duration: (duration || '10 min').trim(),
      order: lessonOrder,
    });

    return res.status(201).json({
      success: true,
      message: 'Lesson added successfully',
      data: { lesson },
    });
  } catch (error) {
    console.error('Error adding module lesson:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add lesson',
    });
  }
};

// @desc    Update a text-based lesson in a course module
// @route   PUT /api/mentor/courses/:courseId/modules/:moduleId/lessons/:lessonId
// @access  Private (Mentor)
export const updateModuleLesson = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const lesson = await CourseLesson.findOne({ _id: lessonId, courseId, moduleId });
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    const { title, content, duration, order } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Lesson title cannot be empty',
        });
      }
      lesson.title = title.trim();
    }
    if (content !== undefined) {
      lesson.content = content;
    }
    if (duration !== undefined) {
      lesson.duration = duration.trim();
    }
    if (order !== undefined && !isNaN(Number(order))) {
      lesson.order = Number(order);
    }

    await lesson.save();

    return res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: { lesson },
    });
  } catch (error) {
    console.error('Error updating module lesson:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update lesson',
    });
  }
};

// @desc    Delete a lesson from a course module
// @route   DELETE /api/mentor/courses/:courseId/modules/:moduleId/lessons/:lessonId
// @access  Private (Mentor)
export const deleteModuleLesson = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const deletedLesson = await CourseLesson.findOneAndDelete({ _id: lessonId, courseId, moduleId });
    if (!deletedLesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    // Re-index remaining lessons for order consistency
    const remainingLessons = await CourseLesson.find({ courseId, moduleId }).sort({ order: 1 });
    for (let i = 0; i < remainingLessons.length; i++) {
      remainingLessons[i].order = i + 1;
      await remainingLessons[i].save();
    }

    return res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting module lesson:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete lesson',
    });
  }
};

// @desc    Reorder multiple lessons in a course module
// @route   PUT /api/mentor/courses/:courseId/modules/:moduleId/lessons/reorder
// @access  Private (Mentor)
export const reorderModuleLessons = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const { lessons } = req.body;
    if (!Array.isArray(lessons)) {
      return res.status(400).json({
        success: false,
        message: 'Lessons order payload must be an array',
      });
    }

    for (let i = 0; i < lessons.length; i++) {
      const item = lessons[i];
      const lesId = typeof item === 'object' ? item._id || item.id : item;
      const newOrder = typeof item === 'object' && item.order !== undefined ? item.order : i + 1;

      if (lesId) {
        await CourseLesson.updateOne(
          { _id: lesId, courseId, moduleId },
          { $set: { order: newOrder } }
        );
      }
    }

    const updatedLessons = await CourseLesson.find({ courseId, moduleId }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      message: 'Lessons reordered successfully',
      data: { lessons: updatedLessons },
    });
  } catch (error) {
    console.error('Error reordering module lessons:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reorder module lessons',
    });
  }
};

// @desc    Reorder multiple modules in a course
// @route   PUT /api/mentor/courses/:courseId/modules/reorder
// @access  Private (Mentor)
export const reorderCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const { modules } = req.body;
    if (!Array.isArray(modules)) {
      return res.status(400).json({
        success: false,
        message: 'Modules order payload must be an array',
      });
    }

    for (let i = 0; i < modules.length; i++) {
      const item = modules[i];
      const modId = typeof item === 'object' ? item._id || item.id : item;
      const newOrder = typeof item === 'object' && item.order !== undefined ? item.order : i + 1;

      if (modId) {
        await CourseModule.updateOne(
          { _id: modId, courseId },
          { $set: { order: newOrder } }
        );
      }
    }

    const updatedModules = await CourseModule.find({ courseId }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      message: 'Modules reordered successfully',
      data: { modules: updatedModules },
    });
  } catch (error) {
    console.error('Error reordering course modules:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reorder course modules',
    });
  }
};

// ================= COURSE PDF RESOURCE CONTROLLERS =================

// @desc    Get all PDF resources for a specific course
// @route   GET /api/mentor/courses/:courseId/pdf-resources
// @access  Private (Mentor)
export const getCoursePDFResources = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const pdfResources = await CoursePDFResource.find({ courseId })
      .populate('moduleId', 'title')
      .populate('lessonId', 'title')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { pdfResources },
    });
  } catch (error) {
    console.error('Error fetching PDF resources:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve PDF resources',
    });
  }
};

// @desc    Upload a new PDF learning resource
// @route   POST /api/mentor/courses/:courseId/pdf-resources
// @access  Private (Mentor)
export const uploadCoursePDFResource = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const { title, description, moduleId, lessonId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'PDF title is required',
      });
    }

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Module selection is required',
      });
    }

    // Verify module belongs to course
    const moduleItem = await CourseModule.findOne({ _id: moduleId, courseId });
    if (!moduleItem) {
      return res.status(400).json({
        success: false,
        message: 'Selected module does not belong to this course',
      });
    }

    // Optionally verify lesson belongs to module and course
    let targetLessonId = null;
    if (lessonId && lessonId !== 'none' && lessonId !== '') {
      const lessonItem = await CourseLesson.findOne({ _id: lessonId, moduleId, courseId });
      if (!lessonItem) {
        return res.status(400).json({
          success: false,
          message: 'Selected lesson does not belong to this module',
        });
      }
      targetLessonId = lessonItem._id;
    }

    let filePath = '';
    let originalName = '';
    let fileSize = 0;
    let fileBase64 = '';

    if (req.file) {
      filePath = req.file.path || `uploads/pdf_resources/${req.file.filename || req.file.originalname}`;
      originalName = req.file.originalname;
      fileSize = req.file.size;
      if (req.file.buffer) {
        fileBase64 = req.file.buffer.toString('base64');
      }
    } else if (req.body.pdfBase64 && req.body.originalName) {
      originalName = req.body.originalName;
      fileBase64 = req.body.pdfBase64;
      fileSize = Math.round((fileBase64.length * 3) / 4);
      filePath = `virtual_storage/${Date.now()}_${originalName}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required for upload',
      });
    }

    const pdfResource = await CoursePDFResource.create({
      courseId,
      moduleId,
      lessonId: targetLessonId,
      mentorId: course.mentorId,
      title: title.trim(),
      description: (description || '').trim(),
      filePath,
      originalName,
      fileSize,
      fileData: fileBase64,
    });

    const populatedResource = await CoursePDFResource.findById(pdfResource._id)
      .populate('moduleId', 'title')
      .populate('lessonId', 'title');

    return res.status(201).json({
      success: true,
      message: 'PDF learning resource uploaded successfully',
      data: { pdfResource: populatedResource },
    });
  } catch (error) {
    console.error('Error uploading PDF resource:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload PDF resource',
    });
  }
};

// @desc    Update / Replace a PDF resource
// @route   PUT /api/mentor/courses/:courseId/pdf-resources/:resourceId
// @access  Private (Mentor)
export const updateCoursePDFResource = async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const pdfResource = await CoursePDFResource.findOne({ _id: resourceId, courseId });
    if (!pdfResource) {
      return res.status(404).json({
        success: false,
        message: 'PDF resource not found',
      });
    }

    const { title, description, moduleId, lessonId } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'PDF title cannot be empty',
        });
      }
      pdfResource.title = title.trim();
    }

    if (description !== undefined) {
      pdfResource.description = description.trim();
    }

    if (moduleId !== undefined) {
      const moduleItem = await CourseModule.findOne({ _id: moduleId, courseId });
      if (!moduleItem) {
        return res.status(400).json({
          success: false,
          message: 'Selected module does not belong to this course',
        });
      }
      pdfResource.moduleId = moduleId;
    }

    if (lessonId !== undefined) {
      if (!lessonId || lessonId === 'none' || lessonId === '') {
        pdfResource.lessonId = null;
      } else {
        const lessonItem = await CourseLesson.findOne({
          _id: lessonId,
          moduleId: pdfResource.moduleId,
          courseId,
        });
        if (!lessonItem) {
          return res.status(400).json({
            success: false,
            message: 'Selected lesson does not belong to this module',
          });
        }
        pdfResource.lessonId = lessonId;
      }
    }

    // Replace PDF File if uploaded
    if (req.file) {
      pdfResource.filePath = req.file.path || `uploads/pdf_resources/${req.file.filename || req.file.originalname}`;
      pdfResource.originalName = req.file.originalname;
      pdfResource.fileSize = req.file.size;
      if (req.file.buffer) {
        pdfResource.fileData = req.file.buffer.toString('base64');
      }
    } else if (req.body.pdfBase64 && req.body.originalName) {
      pdfResource.originalName = req.body.originalName;
      pdfResource.fileData = req.body.pdfBase64;
      pdfResource.fileSize = Math.round((req.body.pdfBase64.length * 3) / 4);
      pdfResource.filePath = `virtual_storage/${Date.now()}_${req.body.originalName}`;
    }

    await pdfResource.save();

    const populatedResource = await CoursePDFResource.findById(pdfResource._id)
      .populate('moduleId', 'title')
      .populate('lessonId', 'title');

    return res.status(200).json({
      success: true,
      message: 'PDF resource updated successfully',
      data: { pdfResource: populatedResource },
    });
  } catch (error) {
    console.error('Error updating PDF resource:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update PDF resource',
    });
  }
};

// @desc    Delete a PDF resource
// @route   DELETE /api/mentor/courses/:courseId/pdf-resources/:resourceId
// @access  Private (Mentor)
export const deleteCoursePDFResource = async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const deletedResource = await CoursePDFResource.findOneAndDelete({ _id: resourceId, courseId });
    if (!deletedResource) {
      return res.status(404).json({
        success: false,
        message: 'PDF resource not found',
      });
    }

    if (deletedResource.filePath && fs.existsSync(deletedResource.filePath)) {
      try {
        fs.unlinkSync(deletedResource.filePath);
      } catch (e) {
        console.warn('Could not delete physical PDF file:', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'PDF resource deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting PDF resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete PDF resource',
    });
  }
};

// @desc    Securely stream / serve PDF resource to authenticated mentor
// @route   GET /api/mentor/courses/:courseId/pdf-resources/:resourceId/stream
// @access  Private (Mentor)
export const streamCoursePDFResource = async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const pdfResource = await CoursePDFResource.findOne({ _id: resourceId, courseId }).select('+fileData');
    if (!pdfResource) {
      return res.status(404).json({
        success: false,
        message: 'PDF resource not found',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(pdfResource.originalName)}"`);

    if (pdfResource.filePath && fs.existsSync(pdfResource.filePath)) {
      const stream = fs.createReadStream(pdfResource.filePath);
      return stream.pipe(res);
    } else if (pdfResource.fileData) {
      const buffer = Buffer.from(pdfResource.fileData, 'base64');
      return res.send(buffer);
    } else {
      return res.status(404).json({
        success: false,
        message: 'PDF file content is unavailable',
      });
    }
  } catch (error) {
    console.error('Error streaming PDF resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to stream PDF resource',
    });
  }
};

// ================= COURSE TEXT RESOURCE CONTROLLERS =================

// @desc    Get all text resources for a course
// @route   GET /api/mentor/courses/:courseId/text-resources
// @access  Private (Mentor)
export const getCourseTextResources = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const resources = await CourseTextResource.find({ courseId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: resources,
    });
  } catch (error) {
    console.error('Error fetching text resources:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch text resources',
    });
  }
};

// @desc    Add a text resource (article, docs, practice, reference, note)
// @route   POST /api/mentor/courses/:courseId/text-resources
// @access  Private (Mentor)
export const addCourseTextResource = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const { title, description, type, url, content, moduleId, lessonId } = req.body;

    if (!title || !type || !moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Title, resource type, and module selection are required',
      });
    }

    const mentorId = await resolveMentorId(req.user);

    const resource = await CourseTextResource.create({
      courseId,
      moduleId,
      lessonId: lessonId || null,
      mentorId,
      title,
      description: description || '',
      type,
      url: url || '',
      content: content || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Text resource created successfully',
      data: resource,
    });
  } catch (error) {
    console.error('Error adding text resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add text resource',
    });
  }
};

// @desc    Update a text resource
// @route   PUT /api/mentor/courses/:courseId/text-resources/:resourceId
// @access  Private (Mentor)
export const updateCourseTextResource = async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const { title, description, type, url, content, moduleId, lessonId } = req.body;

    const resource = await CourseTextResource.findOne({ _id: resourceId, courseId });
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Text resource not found',
      });
    }

    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type !== undefined) resource.type = type;
    if (url !== undefined) resource.url = url;
    if (content !== undefined) resource.content = content;
    if (moduleId !== undefined) resource.moduleId = moduleId;
    if (lessonId !== undefined) resource.lessonId = lessonId || null;

    await resource.save();

    return res.status(200).json({
      success: true,
      message: 'Text resource updated successfully',
      data: resource,
    });
  } catch (error) {
    console.error('Error updating text resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update text resource',
    });
  }
};

// @desc    Delete a text resource
// @route   DELETE /api/mentor/courses/:courseId/text-resources/:resourceId
// @access  Private (Mentor)
export const deleteCourseTextResource = async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const deletedResource = await CourseTextResource.findOneAndDelete({ _id: resourceId, courseId });
    if (!deletedResource) {
      return res.status(404).json({
        success: false,
        message: 'Text resource not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Text resource deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting text resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete text resource',
    });
  }
};

// ================= COURSE QUIZ CONTROLLERS =================

// @desc    Get all quizzes for a mentor's course
// @route   GET /api/mentor/courses/:courseId/quizzes
// @access  Private (Mentor)
export const getCourseQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const quizzes = await CourseQuiz.find({ courseId })
      .populate('moduleId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    console.error('Error fetching course quizzes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course quizzes',
    });
  }
};

// @desc    Create a new course quiz
// @route   POST /api/mentor/courses/:courseId/quizzes
// @access  Private (Mentor)
export const createCourseQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const { title, description, moduleId, status, questions } = req.body;

    if (!title || !moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title and target module are required',
      });
    }

    const mentorId = await resolveMentorId(req.user);

    const quiz = await CourseQuiz.create({
      courseId,
      moduleId,
      mentorId,
      title,
      description: description || '',
      status: status || 'draft',
      questions: Array.isArray(questions) ? questions : [],
    });

    return res.status(201).json({
      success: true,
      message: 'Course quiz created successfully',
      data: quiz,
    });
  } catch (error) {
    console.error('Error creating course quiz:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create course quiz',
    });
  }
};

// @desc    Update a course quiz (metadata, status, questions)
// @route   PUT /api/mentor/courses/:courseId/quizzes/:quizId
// @access  Private (Mentor)
export const updateCourseQuiz = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const quiz = await CourseQuiz.findOne({ _id: quizId, courseId });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    const { title, description, moduleId, status, questions } = req.body;

    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (moduleId !== undefined) quiz.moduleId = moduleId;
    if (status !== undefined) quiz.status = status;
    if (questions !== undefined && Array.isArray(questions)) quiz.questions = questions;

    await quiz.save();

    return res.status(200).json({
      success: true,
      message: 'Course quiz updated successfully',
      data: quiz,
    });
  } catch (error) {
    console.error('Error updating course quiz:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update course quiz',
    });
  }
};

// @desc    Delete a course quiz
// @route   DELETE /api/mentor/courses/:courseId/quizzes/:quizId
// @access  Private (Mentor)
export const deleteCourseQuiz = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const deletedQuiz = await CourseQuiz.findOneAndDelete({ _id: quizId, courseId });
    if (!deletedQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Also remove associated attempts
    await CourseQuizAttempt.deleteMany({ quizId });

    return res.status(200).json({
      success: true,
      message: 'Course quiz deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course quiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete course quiz',
    });
  }
};

// ================= COURSE PREVIEW & PUBLISH CONTROLLERS =================

// @desc    Get complete course structure for mentor preview (Modules, Lessons, PDFs, Text Resources, Quizzes)
// @route   GET /api/mentor/courses/:courseId/preview
// @access  Private (Mentor)
export const getMentorCoursePreview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await verifyCourseOwnership(courseId, req.user);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied',
      });
    }

    const mentorProfile = await Mentor.findById(course.mentorId)
      .select('fullName name email profilePhoto bio designation title professionalTitle company')
      .lean();

    const modules = await CourseModule.find({ courseId }).sort({ order: 1 }).lean();

    const enrichedModules = await Promise.all(
      modules.map(async (modItem) => {
        const lessons = await CourseLesson.find({ courseId, moduleId: modItem._id }).sort({ order: 1 }).lean();
        const pdfResources = await CoursePDFResource.find({ courseId, moduleId: modItem._id }).sort({ createdAt: -1 }).lean();
        const textResources = await CourseTextResource.find({ courseId, moduleId: modItem._id }).sort({ createdAt: -1 }).lean();
        const quizzes = await CourseQuiz.find({ courseId, moduleId: modItem._id }).sort({ createdAt: -1 }).lean();

        return {
          ...modItem,
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
        ...course.toObject(),
        mentorId: mentorProfile || course.mentorId,
        modules: enrichedModules,
      },
    });
  } catch (error) {
    console.error('Error fetching course preview for mentor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate course preview',
    });
  }
};

// @desc    Get all student enrollments across mentor's courses
// @route   GET /api/mentor/enrollments
// @access  Private (Mentor)
export const getMentorCourseEnrollments = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);

    // Fetch all courses created by this mentor
    const mentorCourses = await Course.find({ mentorId }).lean();
    const mentorCourseIds = mentorCourses.map((c) => c._id);

    if (mentorCourseIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          enrollments: [],
          stats: {
            totalEnrollments: 0,
            uniqueStudentsCount: 0,
            courseBreakdown: [],
          },
        },
      });
    }

    // Query CourseEnrollment for mentor's courses
    const rawEnrollments = await CourseEnrollment.find({ courseId: { $in: mentorCourseIds } })
      .populate('studentId', 'fullName name email role profilePhoto phone')
      .populate('courseId', 'title category thumbnail difficulty status price estimatedDuration')
      .sort({ lastAccessedAt: -1, createdAt: -1 })
      .lean();

    // Enrich each enrollment with student profile details and progress stats
    const enrichedEnrollments = await Promise.all(
      rawEnrollments.map(async (enr) => {
        if (!enr.studentId || !enr.courseId) return null;

        const studentUserId = enr.studentId._id;
        const targetCourseId = enr.courseId._id;

        // Fetch Student Profile
        const studentProfile = await StudentProfile.findOne({ user: studentUserId })
          .select('phone profilePhoto college degree specialization graduationYear targetCareer preferredJobRole technicalSkills')
          .lean();

        // Fetch Student Progress Document
        const progressDoc = await CourseProgress.findOne({ studentId: studentUserId, courseId: targetCourseId }).lean();

        // Fetch course modules for progress calculation
        const modules = await CourseModule.find({ courseId: targetCourseId }).lean();

        let totalTrackedItems = 0;
        let completedItemsCount = 0;
        const completedLessonSet = new Set((progressDoc?.completedLessons || []).map((id) => id.toString()));
        const completedPDFSet = new Set((progressDoc?.completedPDFs || []).map((id) => id.toString()));
        const completedResourceSet = new Set((progressDoc?.completedResources || []).map((id) => id.toString()));
        const completedAssignmentMap = new Map(
          (progressDoc?.completedAssignments || []).map((a) => [a.resourceId?.toString(), a])
        );

        if (modules && Array.isArray(modules)) {
          for (const mod of modules) {
            const lessons = await CourseLesson.find({ courseId: targetCourseId, moduleId: mod._id }).lean();
            const pdfs = await CoursePDFResource.find({ courseId: targetCourseId, moduleId: mod._id }).lean();
            const textRes = await CourseTextResource.find({ courseId: targetCourseId, moduleId: mod._id }).lean();

            lessons.forEach((les) => {
              totalTrackedItems++;
              if (completedLessonSet.has(les._id.toString())) completedItemsCount++;
            });
            pdfs.forEach((pdf) => {
              totalTrackedItems++;
              if (completedPDFSet.has(pdf._id.toString())) completedItemsCount++;
            });
            textRes.forEach((resItem) => {
              totalTrackedItems++;
              if (resItem.type === 'assignment') {
                if (completedAssignmentMap.has(resItem._id.toString())) completedItemsCount++;
              } else {
                if (completedResourceSet.has(resItem._id.toString())) completedItemsCount++;
              }
            });
          }
        }

        const percentage = totalTrackedItems > 0 ? Math.round((completedItemsCount / totalTrackedItems) * 100) : 0;
        const studentName = enr.studentId.fullName || enr.studentId.name || 'Student';

        return {
          _id: enr._id,
          enrolledAt: enr.enrolledAt,
          lastAccessedAt: enr.lastAccessedAt,
          status: enr.status,
          student: {
            _id: studentUserId,
            name: studentName,
            email: enr.studentId.email,
            phone: studentProfile?.phone || enr.studentId.phone || 'N/A',
            profilePhoto: studentProfile?.profilePhoto || enr.studentId.profilePhoto || '',
            college: studentProfile?.college || 'N/A',
            degree: studentProfile?.degree || '',
            specialization: studentProfile?.specialization || '',
            graduationYear: studentProfile?.graduationYear || '',
            targetCareer: studentProfile?.targetCareer || studentProfile?.preferredJobRole || 'Software Engineer',
            technicalSkills: studentProfile?.technicalSkills || [],
          },
          course: {
            _id: targetCourseId,
            title: enr.courseId.title,
            category: enr.courseId.category,
            thumbnail: enr.courseId.thumbnail,
            difficulty: enr.courseId.difficulty,
            status: enr.courseId.status,
          },
          progressStats: {
            totalTrackedItems,
            completedItemsCount,
            percentage,
          },
        };
      })
    );

    const validEnrollments = enrichedEnrollments.filter((item) => item !== null);

    // Calculate unique student count
    const uniqueStudentIds = new Set(validEnrollments.map((e) => e.student._id.toString()));

    // Calculate course breakdown
    const breakdownMap = {};
    validEnrollments.forEach((e) => {
      const cId = e.course._id.toString();
      if (!breakdownMap[cId]) {
        breakdownMap[cId] = {
          courseId: cId,
          courseTitle: e.course.title,
          category: e.course.category,
          count: 0,
        };
      }
      breakdownMap[cId].count++;
    });

    return res.status(200).json({
      success: true,
      data: {
        enrollments: validEnrollments,
        stats: {
          totalEnrollments: validEnrollments.length,
          uniqueStudentsCount: uniqueStudentIds.size,
          courseBreakdown: Object.values(breakdownMap),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching mentor course enrollments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course enrollments for mentor',
    });
  }
};

// @desc    Get detailed student progress data for courses created by authenticated mentor
// @route   GET /api/mentor/student-progress
// @access  Private (Mentor)
export const getMentorStudentProgress = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);

    // Fetch all courses created by this mentor
    const mentorCourses = await Course.find({
      $or: [
        { mentorId: mentorId },
        { mentorId: req.user._id },
      ],
    }).select('title category thumbnail difficulty status').lean();

    const mentorCourseIds = mentorCourses.map((c) => c._id);

    if (mentorCourseIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          studentProgressList: [],
          mentorCourses: [],
          stats: {
            totalEnrolledStudents: 0,
            activeStudents: 0,
            completedCourses: 0,
            averageProgress: 0,
          },
        },
      });
    }

    // Query CourseEnrollment for mentor's courses
    const rawEnrollments = await CourseEnrollment.find({ courseId: { $in: mentorCourseIds } })
      .populate('studentId', 'fullName name email role avatar profilePhoto phone')
      .populate('courseId', 'title category thumbnail difficulty status duration')
      .sort({ lastAccessedAt: -1, createdAt: -1 })
      .lean();

    // Enrich each enrollment with detailed progress, quizzes, assignments, and timeline
    const studentProgressList = await Promise.all(
      rawEnrollments.map(async (enr) => {
        if (!enr.studentId || !enr.courseId) return null;

        const studentUserId = enr.studentId._id;
        const targetCourseId = enr.courseId._id;

        // Fetch Student Profile
        const studentProfile = await StudentProfile.findOne({ user: studentUserId })
          .select('phone profilePhoto college degree specialization graduationYear targetCareer preferredJobRole technicalSkills')
          .lean();

        // Fetch Course Modules, Lessons, Text Resources (including assignments), PDF Resources, and Quizzes
        const modules = await CourseModule.find({ courseId: targetCourseId }).sort({ order: 1 }).lean();
        const lessons = await CourseLesson.find({ courseId: targetCourseId }).sort({ order: 1 }).lean();
        const textResources = await CourseTextResource.find({ courseId: targetCourseId }).lean();
        const pdfResources = await CoursePDFResource.find({ courseId: targetCourseId }).lean();
        const quizzes = await CourseQuiz.find({ courseId: targetCourseId }).lean();

        // Fetch Student Progress Document
        const progressDoc = await CourseProgress.findOne({ studentId: studentUserId, courseId: targetCourseId }).lean();

        // Fetch Quiz Attempts for this student and course
        const quizAttempts = await CourseQuizAttempt.find({ courseId: targetCourseId, studentId: studentUserId })
          .sort({ completedAt: -1 })
          .lean();

        // Sets and Maps for progress evaluation
        const completedLessonSet = new Set((progressDoc?.completedLessons || []).map((id) => id.toString()));
        const completedPDFSet = new Set((progressDoc?.completedPDFs || []).map((id) => id.toString()));
        const completedResourceSet = new Set((progressDoc?.completedResources || []).map((id) => id.toString()));
        const completedQuizSet = new Set((progressDoc?.completedQuizzes || []).map((id) => id.toString()));
        const completedAssignmentMap = new Map(
          (progressDoc?.completedAssignments || []).map((a) => [a.resourceId?.toString(), a])
        );

        // Build detailed Lessons list with completed status
        const moduleMap = new Map((modules || []).map((m) => [m._id.toString(), m.title]));
        const lessonsDetailList = lessons.map((les) => {
          const isCompleted = completedLessonSet.has(les._id.toString());
          return {
            _id: les._id,
            title: les.title,
            duration: les.duration || '10 min',
            moduleTitle: moduleMap.get(les.moduleId?.toString()) || 'General',
            isCompleted,
          };
        });

        const completedLessonsCount = lessonsDetailList.filter((l) => l.isCompleted).length;
        const pendingLessonsCount = lessonsDetailList.length - completedLessonsCount;

        // Build Quizzes & Scores details
        const quizDetailList = quizzes.map((qz) => {
          const attempts = quizAttempts.filter((a) => a.quizId?.toString() === qz._id.toString());
          const hasAttempted = attempts.length > 0 || completedQuizSet.has(qz._id.toString());
          let bestAttempt = null;
          if (attempts.length > 0) {
            bestAttempt = attempts.reduce((prev, curr) =>
              (curr.percentage || 0) > (prev.percentage || 0) ? curr : prev
            );
          }

          return {
            _id: qz._id,
            title: qz.title || 'Quiz',
            totalQuestions: qz.questions ? qz.questions.length : 0,
            attemptsCount: attempts.length,
            isCompleted: hasAttempted,
            score: bestAttempt ? bestAttempt.totalScore : 0,
            maxScore: bestAttempt ? bestAttempt.maxScore : 0,
            percentage: bestAttempt ? Math.round(bestAttempt.percentage) : 0,
            lastAttemptedAt: bestAttempt ? bestAttempt.completedAt : attempts[0]?.completedAt || null,
          };
        });

        // Calculate Average Quiz Score %
        const attemptedQuizzes = quizDetailList.filter((q) => q.attemptsCount > 0);
        const avgQuizScorePct =
          attemptedQuizzes.length > 0
            ? Math.round(
                attemptedQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / attemptedQuizzes.length
              )
            : null;

        // Build Assignment Details
        const assignmentResources = textResources.filter((res) => res.type === 'assignment');
        const assignmentDetailList = assignmentResources.map((asg) => {
          const submission = completedAssignmentMap.get(asg._id.toString());
          return {
            _id: asg._id,
            title: asg.title,
            content: asg.content || '',
            moduleTitle: moduleMap.get(asg.moduleId?.toString()) || 'Assignment',
            isSubmitted: !!submission,
            submissionText: submission?.submissionText || '',
            submissionUrl: submission?.submissionUrl || '',
            submittedAt: submission?.completedAt || null,
            status: submission ? 'Submitted' : 'Pending',
          };
        });

        const submittedAssignmentsCount = assignmentDetailList.filter((a) => a.isSubmitted).length;
        const assignmentStatusText =
          assignmentDetailList.length === 0
            ? 'No Assignments'
            : `${submittedAssignmentsCount}/${assignmentDetailList.length} Submitted`;

        // Total Tracked Items Calculation
        let totalTrackedItems = lessons.length + pdfResources.length + textResources.length + quizzes.length;
        let completedItemsCount = 0;

        lessons.forEach((les) => {
          if (completedLessonSet.has(les._id.toString())) completedItemsCount++;
        });
        pdfResources.forEach((pdf) => {
          if (completedPDFSet.has(pdf._id.toString())) completedItemsCount++;
        });
        textResources.forEach((resItem) => {
          if (resItem.type === 'assignment') {
            if (completedAssignmentMap.has(resItem._id.toString())) completedItemsCount++;
          } else {
            if (completedResourceSet.has(resItem._id.toString())) completedItemsCount++;
          }
        });
        quizzes.forEach((qz) => {
          if (completedQuizSet.has(qz._id.toString()) || quizAttempts.some((a) => a.quizId?.toString() === qz._id.toString())) {
            completedItemsCount++;
          }
        });

        // Calculate Lesson Completion Progress using formula:
        // Course Progress (%) = (Number of Completed Lessons / Total Published Lessons) * 100
        const courseProgressPct = calculateCourseProgressPercentage(completedLessonsCount, lessons.length);

        // Determine Last Activity Date
        const datesArray = [
          enr.lastAccessedAt,
          enr.updatedAt,
          enr.enrolledAt,
          progressDoc?.lastAccessedAt,
          progressDoc?.updatedAt,
          ...quizAttempts.map((q) => q.completedAt),
          ...assignmentDetailList.map((a) => a.submittedAt).filter(Boolean),
        ].filter(Boolean);

        const lastActivity = datesArray.length > 0 ? new Date(Math.max(...datesArray.map((d) => new Date(d)))) : enr.enrolledAt;

        // Evaluate Student Progress Status with Configurable Rules
        const statusEvaluation = evaluateStudentProgressStatus({
          completedLessonsCount,
          totalPublishedLessons: lessons.length,
          enrolledAt: enr.enrolledAt,
          lastActivityDate: lastActivity,
          avgQuizScorePct,
          submittedAssignmentsCount,
          totalAssignmentsCount: assignmentDetailList.length,
        });

        // Modules Completion List
        const completedModulesList = modules.map((m) => {
          const isCompleted = (progressDoc?.completedModules || []).some(
            (cmId) => cmId.toString() === m._id.toString()
          );
          return {
            _id: m._id,
            title: m.title,
            order: m.order,
            isCompleted,
          };
        });

        // Separate Completed & Pending Lessons
        const completedLessons = lessonsDetailList.filter((l) => l.isCompleted);
        const pendingLessons = lessonsDetailList.filter((l) => !l.isCompleted);

        // Fetch Message History between mentor and student for this course
        const messageHistory = await Message.find({
          courseId: targetCourseId,
          $or: [
            { senderId: req.user._id, recipientId: studentUserId },
            { senderId: studentUserId, recipientId: req.user._id },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        // Build Chronological Progress Timeline
        const timelineEvents = [];

        if (enr.enrolledAt) {
          timelineEvents.push({
            id: `enr-${enr._id}`,
            type: 'enrolled',
            title: `Enrolled in ${enr.courseId.title}`,
            description: `Started learning path`,
            timestamp: enr.enrolledAt,
            statusColor: 'blue',
          });
        }

        lessonsDetailList.forEach((les) => {
          if (les.isCompleted) {
            timelineEvents.push({
              id: `les-${les._id}`,
              type: 'lesson',
              title: `Completed Lesson: ${les.title}`,
              description: `Module: ${les.moduleTitle}`,
              timestamp: progressDoc?.updatedAt || lastActivity,
              statusColor: 'green',
            });
          }
        });

        quizAttempts.forEach((qa) => {
          const qzTitle = quizzes.find((q) => q._id.toString() === qa.quizId?.toString())?.title || 'Quiz';
          timelineEvents.push({
            id: `qa-${qa._id}`,
            type: 'quiz',
            title: `Completed Quiz: ${qzTitle}`,
            description: `Score: ${qa.totalScore}/${qa.maxScore} (${Math.round(qa.percentage)}%)`,
            timestamp: qa.completedAt || qa.createdAt,
            statusColor: qa.percentage >= 70 ? 'green' : 'amber',
          });
        });

        assignmentDetailList.forEach((asg) => {
          if (asg.isSubmitted) {
            timelineEvents.push({
              id: `asg-${asg._id}`,
              type: 'assignment',
              title: `Submitted Assignment: ${asg.title}`,
              description: asg.submissionText ? `Answer: ${asg.submissionText.substring(0, 60)}...` : 'File submitted',
              timestamp: asg.submittedAt || lastActivity,
              statusColor: 'purple',
            });
          }
        });

        if (courseProgressPct === 100 || enr.status === 'completed') {
          timelineEvents.push({
            id: `comp-${enr._id}`,
            type: 'completion',
            title: `Course Completed!`,
            description: `Finished 100% of course lessons and materials`,
            timestamp: enr.completedAt || lastActivity,
            statusColor: 'gold',
          });
        }

        timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const studentName = enr.studentId.fullName || enr.studentId.name || 'Student';

        return {
          _id: enr._id,
          enrolledAt: enr.enrolledAt,
          lastActivity,
          status: courseProgressPct === 100 ? 'completed' : enr.status,
          progressStatus: statusEvaluation.status,
          needsAttention: statusEvaluation.needsAttention,
          attentionReasons: statusEvaluation.attentionReasons,
          student: {
            _id: studentUserId,
            name: studentName,
            email: enr.studentId.email,
            phone: studentProfile?.phone || enr.studentId.phone || 'N/A',
            profilePhoto: studentProfile?.profilePhoto || enr.studentId.profilePhoto || enr.studentId.avatar || '',
            college: studentProfile?.college || 'N/A',
            degree: studentProfile?.degree || '',
            specialization: studentProfile?.specialization || '',
            graduationYear: studentProfile?.graduationYear || '',
            targetCareer: studentProfile?.targetCareer || studentProfile?.preferredJobRole || 'Software Engineer',
            technicalSkills: studentProfile?.technicalSkills || [],
          },
          course: {
            _id: targetCourseId,
            title: enr.courseId.title,
            category: enr.courseId.category,
            thumbnail: enr.courseId.thumbnail,
            difficulty: enr.courseId.difficulty,
            duration: enr.courseId.duration,
            status: enr.courseId.status,
          },
          progress: {
            progressPercentage: courseProgressPct,
            overallPercentage: courseProgressPct,
            completedLessonsCount,
            totalLessonsCount: lessons.length,
            pendingLessonsCount: pendingLessons.length,
            completedLessons,
            pendingLessons,
            lessonsList: lessonsDetailList,
            completedModules: completedModulesList,
            totalModulesCount: modules.length,
            completedModulesCount: completedModulesList.filter((m) => m.isCompleted).length,
            avgQuizScorePct,
            quizzesList: quizDetailList,
            submittedAssignmentsCount,
            totalAssignmentsCount: assignmentDetailList.length,
            assignmentStatusText,
            assignmentsList: assignmentDetailList,
            timeline: timelineEvents,
            messageHistory,
          },
        };
      })
    );

    const validProgressItems = studentProgressList.filter((item) => item !== null);

    const uniqueStudentIds = new Set(validProgressItems.map((item) => item.student._id.toString()));
    const activeStudentsCount = validProgressItems.filter(
      (item) => item.status === 'active' || (item.progress.progressPercentage > 0 && item.progress.progressPercentage < 100)
    ).length;
    const completedCoursesCount = validProgressItems.filter(
      (item) => item.status === 'completed' || item.progress.progressPercentage === 100
    ).length;

    const totalProgressSum = validProgressItems.reduce(
      (sum, item) => sum + item.progress.progressPercentage,
      0
    );
    const averageProgressPct =
      validProgressItems.length > 0 ? Math.round(totalProgressSum / validProgressItems.length) : 0;

    const needsAttentionList = validProgressItems.filter((item) => item.needsAttention);

    return res.status(200).json({
      success: true,
      data: {
        studentProgressList: validProgressItems,
        needsAttentionList: needsAttentionList,
        mentorCourses: mentorCourses,
        stats: {
          totalEnrolledStudents: uniqueStudentIds.size,
          totalEnrollments: validProgressItems.length,
          activeStudents: activeStudentsCount,
          completedCourses: completedCoursesCount,
          averageProgress: averageProgressPct,
          needsAttentionCount: needsAttentionList.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching mentor student progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress data for mentor',
    });
  }
};

// @desc    Get individual student progress detail for mentor
// @route   GET /api/mentor/student-progress/:enrollmentId
// @access  Private (Mentor)
export const getIndividualStudentProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const mentorId = await resolveMentorId(req.user);

    const enrollment = await CourseEnrollment.findById(enrollmentId)
      .populate('studentId', 'fullName name email role avatar profilePhoto phone')
      .populate('courseId', 'title category thumbnail difficulty status duration mentorId')
      .lean();

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found',
      });
    }

    // Verify mentor ownership of the course
    const courseMentorId = enrollment.courseId?.mentorId?.toString();
    const userMentorId = mentorId.toString();
    const currentUserId = req.user._id.toString();

    if (courseMentorId !== userMentorId && courseMentorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this course',
      });
    }

    const studentUserId = enrollment.studentId._id;
    const targetCourseId = enrollment.courseId._id;

    // Student profile
    const studentProfile = await StudentProfile.findOne({ user: studentUserId }).lean();

    // Modules & lessons
    const modules = await CourseModule.find({ courseId: targetCourseId }).sort({ order: 1 }).lean();
    const lessons = await CourseLesson.find({ courseId: targetCourseId }).sort({ order: 1 }).lean();
    const textResources = await CourseTextResource.find({ courseId: targetCourseId }).lean();
    const quizzes = await CourseQuiz.find({ courseId: targetCourseId }).lean();
    const progressDoc = await CourseProgress.findOne({ studentId: studentUserId, courseId: targetCourseId }).lean();
    const quizAttempts = await CourseQuizAttempt.find({ courseId: targetCourseId, studentId: studentUserId })
      .sort({ completedAt: -1 })
      .lean();

    const completedLessonSet = new Set((progressDoc?.completedLessons || []).map((id) => id.toString()));
    const completedAssignmentMap = new Map(
      (progressDoc?.completedAssignments || []).map((a) => [a.resourceId?.toString(), a])
    );

    const moduleMap = new Map((modules || []).map((m) => [m._id.toString(), m.title]));
    const lessonsDetailList = lessons.map((les) => {
      const isCompleted = completedLessonSet.has(les._id.toString());
      return {
        _id: les._id,
        title: les.title,
        duration: les.duration || '10 min',
        moduleTitle: moduleMap.get(les.moduleId?.toString()) || 'General',
        isCompleted,
      };
    });

    const completedLessons = lessonsDetailList.filter((l) => l.isCompleted);
    const pendingLessons = lessonsDetailList.filter((l) => !l.isCompleted);
    const completedLessonsCount = completedLessons.length;

    const courseProgressPct = calculateCourseProgressPercentage(completedLessonsCount, lessons.length);

    // Build Quizzes & Scores
    const quizDetailList = quizzes.map((qz) => {
      const attempts = quizAttempts.filter((a) => a.quizId?.toString() === qz._id.toString());
      let bestAttempt = null;
      if (attempts.length > 0) {
        bestAttempt = attempts.reduce((prev, curr) =>
          (curr.percentage || 0) > (prev.percentage || 0) ? curr : prev
        );
      }
      return {
        _id: qz._id,
        title: qz.title || 'Quiz',
        totalQuestions: qz.questions ? qz.questions.length : 0,
        attemptsCount: attempts.length,
        isCompleted: attempts.length > 0,
        score: bestAttempt ? bestAttempt.totalScore : 0,
        maxScore: bestAttempt ? bestAttempt.maxScore : 0,
        percentage: bestAttempt ? Math.round(bestAttempt.percentage) : 0,
        lastAttemptedAt: bestAttempt ? bestAttempt.completedAt : null,
      };
    });

    const attemptedQuizzes = quizDetailList.filter((q) => q.attemptsCount > 0);
    const avgQuizScorePct =
      attemptedQuizzes.length > 0
        ? Math.round(attemptedQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / attemptedQuizzes.length)
        : null;

    // Assignment Details
    const assignmentResources = textResources.filter((res) => res.type === 'assignment');
    const assignmentDetailList = assignmentResources.map((asg) => {
      const submission = completedAssignmentMap.get(asg._id.toString());
      return {
        _id: asg._id,
        title: asg.title,
        moduleTitle: moduleMap.get(asg.moduleId?.toString()) || 'Assignment',
        isSubmitted: !!submission,
        submissionText: submission?.submissionText || '',
        submissionUrl: submission?.submissionUrl || '',
        submittedAt: submission?.completedAt || null,
        status: submission ? 'Submitted' : 'Pending',
      };
    });

    const datesArray = [
      enrollment.lastAccessedAt,
      enrollment.updatedAt,
      enrollment.enrolledAt,
      progressDoc?.lastAccessedAt,
      progressDoc?.updatedAt,
      ...quizAttempts.map((q) => q.completedAt),
      ...assignmentDetailList.map((a) => a.submittedAt).filter(Boolean),
    ].filter(Boolean);

    const lastActivity = datesArray.length > 0 ? new Date(Math.max(...datesArray.map((d) => new Date(d)))) : enrollment.enrolledAt;

    const statusEvaluation = evaluateStudentProgressStatus({
      completedLessonsCount,
      totalPublishedLessons: lessons.length,
      enrolledAt: enrollment.enrolledAt,
      lastActivityDate: lastActivity,
      avgQuizScorePct,
      submittedAssignmentsCount: assignmentDetailList.filter((a) => a.isSubmitted).length,
      totalAssignmentsCount: assignmentDetailList.length,
    });

    const messageHistory = await Message.find({
      courseId: targetCourseId,
      $or: [
        { senderId: req.user._id, recipientId: studentUserId },
        { senderId: studentUserId, recipientId: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const completedModulesList = modules.map((m) => ({
      _id: m._id,
      title: m.title,
      order: m.order,
      isCompleted: (progressDoc?.completedModules || []).some((id) => id.toString() === m._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      data: {
        _id: enrollment._id,
        enrolledAt: enrollment.enrolledAt,
        lastActivity,
        status: courseProgressPct === 100 ? 'completed' : enrollment.status,
        progressStatus: statusEvaluation.status,
        needsAttention: statusEvaluation.needsAttention,
        attentionReasons: statusEvaluation.attentionReasons,
        student: {
          _id: studentUserId,
          name: enrollment.studentId.fullName || enrollment.studentId.name || 'Student',
          email: enrollment.studentId.email,
          phone: studentProfile?.phone || enrollment.studentId.phone || 'N/A',
          profilePhoto: studentProfile?.profilePhoto || enrollment.studentId.profilePhoto || enrollment.studentId.avatar || '',
          college: studentProfile?.college || 'N/A',
          degree: studentProfile?.degree || '',
          specialization: studentProfile?.specialization || '',
          graduationYear: studentProfile?.graduationYear || '',
          targetCareer: studentProfile?.targetCareer || studentProfile?.preferredJobRole || 'Software Engineer',
          technicalSkills: studentProfile?.technicalSkills || [],
        },
        course: {
          _id: targetCourseId,
          title: enrollment.courseId.title,
          category: enrollment.courseId.category,
          thumbnail: enrollment.courseId.thumbnail,
          difficulty: enrollment.courseId.difficulty,
          duration: enrollment.courseId.duration,
        },
        progress: {
          progressPercentage: courseProgressPct,
          overallPercentage: courseProgressPct,
          completedLessonsCount,
          totalLessonsCount: lessons.length,
          pendingLessonsCount: pendingLessons.length,
          completedLessons,
          pendingLessons,
          completedModules: completedModulesList,
          totalModulesCount: modules.length,
          avgQuizScorePct,
          quizzesList: quizDetailList,
          submittedAssignmentsCount: assignmentDetailList.filter((a) => a.isSubmitted).length,
          totalAssignmentsCount: assignmentDetailList.length,
          assignmentStatusText:
            assignmentDetailList.length === 0
              ? 'No Assignments'
              : `${assignmentDetailList.filter((a) => a.isSubmitted).length}/${assignmentDetailList.length} Submitted`,
          assignmentsList: assignmentDetailList,
          messageHistory,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching individual student progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student progress details',
    });
  }
};

// @desc    Get students needing attention for mentor courses
// @route   GET /api/mentor/students-needing-attention
// @access  Private (Mentor)
export const getStudentsNeedingAttention = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);

    const mentorCourses = await Course.find({
      $or: [{ mentorId: mentorId }, { mentorId: req.user._id }],
    }).select('title category thumbnail difficulty status').lean();

    const mentorCourseIds = mentorCourses.map((c) => c._id);

    if (mentorCourseIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const rawEnrollments = await CourseEnrollment.find({ courseId: { $in: mentorCourseIds } })
      .populate('studentId', 'fullName name email role avatar profilePhoto phone')
      .populate('courseId', 'title category thumbnail')
      .sort({ lastAccessedAt: -1 })
      .lean();

    const attentionList = [];

    for (const enr of rawEnrollments) {
      if (!enr.studentId || !enr.courseId) continue;

      const studentUserId = enr.studentId._id;
      const targetCourseId = enr.courseId._id;

      const lessons = await CourseLesson.find({ courseId: targetCourseId }).lean();
      const progressDoc = await CourseProgress.findOne({ studentId: studentUserId, courseId: targetCourseId }).lean();
      const quizAttempts = await CourseQuizAttempt.find({ courseId: targetCourseId, studentId: studentUserId }).lean();

      const completedLessonsCount = (progressDoc?.completedLessons || []).length;
      const courseProgressPct = calculateCourseProgressPercentage(completedLessonsCount, lessons.length);

      const attemptedQuizzes = quizAttempts.length > 0;
      const avgQuizScorePct = attemptedQuizzes
        ? Math.round(quizAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / quizAttempts.length)
        : null;

      const lastActivity = progressDoc?.lastAccessedAt || enr.lastAccessedAt || enr.enrolledAt;

      const evaluation = evaluateStudentProgressStatus({
        completedLessonsCount,
        totalPublishedLessons: lessons.length,
        enrolledAt: enr.enrolledAt,
        lastActivityDate: lastActivity,
        avgQuizScorePct,
      });

      if (evaluation.needsAttention) {
        attentionList.push({
          _id: enr._id,
          studentId: studentUserId,
          studentName: enr.studentId.fullName || enr.studentId.name || 'Student',
          studentEmail: enr.studentId.email,
          studentPhoto: enr.studentId.profilePhoto || enr.studentId.avatar || '',
          courseId: targetCourseId,
          courseTitle: enr.courseId.title,
          courseCategory: enr.courseId.category,
          progressPercentage: courseProgressPct,
          progressStatus: evaluation.status,
          reasons: evaluation.attentionReasons,
          primaryReason: evaluation.attentionReasons[0] || 'Requires mentor guidance',
          lastActivity,
          enrolledAt: enr.enrolledAt,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: attentionList,
    });
  } catch (error) {
    console.error('Error fetching students needing attention:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students needing attention',
    });
  }
};

// @desc    Send personalized message / intervention to enrolled student
// @route   POST /api/mentor/messages
// @access  Private (Mentor)
export const sendMentorMessage = async (req, res) => {
  try {
    const { studentId, courseId, subject, body, templateKey, parentMessageId } = req.body;

    // 1. Validate incoming data
    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Course ID are required',
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message subject is required',
      });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message body cannot be empty',
      });
    }

    // 2. Verify authenticated user is a mentor
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Only authenticated mentors can send intervention messages',
      });
    }

    const mentorId = await resolveMentorId(req.user);

    // 3. Verify mentor ownership of the course
    const course = await Course.findOne({
      _id: courseId,
      $or: [{ mentorId: mentorId }, { mentorId: req.user._id }],
    });

    if (!course) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to send messages for this course',
      });
    }

    // 4. Verify student is actually enrolled in this course
    const enrollment = await CourseEnrollment.findOne({
      studentId: studentId,
      courseId: courseId,
    });

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'This student is not enrolled in the specified course',
      });
    }

    // 5. Verify recipient user exists
    const studentUser = await User.findById(studentId);
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient student account was not found',
      });
    }

    // Resolve root parentMessageId if replying to an existing thread
    let resolvedParentMessageId = null;
    if (parentMessageId) {
      try {
        const existingParentMsg = await Message.findById(parentMessageId);
        if (existingParentMsg) {
          resolvedParentMessageId = existingParentMsg.parentMessageId || existingParentMsg._id;
        } else {
          resolvedParentMessageId = parentMessageId;
        }
      } catch (err) {
        resolvedParentMessageId = parentMessageId;
      }
    }

    // 6. Save message in MongoDB
    const newMessage = await Message.create({
      senderId: req.user._id,
      senderModel: 'Mentor',
      recipientId: studentId,
      recipientModel: 'User',
      courseId: courseId,
      subject: subject.trim(),
      body: body.trim(),
      messageType: 'mentor_intervention',
      templateKey: templateKey || 'custom',
      parentMessageId: resolvedParentMessageId || null,
      isRead: false,
    });

    // 7. Create notification for student in MongoDB
    const mentorDisplayName = req.user.fullName || req.user.name || 'Your Course Mentor';
    await Notification.create({
      userId: studentId,
      userModel: 'User',
      senderId: req.user._id,
      senderModel: 'Mentor',
      title: `Mentor Message: ${subject.trim()}`,
      message: `${mentorDisplayName} sent you a message regarding "${course.title}": "${body.trim().substring(0, 120)}${body.trim().length > 120 ? '...' : ''}"`,
      type: 'mentor_message',
      link: '/student/dashboard',
      relatedCourseId: courseId,
      relatedMessageId: newMessage._id,
      isRead: false,
    });

    const populatedMessage = {
      ...newMessage.toObject(),
      senderId: {
        _id: req.user._id,
        fullName: mentorDisplayName,
        email: req.user.email,
        profilePhoto: req.user.profilePhoto || '',
        role: 'mentor',
      },
      recipientId: {
        _id: studentUser._id,
        fullName: studentUser.fullName || studentUser.name || 'Student',
        email: studentUser.email,
        profilePhoto: studentUser.profilePhoto || studentUser.avatar || '',
      },
      courseId: {
        _id: course._id,
        title: course.title,
        category: course.category,
        thumbnail: course.thumbnail,
      },
    };

    return res.status(201).json({
      success: true,
      message: 'Message and notification sent to student successfully',
      data: populatedMessage,
    });
  } catch (error) {
    console.error('Error sending mentor message:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message to student',
    });
  }
};

// @desc    Get all messages sent by authenticated mentor or related replies
// @route   GET /api/mentor/messages
// @access  Private (Mentor)
export const getMentorMessages = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);
    const idFilters = [{ senderId: req.user._id }, { recipientId: req.user._id }];
    if (mentorId && mentorId.toString() !== req.user._id.toString()) {
      idFilters.push({ senderId: mentorId }, { recipientId: mentorId });
    }

    const messages = await Message.find({
      $or: idFilters,
    })
      .populate('courseId', 'title category thumbnail')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich messages with student details
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const studentUserId = msg.messageType === 'student_reply' ? msg.senderId : msg.recipientId;
        const studentUser = await User.findById(studentUserId)
          .select('fullName name email profilePhoto avatar')
          .lean();

        return {
          ...msg,
          student: studentUser
            ? {
                _id: studentUser._id,
                name: studentUser.fullName || studentUser.name || 'Student',
                email: studentUser.email,
                profilePhoto: studentUser.profilePhoto || studentUser.avatar || '',
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
    console.error('Error retrieving mentor messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve mentor messages',
    });
  }
};

// @desc    Mark student reply as read by mentor
// @route   PUT /api/mentor/messages/:messageId/read
// @access  Private (Mentor)
export const markMentorMessageRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const mentorId = await resolveMentorId(req.user);
    const recipientConditions = [{ recipientId: req.user._id }];
    if (mentorId && mentorId.toString() !== req.user._id.toString()) {
      recipientConditions.push({ recipientId: mentorId });
    }

    const message = await Message.findOneAndUpdate(
      { _id: messageId, $or: recipientConditions },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error marking mentor message as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
    });
  }
};

// @desc    Get unread counts for mentor
// @route   GET /api/mentor/unread-count
// @access  Private (Mentor)
export const getMentorUnreadCount = async (req, res) => {
  try {
    const mentorId = await resolveMentorId(req.user);
    const recipientConditions = [{ recipientId: req.user._id }];
    if (mentorId && mentorId.toString() !== req.user._id.toString()) {
      recipientConditions.push({ recipientId: mentorId });
    }

    const unreadCount = await Message.countDocuments({
      $or: recipientConditions,
      isRead: false,
      messageType: 'student_reply',
    });

    return res.status(200).json({
      success: true,
      data: {
        unreadMessages: unreadCount,
        totalUnread: unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching mentor unread count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
};






