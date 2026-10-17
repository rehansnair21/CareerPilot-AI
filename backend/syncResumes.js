import dotenv from 'dotenv';
import mongoose from 'mongoose';
import StudentProfile from './models/StudentProfile.js';
import Resume from './models/Resume.js';

dotenv.config();

const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerpilot_ai';

const syncResumes = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(targetUri);
    console.log('Connected to MongoDB database:', mongoose.connection.name);

    const profiles = await StudentProfile.find({ 'resumeAnalysis.analyzedAt': { $exists: true, $ne: null } });
    console.log(`Found ${profiles.length} student profiles with analyzed resumes.`);

    let syncedCount = 0;
    for (const profile of profiles) {
      if (!profile.user || !profile.resumeAnalysis?.analyzedAt) continue;

      const existingDoc = await Resume.findOne({ user: profile.user, status: 'active' });
      if (!existingDoc) {
        const doc = await Resume.create({
          user: profile.user,
          fileName: profile.resumeAnalysis.fileName || '',
          fileSize: profile.resumeAnalysis.fileSize || '',
          fileBuffer: profile.resumeAnalysis.fileBuffer || null,
          fileMimeType: profile.resumeAnalysis.fileMimeType || 'application/pdf',
          targetRole: profile.resumeAnalysis.targetRole || 'Software Engineer',
          atsScore: profile.resumeAnalysis.atsScore || 0,
          atsCompatibility: profile.resumeAnalysis.atsCompatibility || '',
          summary: profile.resumeAnalysis.summary || '',
          strengths: profile.resumeAnalysis.strengths || [],
          weaknesses: profile.resumeAnalysis.weaknesses || [],
          improvements: profile.resumeAnalysis.improvements || [],
          detectedSkills: profile.resumeAnalysis.detectedSkills || [],
          missingKeywords: profile.resumeAnalysis.missingKeywords || [],
          sectionScores: profile.resumeAnalysis.sectionScores || {},
          suggestedBulletRewrites: profile.resumeAnalysis.suggestedBulletRewrites || [],
          status: 'active',
          analyzedAt: profile.resumeAnalysis.analyzedAt,
        });
        console.log(`Synced resume analysis for User [${profile.user}] (${profile.resumeAnalysis.fileName || 'Resume'}) -> Record ID: ${doc._id}`);
        syncedCount++;
      } else {
        console.log(`Resume record already exists in collection for User [${profile.user}].`);
      }
    }

    const totalInCollection = await Resume.countDocuments();
    console.log(`\nSync complete! Added ${syncedCount} resume records. Total documents in resumes collection: ${totalInCollection}`);
    process.exit(0);
  } catch (error) {
    console.error('Error syncing resumes:', error);
    process.exit(1);
  }
};

syncResumes();
