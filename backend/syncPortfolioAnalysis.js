import dotenv from 'dotenv';
import mongoose from 'mongoose';
import StudentProfile from './models/StudentProfile.js';
import PortfolioAnalysis from './models/PortfolioAnalysis.js';

dotenv.config();

const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerpilot_ai';

const syncPortfolioAnalysis = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(targetUri);
    console.log('Connected to MongoDB database:', mongoose.connection.name);

    const profiles = await StudentProfile.find({ 'portfolioAnalysis.analyzedAt': { $exists: true, $ne: null } });
    console.log(`Found ${profiles.length} student profiles with analyzed portfolios.`);

    let syncedCount = 0;
    for (const profile of profiles) {
      if (!profile.user || !profile.portfolioAnalysis?.analyzedAt) continue;

      const existingDoc = await PortfolioAnalysis.findOne({ user: profile.user, status: 'active' });
      if (!existingDoc) {
        const doc = await PortfolioAnalysis.create({
          user: profile.user,
          portfolioUrl: profile.portfolioAnalysis.portfolioUrl || profile.portfolio || '',
          targetRole: profile.targetCareer || profile.preferredJobRole || 'Software Engineer',
          overallScore: profile.portfolioAnalysis.overallScore || 0,
          overallReview: profile.portfolioAnalysis.overallReview || '',
          ratingBreakdown: profile.portfolioAnalysis.ratingBreakdown || {},
          strengths: profile.portfolioAnalysis.strengths || [],
          weaknesses: profile.portfolioAnalysis.weaknesses || [],
          recommendations: profile.portfolioAnalysis.recommendations || [],
          detectedSkills: profile.portfolioAnalysis.detectedSkills || [],
          status: 'active',
          analyzedAt: profile.portfolioAnalysis.analyzedAt,
        });
        console.log(`Synced portfolio analysis for User [${profile.user}] (${profile.portfolioAnalysis.portfolioUrl || 'Portfolio'}) -> Record ID: ${doc._id}`);
        syncedCount++;
      } else {
        console.log(`Portfolio analysis record already exists in collection for User [${profile.user}].`);
      }
    }

    const totalInCollection = await PortfolioAnalysis.countDocuments();
    console.log(`\nSync complete! Added ${syncedCount} portfolio analysis records. Total documents in portfolio_analyses collection: ${totalInCollection}`);
    process.exit(0);
  } catch (error) {
    console.error('Error syncing portfolio analysis:', error);
    process.exit(1);
  }
};

syncPortfolioAnalysis();
