import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test_jwt_secret_key_32_characters_long_for_security';
process.env.NODE_ENV = 'test';

let mongod;

const mockResponse = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

test('Admin Job Management Specification Suite', async (t) => {
  const Job = (await import('../models/Job.js')).default;
  const Application = (await import('../models/Application.js')).default;
  const User = (await import('../models/User.js')).default;
  const {
    getAllJobsAdmin,
    toggleJobStatusAdmin,
    deleteJobAdmin,
    getJobDetailsAdmin,
  } = await import('../controllers/adminController.js');
  const { getAvailableJobsForStudent } = await import('../controllers/studentController.js');

  // Seed sample recruiter, student, jobs, and applications
  const recruiter = await User.create({
    fullName: 'Acme Recruiter',
    email: 'recruiter@acme.corp',
    password: 'RecruiterPassword123!',
    role: 'recruiter',
  });

  const student = await User.create({
    fullName: 'Alice Student',
    email: 'alice@university.edu',
    password: 'StudentPassword123!',
    role: 'student',
  });

  const job1 = await Job.create({
    recruiter: recruiter._id,
    companyName: 'Acme Corp',
    title: 'Senior Full Stack Engineer',
    location: 'Bangalore / Remote',
    employmentType: 'Full-time',
    description: 'Lead engineering for scalable React & Node cloud applications.',
    salaryRange: '₹18,00,000 - ₹24,00,000',
    requiredSkills: ['React', 'Node.js', 'MongoDB'],
    status: 'Active',
  });

  const job2 = await Job.create({
    recruiter: recruiter._id,
    companyName: 'Acme Corp',
    title: 'Cloud DevOps Architect',
    location: 'Remote',
    employmentType: 'Contract',
    description: 'Design CI/CD pipelines and infrastructure as code.',
    salaryRange: '₹20,00,000 - ₹30,00,000',
    requiredSkills: ['AWS', 'Docker', 'Kubernetes'],
    status: 'Active',
  });

  // Create applications for job1
  await Application.create({
    job: job1._id,
    student: student._id,
    recruiter: recruiter._id,
    applicantName: student.fullName,
    applicantEmail: student.email,
    applicantPhone: '9876543210',
    degree: 'B.Tech Computer Science',
    institution: 'National Institute of Technology',
    status: 'Shortlisted',
  });

  await Application.create({
    job: job1._id,
    student: new mongoose.Types.ObjectId(),
    recruiter: recruiter._id,
    applicantName: 'Bob Engineer',
    applicantEmail: 'bob@example.com',
    status: 'Reviewing',
  });

  await t.test('1. getAllJobsAdmin dynamically calculates applicant counts from database', async () => {
    const res = mockResponse();
    await getAllJobsAdmin({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 2);

    const foundJob1 = res.body.jobs.find((j) => j._id.toString() === job1._id.toString());
    assert.ok(foundJob1);
    assert.equal(foundJob1.applicationsCount, 2, 'Job 1 should dynamically report 2 applicants from Application collection');

    const foundJob2 = res.body.jobs.find((j) => j._id.toString() === job2._id.toString());
    assert.ok(foundJob2);
    assert.equal(foundJob2.applicationsCount, 0, 'Job 2 should report 0 applicants');
  });

  await t.test('2. Deactivating a job hides it from public student listings while preserving applications', async () => {
    // Before deactivation: job1 is in available student jobs
    const studentResBefore = mockResponse();
    await getAvailableJobsForStudent({ user: student, query: {} }, studentResBefore);
    assert.equal(studentResBefore.statusCode, 200);
    const hasJob1Before = studentResBefore.body.data.some((j) => j._id.toString() === job1._id.toString());
    assert.equal(hasJob1Before, true, 'Active job1 must be available to students');

    // Admin deactivates job1
    const toggleRes = mockResponse();
    await toggleJobStatusAdmin({ params: { id: job1._id.toString() } }, toggleRes);
    assert.equal(toggleRes.statusCode, 200);
    assert.equal(toggleRes.body.success, true);
    assert.equal(toggleRes.body.job.status, 'Deactivated');

    // Verify in database
    const dbJob1 = await Job.findById(job1._id);
    assert.equal(dbJob1.status, 'Deactivated');

    // After deactivation: job1 MUST BE HIDDEN from student listings
    const studentResAfter = mockResponse();
    await getAvailableJobsForStudent({ user: student, query: {} }, studentResAfter);
    assert.equal(studentResAfter.statusCode, 200);
    const hasJob1After = studentResAfter.body.data.some((j) => j._id.toString() === job1._id.toString());
    assert.equal(hasJob1After, false, 'Deactivated job1 MUST NOT be visible in public student job listings');

    // Applications for job1 MUST BE FULLY PRESERVED
    const preservedCount = await Application.countDocuments({ job: job1._id });
    assert.equal(preservedCount, 2, 'Existing application records must be fully preserved when job is deactivated');
  });

  await t.test('3. Admin can reactivate deactivated job, restoring it to public listings', async () => {
    // Admin reactivates job1
    const reactivateRes = mockResponse();
    await toggleJobStatusAdmin({ params: { id: job1._id.toString() } }, reactivateRes);
    assert.equal(reactivateRes.statusCode, 200);
    assert.equal(reactivateRes.body.success, true);
    assert.equal(reactivateRes.body.job.status, 'Active');

    // Verify in database
    const dbJob1 = await Job.findById(job1._id);
    assert.equal(dbJob1.status, 'Active');

    // Now available to students again
    const studentRes = mockResponse();
    await getAvailableJobsForStudent({ user: student, query: {} }, studentRes);
    assert.equal(studentRes.statusCode, 200);
    const hasJob1 = studentRes.body.data.some((j) => j._id.toString() === job1._id.toString());
    assert.equal(hasJob1, true, 'Reactivated job1 must be visible in public student job listings again');
  });

  await t.test('4. Soft deletion marks job as isDeleted and preserves all applicant records', async () => {
    // Admin soft-deletes job1
    const deleteRes = mockResponse();
    await deleteJobAdmin({ params: { id: job1._id.toString() } }, deleteRes);
    assert.equal(deleteRes.statusCode, 200);
    assert.equal(deleteRes.body.success, true);
    assert.equal(deleteRes.body.preservedApplicationsCount, 2);

    // Verify in database: job is soft deleted
    const dbJob1 = await Job.findById(job1._id);
    assert.equal(dbJob1.isDeleted, true);
    assert.ok(dbJob1.deletedAt instanceof Date);

    // Verify applications STILL EXIST in database
    const applications = await Application.find({ job: job1._id });
    assert.equal(applications.length, 2, 'All application records MUST be preserved even when job is deleted');
    assert.equal(applications[0].applicantName, student.fullName);

    // Deleted job is excluded from active student listings
    const studentRes = mockResponse();
    await getAvailableJobsForStudent({ user: student, query: {} }, studentRes);
    const hasDeletedJob = studentRes.body.data.some((j) => j._id.toString() === job1._id.toString());
    assert.equal(hasDeletedJob, false, 'Soft-deleted job MUST NOT be visible to students');

    // Deleted job is excluded from active admin jobs
    const adminJobsRes = mockResponse();
    await getAllJobsAdmin({}, adminJobsRes);
    const hasJobInAdmin = adminJobsRes.body.jobs.some((j) => j._id.toString() === job1._id.toString());
    assert.equal(hasJobInAdmin, false, 'Soft-deleted job is removed from active admin table');
  });

  await t.test('5. getJobDetailsAdmin returns full job details and real applicant records', async () => {
    const detailsRes = mockResponse();
    await getJobDetailsAdmin({ params: { id: job1._id.toString() } }, detailsRes);
    assert.equal(detailsRes.statusCode, 200);
    assert.equal(detailsRes.body.success, true);
    assert.equal(detailsRes.body.job.title, 'Senior Full Stack Engineer');
    assert.equal(detailsRes.body.job.applications.length, 2);
    const applicantNames = detailsRes.body.job.applications.map(a => a.applicantName);
    assert.ok(applicantNames.includes(student.fullName));
    assert.ok(applicantNames.includes('Bob Engineer'));
  });
});
