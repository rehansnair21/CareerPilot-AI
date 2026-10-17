import dotenv from 'dotenv';
import mongoose from 'mongoose';
import StudentProfile from './models/StudentProfile.js';
import CareerRecommendation from './models/CareerRecommendation.js';
import AssessmentScore from './models/AssessmentScore.js';

dotenv.config();

const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerpilot_ai';

const syncCareerRecommendations = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(targetUri);
    console.log('Connected to MongoDB database:', mongoose.connection.name);

    const profiles = await StudentProfile.find({});
    console.log(`Found ${profiles.length} total student profiles in database.`);

    let syncedCount = 0;
    for (const profile of profiles) {
      if (!profile.user) continue;

      const recs = profile.careerRecommendations?.recommendations || [];
      if (recs.length === 0) continue;

      const existingDoc = await CareerRecommendation.findOne({ user: profile.user, status: 'active' });
      if (!existingDoc) {
        const assessmentScoreDoc = await AssessmentScore.findOne({ student: profile.user });
        const topRec = recs[0] || {};

        const doc = await CareerRecommendation.create({
          user: profile.user,
          topMatch: {
            careerTitle: topRec.careerTitle || profile.careerMatchTitle || '',
            matchPercentage: topRec.matchPercentage || profile.careerMatch || 0,
            matchingSkills: topRec.matchingSkills || profile.careerMatchSkills || [],
          },
          recommendations: recs.map((r) => ({
            careerTitle: r.careerTitle,
            matchPercentage: r.matchPercentage,
            matchingSkills: r.matchingSkills || [],
            skillGaps: r.skillGaps || [],
            reason: r.reason || '',
            recommendedImprovements: r.recommendedImprovements || [],
          })),
          inputSnapshot: {
            technicalSkills: profile.technicalSkills || [],
            softSkills: profile.softSkills || [],
            degree: profile.degree || '',
            specialization: profile.specialization || '',
            targetCareer: profile.targetCareer || '',
            preferredJobRole: profile.preferredJobRole || '',
            resumeScore: profile.resumeScore,
            assessmentScore: assessmentScoreDoc?.overallScore || profile.assessmentScore || 0,
            portfolioScore: profile.portfolioAnalysis?.overallScore || 0,
          },
          status: 'active',
          generatedAt: profile.careerRecommendations?.generatedAt || new Date(),
        });
        console.log(`Synced career recommendation for User [${profile.user}] -> Record ID: ${doc._id}`);
        syncedCount++;
      } else {
        console.log(`User [${profile.user}] already has active career recommendation record.`);
      }
    }

    const totalInCollection = await CareerRecommendation.countDocuments();
    console.log(`\nSync complete! Added ${syncedCount} records. Total documents in career_recommendations collection: ${totalInCollection}`);
    process.exit(0);
  } catch (error) {
    console.error('Error syncing career recommendations:', error);
    process.exit(1);
  }
};

syncCareerRecommendations();
