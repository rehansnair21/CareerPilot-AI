import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const viewUsers = async () => {
  const localUri = 'mongodb://127.0.0.1:27017/careerpilot_ai';
  const targetUri = process.env.MONGODB_URI || localUri;

  console.log(`\n🔍 Attempting connection to MongoDB database...`);
  let conn;
  try {
    const options = { serverSelectionTimeoutMS: 4000 };
    if (targetUri.includes('mongodb+srv://') || targetUri.includes('ssl=true') || targetUri.includes('tls=true')) {
      options.tls = true;
      options.tlsAllowInvalidCertificates = true;
    }
    conn = await mongoose.connect(targetUri, options);
    console.log(`[Connected]: Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
  } catch (err) {
    console.warn(`[Notice]: Could not connect to primary database (${err.message}). Trying local DB fallback...`);
    try {
      conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[Fallback Connected]: Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    } catch (localErr) {
      console.warn(`[Notice]: Could not connect to local DB (${localErr.message}). Fetching from running backend API server...`);
      try {
        const res = await fetch('http://localhost:5000/api/auth/users');
        const data = await res.json();
        if (data.success) {
          console.log(`\n======================================================`);
          console.log(`   CAREER PILOT AI - REGISTERED USERS IN MONGODB (${data.count})`);
          console.log(`======================================================\n`);
          console.table(
            data.users.map((u) => ({
              ID: u._id,
              Name: u.fullName || u.name || 'N/A',
              Email: u.email,
              Role: u.role ? u.role.toUpperCase() : 'N/A',
              RegisteredAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
            }))
          );
          process.exit(0);
        }
      } catch (apiErr) {
        console.error('Error fetching users:', apiErr.message);
        process.exit(1);
      }
    }
  }

  try {
    const User = (await import('./models/User.js')).default;
    const Recruiter = (await import('./models/Recruiter.js')).default;
    const Admin = (await import('./models/Admin.js')).default;
    const Mentor = (await import('./models/Mentor.js')).default;
    const CareerRecommendation = (await import('./models/CareerRecommendation.js')).default;
    const CareerRoadmap = (await import('./models/CareerRoadmap.js')).default;
    const Resume = (await import('./models/Resume.js')).default;
    const PortfolioAnalysis = (await import('./models/PortfolioAnalysis.js')).default;

    const users = await User.find({}).select('-password');
    const recruiters = await Recruiter.find({});
    const admins = await Admin.find({}).select('-password');
    const mentors = await Mentor.find({}).select('-password');
    const careerRecs = await CareerRecommendation.find({});
    const careerRoadmaps = await CareerRoadmap.find({});
    const resumes = await Resume.find({});
    const portfolioAnalyses = await PortfolioAnalysis.find({});

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - PORTFOLIO ANALYSES TABLE (${portfolioAnalyses.length})`);
    console.log(`======================================================\n`);

    if (portfolioAnalyses.length === 0) {
      console.log('No portfolio analysis records found in portfolio_analyses collection yet.');
    } else {
      console.table(
        portfolioAnalyses.map((pa) => ({
          ID: pa._id.toString(),
          UserID: pa.user ? pa.user.toString() : 'N/A',
          PortfolioURL: pa.portfolioUrl || 'N/A',
          TargetRole: pa.targetRole || 'N/A',
          OverallScore: pa.overallScore !== undefined ? `${pa.overallScore}/100` : 'N/A',
          Status: pa.status || 'active',
          AnalyzedAt: pa.analyzedAt ? new Date(pa.analyzedAt).toLocaleString() : 'N/A',
        }))
      );
    }

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - RESUMES TABLE (${resumes.length})`);
    console.log(`======================================================\n`);

    if (resumes.length === 0) {
      console.log('No resume records found in resumes collection yet.');
    } else {
      console.table(
        resumes.map((r) => ({
          ID: r._id.toString(),
          UserID: r.user ? r.user.toString() : 'N/A',
          FileName: r.fileName || 'N/A',
          TargetRole: r.targetRole || 'N/A',
          ATSScore: r.atsScore !== undefined ? `${r.atsScore}/100` : 'N/A',
          Status: r.status || 'active',
          AnalyzedAt: r.analyzedAt ? new Date(r.analyzedAt).toLocaleString() : 'N/A',
        }))
      );
    }

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - CAREER RECOMMENDATIONS TABLE (${careerRecs.length})`);
    console.log(`======================================================\n`);

    if (careerRecs.length === 0) {
      console.log('No career recommendation records found in career_recommendations collection yet.');
    } else {
      console.table(
        careerRecs.map((cr) => ({
          ID: cr._id.toString(),
          UserID: cr.user ? cr.user.toString() : 'N/A',
          TopMatch: cr.topMatch?.careerTitle || 'N/A',
          MatchPercentage: cr.topMatch?.matchPercentage ? `${cr.topMatch.matchPercentage}%` : 'N/A',
          Count: cr.recommendations ? cr.recommendations.length : 0,
          Status: cr.status || 'active',
          GeneratedAt: cr.generatedAt ? new Date(cr.generatedAt).toLocaleString() : 'N/A',
        }))
      );
    }

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - CAREER ROADMAPS TABLE (${careerRoadmaps.length})`);
    console.log(`======================================================\n`);

    if (careerRoadmaps.length === 0) {
      console.log('No career roadmap records found in career_roadmaps collection yet.');
    } else {
      console.table(
        careerRoadmaps.map((rm) => ({
          ID: rm._id.toString(),
          UserID: rm.user ? rm.user.toString() : 'N/A',
          CareerTitle: rm.careerTitle || 'N/A',
          MatchPercentage: rm.matchPercentage ? `${rm.matchPercentage}%` : 'N/A',
          PhasesCount: Array.isArray(rm.phases) ? rm.phases.length : 0,
          Status: rm.status || 'active',
          UpdatedAt: rm.updatedAt ? new Date(rm.updatedAt).toLocaleString() : 'N/A',
        }))
      );
    }

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - ADMINS COLLECTION (${admins.length})`);
    console.log(`======================================================\n`);

    if (admins.length === 0) {
      console.log('No admin records found in admins collection yet.');
    } else {
      console.table(
        admins.map((a) => ({
          ID: a._id.toString(),
          Username: a.username,
          Name: a.fullName || a.name || 'N/A',
          Email: a.email,
          Role: a.role ? a.role.toUpperCase() : 'ADMIN',
          LastLogin: a.lastLogin ? new Date(a.lastLogin).toLocaleString() : 'N/A',
        }))
      );
    }

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - MENTORS TABLE (${mentors.length})`);
    console.log(`======================================================\n`);

    if (mentors.length === 0) {
      console.log('No mentor records found in mentors collection yet.');
    } else {
      console.table(
        mentors.map((m) => ({
          ID: m._id.toString(),
          Name: m.fullName || m.name || 'N/A',
          Email: m.email || 'N/A',
          Company: m.company || 'N/A',
          Designation: m.designation || 'N/A',
          Phone: m.phone || 'N/A',
          Active: m.isActive !== false ? 'YES' : 'NO',
          RegisteredAt: m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A',
        }))
      );
    }

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - REGISTERED USERS TABLE (${users.length})`);
    console.log(`======================================================\n`);

    if (users.length === 0) {
      console.log('No users found in database yet.');
    } else {
      console.table(
        users.map((u) => ({
          ID: u._id.toString(),
          Name: u.fullName || u.name || 'N/A',
          Email: u.email,
          Role: u.role ? u.role.toUpperCase() : 'N/A',
          RegisteredAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
        }))
      );
    }

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - RECRUITERS TABLE (${recruiters.length})`);
    console.log(`======================================================\n`);

    if (recruiters.length === 0) {
      console.log('No recruiter records found in recruiters table yet.');
    } else {
      console.table(
        recruiters.map((r) => ({
          ID: r._id.toString(),
          UserID: r.user ? r.user.toString() : 'N/A',
          Name: r.fullName || 'N/A',
          Email: r.email || 'N/A',
          Company: r.companyName || 'N/A',
          Designation: r.designation || 'N/A',
          Phone: r.phone || 'N/A',
          Status: r.verifiedStatus || 'verified',
        }))
      );
    }
    process.exit(0);
  } catch (error) {
    console.error('Error reading database tables:', error.message);
    process.exit(1);
  }
};

viewUsers();
