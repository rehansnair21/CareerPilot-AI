import User from '../models/User.js';
import Recruiter from '../models/Recruiter.js';
import Admin from '../models/Admin.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

// @desc    Get system overview & dashboard stats for Admin
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getAdminStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalRecruiters = await Recruiter.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();

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
        collections: {
          users: totalStudents + totalMentors,
          recruiters: totalRecruiters,
          admins: totalAdmins,
          job_postings: totalJobs,
          applications: totalApplications
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
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });

    const formattedUsers = users.map((u) => ({
      _id: u._id,
      name: u.fullName || u.name,
      fullName: u.fullName || u.name,
      email: u.email,
      role: u.role || 'student',
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
      collectionName: 'recruiters',
      createdAt: r.createdAt
    }));

    const formattedAdmins = admins.map((a) => ({
      _id: a._id,
      username: a.username,
      name: a.fullName || a.username,
      fullName: a.fullName || a.username,
      email: a.email,
      role: 'admin',
      collectionName: 'admins',
      createdAt: a.createdAt,
      lastLogin: a.lastLogin
    }));

    const all = [...formattedAdmins, ...formattedRecruiters, ...formattedUsers];

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

// @desc    Get all jobs for Admin
// @route   GET /api/admin/jobs
// @access  Private (Admin)
export const getAllJobsAdmin = async (req, res) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Error fetching admin jobs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job postings'
    });
  }
};
