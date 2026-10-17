import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Job from './models/Job.js';

async function fixJobSkills() {
  const localUri = 'mongodb://127.0.0.1:27017/careerpilot_ai';
  const targetUri = process.env.MONGODB_URI || localUri;

  const options = { serverSelectionTimeoutMS: 4000 };
  if (targetUri.includes('mongodb+srv://') || targetUri.includes('ssl=true') || targetUri.includes('tls=true')) {
    options.tls = true;
  }

  await mongoose.connect(targetUri, options);
  
  // Find wipro job
  const job = await Job.findOne({ companyName: /wipro/i });
  if (job) {
    console.log('Original Skills:', job.requiredSkills);
    // Keep only non-default custom skill entered by recruiter or trim to recruiter input
    // If recruiter entered 'mewm', set requiredSkills to ['mewm']
    job.requiredSkills = ['mewm'];
    await job.save();
    console.log('Updated Skills for job:', job.title, '->', job.requiredSkills);
  } else {
    console.log('Wipro job not found');
  }

  process.exit(0);
}

fixJobSkills();
