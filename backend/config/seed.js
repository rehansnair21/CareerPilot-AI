import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Recruiter from '../models/Recruiter.js';

export const seedDefaultUsers = async () => {
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
