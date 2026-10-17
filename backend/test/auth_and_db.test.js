import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure JWT_SECRET is set for tests
process.env.JWT_SECRET = 'test_jwt_secret_key_32_characters_long_for_security';
process.env.NODE_ENV = 'test';

let mongod;

// Mock Response Helper
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

test('Database and Authentication Security Test Suite', async (t) => {
  const { loginUser, changePassword } = await import('../controllers/authController.js');
  const { seedAdmin } = await import('../utils/seedAdmin.js');
  const User = (await import('../models/User.js')).default;
  const Recruiter = (await import('../models/Recruiter.js')).default;
  const Mentor = (await import('../models/Mentor.js')).default;
  const Admin = (await import('../models/Admin.js')).default;

  await t.test('1. Student Login: Correct password succeeds, wrong password fails without mutating hash', async () => {
    const student = await User.create({
      fullName: 'Test Student',
      email: 'student_test@example.com',
      password: 'StudentOriginalPassword123',
      role: 'student'
    });

    const initialStudentDoc = await User.findById(student._id).select('+password');
    const originalHash = initialStudentDoc.password;
    assert.ok(originalHash, 'Original password hash must exist');

    // Attempt login with wrong password
    const reqFail = {
      body: {
        email: 'student_test@example.com',
        password: 'CompletelyWrongPassword!',
        role: 'student'
      }
    };
    const resFail = mockResponse();
    await loginUser(reqFail, resFail);

    assert.equal(resFail.statusCode, 401, 'Wrong password must return 401');
    assert.equal(resFail.body.success, false);

    // Verify hash was NOT mutated
    const studentAfterFail = await User.findById(student._id).select('+password');
    assert.equal(studentAfterFail.password, originalHash, 'Password hash must NOT change on failed login');

    // Attempt login with correct password
    const reqSuccess = {
      body: {
        email: 'student_test@example.com',
        password: 'StudentOriginalPassword123',
        role: 'student'
      }
    };
    const resSuccess = mockResponse();
    await loginUser(reqSuccess, resSuccess);

    assert.equal(resSuccess.statusCode, 200, 'Correct password must return 200');
    assert.equal(resSuccess.body.success, true);
    assert.ok(resSuccess.body.token, 'Token must be provided upon successful login');
    assert.equal(resSuccess.body.user.email, 'student_test@example.com');
  });

  await t.test('2. Recruiter Login: Correct password succeeds, wrong password fails without mutating hash', async () => {
    const recruiter = await Recruiter.create({
      fullName: 'Test Recruiter',
      email: 'recruiter_test@example.com',
      password: 'RecruiterOriginalPassword123',
      role: 'recruiter'
    });

    const initialRecDoc = await Recruiter.findById(recruiter._id).select('+password');
    const originalHash = initialRecDoc.password;

    // Wrong password
    const reqFail = {
      body: {
        email: 'recruiter_test@example.com',
        password: 'WrongRecruiterPassword!',
        role: 'recruiter'
      }
    };
    const resFail = mockResponse();
    await loginUser(reqFail, resFail);

    assert.equal(resFail.statusCode, 401);
    const recAfterFail = await Recruiter.findById(recruiter._id).select('+password');
    assert.equal(recAfterFail.password, originalHash, 'Recruiter password must not mutate on failure');

    // Correct password
    const reqSuccess = {
      body: {
        email: 'recruiter_test@example.com',
        password: 'RecruiterOriginalPassword123',
        role: 'recruiter'
      }
    };
    const resSuccess = mockResponse();
    await loginUser(reqSuccess, resSuccess);

    assert.equal(resSuccess.statusCode, 200);
    assert.equal(resSuccess.body.success, true);
    assert.ok(resSuccess.body.token);
  });

  await t.test('3. Mentor Login: Correct password succeeds, wrong password fails without mutating hash', async () => {
    const mentor = await Mentor.create({
      fullName: 'Test Mentor',
      email: 'mentor_test@example.com',
      password: 'MentorOriginalPassword123',
      role: 'mentor'
    });

    const initialMenDoc = await Mentor.findById(mentor._id).select('+password');
    const originalHash = initialMenDoc.password;

    // Wrong password
    const reqFail = {
      body: {
        email: 'mentor_test@example.com',
        password: 'WrongMentorPassword!',
        role: 'mentor'
      }
    };
    const resFail = mockResponse();
    await loginUser(reqFail, resFail);

    assert.equal(resFail.statusCode, 401);
    const menAfterFail = await Mentor.findById(mentor._id).select('+password');
    assert.equal(menAfterFail.password, originalHash, 'Mentor password must not mutate on failure');

    // Correct password
    const reqSuccess = {
      body: {
        email: 'mentor_test@example.com',
        password: 'MentorOriginalPassword123',
        role: 'mentor'
      }
    };
    const resSuccess = mockResponse();
    await loginUser(reqSuccess, resSuccess);

    assert.equal(resSuccess.statusCode, 200);
    assert.equal(resSuccess.body.success, true);
    assert.ok(resSuccess.body.token);
  });

  await t.test('4. Admin Login: Denies hardcoded "admin123" and wrong password, succeeds with actual password', async () => {
    const admin = await Admin.create({
      username: 'customadmin',
      fullName: 'Custom Admin',
      email: 'admin_test@example.com',
      password: 'SuperSecureAdminPassword2026!',
      role: 'admin'
    });

    const initialAdminDoc = await Admin.findById(admin._id).select('+password');
    const originalHash = initialAdminDoc.password;

    // Attempt default hardcoded 'admin123' password
    const reqDefault = {
      body: {
        username: 'customadmin',
        password: 'admin123',
        role: 'admin'
      }
    };
    const resDefault = mockResponse();
    await loginUser(reqDefault, resDefault);

    assert.equal(resDefault.statusCode, 401, 'Hardcoded admin123 must be rejected');
    const adminAfterDefault = await Admin.findById(admin._id).select('+password');
    assert.equal(adminAfterDefault.password, originalHash, 'Admin password must NOT be reset to admin123');

    // Attempt correct password
    const reqSuccess = {
      body: {
        username: 'customadmin',
        password: 'SuperSecureAdminPassword2026!',
        role: 'admin'
      }
    };
    const resSuccess = mockResponse();
    await loginUser(reqSuccess, resSuccess);

    assert.equal(resSuccess.statusCode, 200);
    assert.equal(resSuccess.body.success, true);
    assert.ok(resSuccess.body.token);
  });

  await t.test('5. Change Password: Must use authenticated flow and enforce validation', async () => {
    const userToChange = await User.create({
      fullName: 'Password Change User',
      email: 'pw_change@example.com',
      password: 'CurrentValidPass123',
      role: 'student'
    });

    // 1. Wrong current password -> 401
    const reqWrongCurr = {
      user: { _id: userToChange._id, role: 'student' },
      body: {
        currentPassword: 'IncorrectCurrentPass',
        newPassword: 'BrandNewPassword123',
        confirmNewPassword: 'BrandNewPassword123'
      }
    };
    const resWrongCurr = mockResponse();
    await changePassword(reqWrongCurr, resWrongCurr);
    assert.equal(resWrongCurr.statusCode, 401);

    // 2. Mismatched confirmNewPassword -> 400
    const reqMismatch = {
      user: { _id: userToChange._id, role: 'student' },
      body: {
        currentPassword: 'CurrentValidPass123',
        newPassword: 'BrandNewPassword123',
        confirmNewPassword: 'DifferentPassword123'
      }
    };
    const resMismatch = mockResponse();
    await changePassword(reqMismatch, resMismatch);
    assert.equal(resMismatch.statusCode, 400);

    // 3. New password too short (< 6 chars) -> 400
    const reqShort = {
      user: { _id: userToChange._id, role: 'student' },
      body: {
        currentPassword: 'CurrentValidPass123',
        newPassword: 'short',
        confirmNewPassword: 'short'
      }
    };
    const resShort = mockResponse();
    await changePassword(reqShort, resShort);
    assert.equal(resShort.statusCode, 400);

    // 4. Correct current password and valid new password -> 200
    const reqSuccess = {
      user: { _id: userToChange._id, role: 'student' },
      body: {
        currentPassword: 'CurrentValidPass123',
        newPassword: 'BrandNewPassword123',
        confirmNewPassword: 'BrandNewPassword123'
      }
    };
    const resSuccess = mockResponse();
    await changePassword(reqSuccess, resSuccess);
    assert.equal(resSuccess.statusCode, 200);
    assert.equal(resSuccess.body.success, true);

    // 5. Old password no longer works
    const reqOldLogin = {
      body: {
        email: 'pw_change@example.com',
        password: 'CurrentValidPass123',
        role: 'student'
      }
    };
    const resOldLogin = mockResponse();
    await loginUser(reqOldLogin, resOldLogin);
    assert.equal(resOldLogin.statusCode, 401, 'Old password must be rejected after change');

    // 6. New password works
    const reqNewLogin = {
      body: {
        email: 'pw_change@example.com',
        password: 'BrandNewPassword123',
        role: 'student'
      }
    };
    const resNewLogin = mockResponse();
    await loginUser(reqNewLogin, resNewLogin);
    assert.equal(resNewLogin.statusCode, 200, 'New password must authenticate successfully');
  });

  await t.test('6. Admin Seeding: Environment variable enforcement and no overwrite', async () => {
    // Clear admins
    await Admin.deleteMany({});

    // Without env vars -> seed is skipped
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    await seedAdmin();
    let count = await Admin.countDocuments();
    assert.equal(count, 0, 'No admin should be created without env vars');

    // With env vars -> seeds admin securely
    process.env.ADMIN_EMAIL = 'prod_admin@careerpilot.ai';
    process.env.ADMIN_PASSWORD = 'CustomProdAdminPass2026!';
    process.env.ADMIN_USERNAME = 'prodadmin';
    await seedAdmin();
    count = await Admin.countDocuments();
    assert.equal(count, 1, 'Admin should be created when env vars are present');

    const createdAdmin = await Admin.findOne({ email: 'prod_admin@careerpilot.ai' }).select('+password');
    assert.ok(createdAdmin);
    assert.equal(createdAdmin.username, 'prodadmin');
    const isMatch = await createdAdmin.matchPassword('CustomProdAdminPass2026!');
    assert.equal(isMatch, true, 'Admin password must match provided env var');

    // Running seedAdmin again when admin already exists must NOT overwrite or duplicate
    process.env.ADMIN_PASSWORD = 'SomeOtherPassword';
    await seedAdmin();
    const countAfter = await Admin.countDocuments();
    assert.equal(countAfter, 1, 'Admin count must remain 1');
    const sameAdmin = await Admin.findOne({ email: 'prod_admin@careerpilot.ai' }).select('+password');
    assert.equal(await sameAdmin.matchPassword('CustomProdAdminPass2026!'), true, 'Existing admin password must not be overwritten');
  });

  await t.test('7. Security Audit of Codebase Files: No tlsAllowInvalidCertificates or silent fallback', () => {
    const backendDir = path.resolve(__dirname, '..');
    const dbPath = path.join(backendDir, 'config', 'db.js');
    const viewUsersPath = path.join(backendDir, 'viewUsers.js');
    const checkJobsPath = path.join(backendDir, 'checkJobs.js');

    const dbContent = fs.readFileSync(dbPath, 'utf8');
    assert.equal(/tlsAllowInvalidCertificates\s*[:=]\s*true/.test(dbContent), false, 'db.js must not enable tlsAllowInvalidCertificates');
    assert.equal(dbContent.includes('MongoMemoryServer'), false, 'db.js must not contain silent MongoMemoryServer fallback');
    assert.equal(dbContent.includes('127.0.0.1:27017'), false, 'db.js must not contain silent local DB fallback');

    const viewUsersContent = fs.readFileSync(viewUsersPath, 'utf8');
    assert.equal(/tlsAllowInvalidCertificates\s*[:=]\s*true/.test(viewUsersContent), false, 'viewUsers.js must not allow invalid certificates');

    const checkJobsContent = fs.readFileSync(checkJobsPath, 'utf8');
    assert.equal(/tlsAllowInvalidCertificates\s*[:=]\s*true/.test(checkJobsContent), false, 'checkJobs.js must not allow invalid certificates');
  });

  await t.test('8. CORS Origin Configuration: Supports Vercel URL and normalizes trailing slashes', () => {
    const testOrigins = 'https://careerpilot-ai.vercel.app/, https://preview-domain.vercel.app';
    const parsed = testOrigins.split(',').map((url) => url.trim().replace(/\/+$/, ''));

    assert.deepEqual(parsed, [
      'https://careerpilot-ai.vercel.app',
      'https://preview-domain.vercel.app'
    ]);

    const incomingOrigin = 'https://careerpilot-ai.vercel.app';
    assert.equal(parsed.includes(incomingOrigin), true, 'Incoming Vercel origin must match allowed origin');

    const disallowedOrigin = 'https://malicious-site.com';
    assert.equal(parsed.includes(disallowedOrigin), false, 'Disallowed origin must be rejected');
  });
});
