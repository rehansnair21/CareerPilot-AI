import dotenv from 'dotenv';
import mongoose from 'mongoose';
import StudentProfile from './models/StudentProfile.js';
import CareerRoadmap from './models/CareerRoadmap.js';

dotenv.config();

const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerpilot_ai';

const syncCareerRoadmaps = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(targetUri);
    console.log('Connected to MongoDB database:', mongoose.connection.name);

    const profiles = await StudentProfile.find({ 'selectedRoadmap.careerTitle': { $exists: true, $ne: '' } });
    console.log(`Found ${profiles.length} student profiles with selected roadmaps.`);

    let syncedCount = 0;
    for (const profile of profiles) {
      if (!profile.user || !profile.selectedRoadmap?.careerTitle) continue;

      const existingDoc = await CareerRoadmap.findOne({ user: profile.user, status: 'active' });
      if (!existingDoc) {
        const doc = await CareerRoadmap.create({
          user: profile.user,
          careerTitle: profile.selectedRoadmap.careerTitle,
          matchPercentage: profile.selectedRoadmap.matchPercentage || 85,
          matchingSkills: profile.selectedRoadmap.matchingSkills || [],
          skillGaps: profile.selectedRoadmap.skillGaps || [],
          phases: profile.selectedRoadmap.phases || [],
          recommendedResources: profile.selectedRoadmap.recommendedResources || [],
          milestonesList: profile.selectedRoadmap.milestonesList || [],
          aiTip: profile.selectedRoadmap.aiTip || '',
          status: 'active',
        });
        console.log(`Synced career roadmap for User [${profile.user}] (${profile.selectedRoadmap.careerTitle}) -> Record ID: ${doc._id}`);
        syncedCount++;
      } else {
        console.log(`Career roadmap document already exists in collection for User [${profile.user}].`);
      }
    }

    const totalInCollection = await CareerRoadmap.countDocuments();
    console.log(`\nSync complete! Added ${syncedCount} roadmap records. Total documents in career_roadmaps collection: ${totalInCollection}`);
    process.exit(0);
  } catch (error) {
    console.error('Error syncing career roadmaps:', error);
    process.exit(1);
  }
};

syncCareerRoadmaps();
