import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Recruiter from '../models/Recruiter.js';
import Mentor from '../models/Mentor.js';

export const seedDefaultUsers = async () => {
  // Do not automatically seed demo accounts with hardcoded passwords in production
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO_USERS !== 'true') {
    return;
  }

  try {
    const demoAccounts = [
      {
        fullName: 'Jo',
        email: 'jo@gmail.com',
        password: 'jo1234',
        role: 'student',
      },
      {
        fullName: 'Demo Student',
        email: 'student@careerpilot.ai',
        password: 'password123',
        role: 'student',
      },
      {
        fullName: 'Demo Mentor',
        email: 'mentor@careerpilot.ai',
        password: 'password123',
        role: 'mentor',
      },
      {
        fullName: 'Demo Recruiter',
        email: 'recruiter@careerpilot.ai',
        password: 'password123',
        role: 'recruiter',
      },
    ];

    for (const acc of demoAccounts) {
      if (acc.role === 'mentor') {
        let mentorExists = await Mentor.findOne({ email: acc.email.toLowerCase() });
        if (!mentorExists) {
          await Mentor.create({
            fullName: acc.fullName,
            email: acc.email.toLowerCase(),
            password: acc.password,
            role: 'mentor',
            company: 'Tech Career Mentors',
            designation: 'Senior Staff Mentor'
          });
          console.log(`[Seed DB]: Pre-seeded mentor document in "mentors" collection for "${acc.email}"`);
        }
        continue;
      }

      let user = await User.findOne({ email: acc.email.toLowerCase() });
      if (!user) {
        user = await User.create(acc);
        console.log(`[Seed DB]: Pre-seeded user account "${acc.email}" (${acc.role})`);
      }

      if (user.role === 'recruiter') {
        const recruiterExists = await Recruiter.findOne({ user: user._id });
        if (!recruiterExists) {
          await Recruiter.create({
            user: user._id,
            fullName: user.fullName || acc.fullName,
            email: user.email,
            password: acc.password,
            companyName: '',
            industry: '',
            designation: ''
          });
          console.log(`[Seed DB]: Pre-seeded recruiter document in "recruiters" collection for "${user.email}"`);
        }
      } else if (user.role === 'student') {
        const studentExists = await StudentProfile.findOne({ user: user._id });
        if (!studentExists) {
          await StudentProfile.create({ user: user._id });
        }
      }
    }
  } catch (error) {
    console.error('[Seed Error]: Could not seed default users:', error.message);
  }
};
