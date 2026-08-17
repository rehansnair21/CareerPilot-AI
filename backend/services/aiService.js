import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import https from 'https';

/**
 * Extract plain text from PDF, DOCX, or TXT buffer
 */
export const extractTextFromBuffer = async (buffer, mimeType, fileName = '') => {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));

  if (mimeType === 'application/pdf' || ext === '.pdf') {
    const origWarn = console.warn;
    const origError = console.error;
    try {
      // Silence internal PDF TrueType font decoder warnings (e.g. Warning: TT: undefined function)
      console.warn = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('TT:')) return;
        origWarn(...args);
      };
      console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('TT:')) return;
        origError(...args);
      };

      const uint8Array = new Uint8Array(buffer);
      const parser = new PDFParse(uint8Array);
      await parser.load();
      const res = await parser.getText();
      const extractedText = typeof res === 'string' ? res : (res && typeof res.text === 'string' ? res.text : '');
      if (extractedText && extractedText.trim()) {
        return extractedText.trim();
      }
    } catch (err) {
      // Silent catch PDF parser issues
    } finally {
      console.warn = origWarn;
      console.error = origError;
    }

    try {
      const rawText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
      if (rawText.length > 50 && /[a-zA-Z]{4,}/.test(rawText)) {
        return rawText;
      }
    } catch (e) { }

    return '';
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ext === '.docx' ||
    ext === '.doc'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim()) {
        return result.value;
      }
    } catch (err) {
      // Ignore mammoth docx errors
    }

    return '';
  }

  // Fallback for TXT or other text formats
  return buffer.toString('utf-8') || '';
};

/**
 * Validate if extracted text belongs to a genuine resume/CV document
 */
export const validateIsResume = (text = '') => {
  const rawText = text || '';
  const lowerText = rawText.toLowerCase();
  const trimmed = rawText.trim();

  if (!trimmed || trimmed.length < 80) {
    return {
      isValid: false,
      reason: 'Could not extract readable text from this file. If this is a photo, scanned image, or certificate, please upload a text-based resume (PDF, DOCX, or TXT).'
    };
  }

  // 1. Identify standard resume sections (Experience, Skills, Education, Projects, Certifications)
  const hasExperience = /\b(experience|work history|employment history|professional experience|projects|key projects|internship|work background)\b/i.test(rawText);
  const hasSkills = /\b(skills|technical skills|core competencies|expertise|technologies|tools|skills & expertise)\b/i.test(rawText);
  const hasEducation = /\b(education|academic background|qualifications|degree|university|college|school|b\.tech|b\.e\.|b\.sc|m\.tech|bachelor|master)\b/i.test(rawText);
  const hasCertifications = /\b(certifications?|courses?|training|licenses?|credentials?)\b/i.test(rawText);

  let sectionCount = 0;
  if (hasExperience) sectionCount++;
  if (hasSkills) sectionCount++;
  if (hasEducation) sectionCount++;
  if (hasCertifications) sectionCount++;

  // 2. Strict Standalone Non-Resume Document Check (Only reject if document lacks standard resume section structure)
  if (sectionCount < 2) {
    const strictStandaloneNonResumeFlags = [
      'this is to certify that', 'statement of accomplishment', 'awarded to',
      'offer letter', 'relieving letter', 'appointment letter', 'letter of recommendation',
      'fee receipt', 'tax invoice', 'invoice #', 'receipt number', 'payment receipt',
      'shipping address', 'bank statement', 'marksheet', 'transcript of records',
      'grade card', 'hall ticket', 'admit card', 'identity card', 'driving license', 'passport',
      'terms of service', 'privacy policy', 'table of contents'
    ];

    const matchedFlag = strictStandaloneNonResumeFlags.find(flag => lowerText.includes(flag));
    if (matchedFlag) {
      return {
        isValid: false,
        reason: `The uploaded document appears to be an official letter or certificate ("${matchedFlag}"), not a full resume or CV. Please upload your complete resume.`
      };
    }

    return {
      isValid: false,
      reason: 'The uploaded file does not contain standard resume sections (such as Work Experience, Skills, or Education). Please upload a valid resume or CV.'
    };
  }

  // 3. Contact & Action Verb Confidence Scoring
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(trimmed);
  const hasPhone = /\+?[0-9\s\-()]{7,15}/.test(trimmed);
  const hasYear = /\b(19|20)\d{2}\b/.test(trimmed);
  const hasActionVerbs = /\b(developed|built|managed|led|designed|created|engineered|implemented|worked|organized|handled|oversaw|spearheaded|achieved|maintained|coordinated)\b/i.test(trimmed);

  let confidenceScore = 0;
  if (sectionCount >= 2) confidenceScore += 45;
  if (hasEmail) confidenceScore += 20;
  if (hasPhone) confidenceScore += 15;
  if (hasYear) confidenceScore += 10;
  if (hasActionVerbs) confidenceScore += 10;

  if (confidenceScore < 45) {
    return {
      isValid: false,
      reason: 'The uploaded document does not appear to be a genuine resume or CV. Please upload a professional resume containing your work experience, skills, and contact details.'
    };
  }

  return { isValid: true };
};

/**
 * Main AI Resume Analysis handler
 */
export const analyzeResumeContent = async (resumeText, targetRole = 'Software Engineer', userContext = {}) => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const cleanedRole = targetRole && targetRole.trim() ? targetRole.trim() : 'Software Engineer';

  // If Gemini or Google API key is present and valid, try calling Gemini API
  if (apiKey) {
    try {
      console.log(`[Gemini AI Engine]: Analyzing resume for role "${cleanedRole}" using Google Gemini API...`);
      const geminiResult = await callGeminiAnalysis(resumeText, cleanedRole, userContext, apiKey);
      if (geminiResult) {
        console.log('[Gemini AI Engine Success]: Resume evaluated successfully via Google Gemini!');
        return geminiResult;
      }
    } catch (err) {
      console.warn('[Gemini AI Engine Error]:', err.message);
      console.log('[AI Engine Notice]: Falling back to built-in CareerPilot AI Engine for Resume Evaluation.');
    }
  }

  // Fallback to Heuristic AI Resume Analyzer Engine
  console.log(`[CareerPilot AI Engine]: Evaluating resume for role "${cleanedRole}" using built-in AI Engine...`);
  return analyzeResumeHeuristic(resumeText, cleanedRole, userContext);
};

/**
 * Call Google Gemini API for structured resume analysis via HTTPS
 */
const callGeminiAnalysis = async (resumeText, targetRole, userContext, apiKey) => {
  const prompt = `
You are an expert ATS (Applicant Tracking System) Specialist and Senior Technical Recruiter.
Analyze the following resume text for a candidate targeting the role: "${targetRole}".

Candidate Name: ${userContext.name || 'Student'}
Target Role: ${targetRole}

Resume Text:
"""
${resumeText.slice(0, 7000)}
"""

Respond strictly with valid JSON only in the following format:
{
  "atsScore": 85,
  "atsCompatibility": "High Compatibility",
  "summary": "Executive summary of candidate's profile strengths and fit for ${targetRole}.",
  "strengths": [
    "Strength 1...",
    "Strength 2...",
    "Strength 3...",
    "Strength 4..."
  ],
  "improvements": [
    "Improvement recommendation 1...",
    "Improvement recommendation 2...",
    "Improvement recommendation 3...",
    "Improvement recommendation 4..."
  ],
  "detectedSkills": ["React", "Node.js", "JavaScript", "MongoDB"],
  "missingKeywords": ["Docker", "Jest", "TypeScript", "CI/CD"],
  "sectionScores": {
    "formatting": 88,
    "skillsMatch": 82,
    "experienceImpact": 78,
    "education": 90
  },
  "suggestedBulletRewrites": [
    {
      "original": "Worked on frontend features using React",
      "improved": "Developed 12+ responsive UI components in React, reducing page render times by 30%",
      "reason": "Quantified technical impact and highlighted key framework usage for ATS scoring."
    }
  ]
}
`;

  const modelsToTry = [
    process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro'
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const parsedData = await makeGeminiHttpsRequest(model, prompt, apiKey);
      const rawText = parsedData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error(`No content returned from Gemini model ${model}`);
      }

      const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanedText);
      return normalizeAnalysisOutput(parsed, targetRole);
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini API Attempt Failed - ${model}]:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini API models failed');
};

/**
 * Helper to execute HTTPS POST request to Gemini API
 */
const makeGeminiHttpsRequest = (model, prompt, apiKey) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse Gemini response JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`Gemini status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API request timed out after 30 seconds'));
    });

    req.write(postData);
    req.end();
  });
};

/**
 * Intelligent Heuristic AI Resume Analyzer Engine
 */
export const analyzeResumeHeuristic = (resumeText, targetRole, userContext = {}) => {
  const text = (resumeText || '').toLowerCase();
  const rawText = resumeText || '';
  const cleanedRole = (targetRole || 'Software Engineer').trim();

  // 1. Comprehensive Skill Extraction Dictionary across Tech, Management, QA, & Operations
  const skillDict = [
    'javascript', 'typescript', 'react', 'react.js', 'vue', 'angular', 'next.js', 'node.js', 'express',
    'python', 'java', 'spring', 'spring mvc', 'c++', 'c#', 'go', 'golang', 'ruby', 'php',
    'sql', 'mysql', 'postgresql', 'sql server', 'redis', 'mongodb', 'aws', 'aws cloud', 'azure', 'gcp',
    'docker', 'kubernetes', 'git', 'github', 'gitlab', 'rest api', 'rest apis', 'graphql',
    'html', 'html5', 'css', 'css3', 'tailwind', 'bootstrap', 'sass', 'jest', 'cypress', 'selenium',
    'ci/cd', 'agile', 'scrum', 'jira', 'linux', 'figma', 'microservices', 'data structures', 'algorithms',
    'system design', 'high level design', 'machine learning', 'deep learning', 'pandas', 'numpy',
    'project management', 'leadership', 'cost management', 'cloud knowledge', 'problem solving',
    'mentorship', 'organizational skills', 'quality control', 'pdca standards', 'documentation',
    'client relations', 'data entry', 'microsoft office', 'word', 'excel', 'powerpoint', 'crm',
    'record-keeping', 'communication', 'a/b testing', 'stakeholder management'
  ];

  const detectedSkills = [];
  skillDict.forEach(skill => {
    if (text.includes(skill)) {
      const formatted = skill
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace('Node.js', 'Node.js')
        .replace('React.js', 'React')
        .replace('Next.js', 'Next.js')
        .replace('Sql Server', 'SQL Server')
        .replace('Sql', 'SQL')
        .replace('Aws Cloud', 'AWS Cloud')
        .replace('Aws', 'AWS')
        .replace('Html5', 'HTML5')
        .replace('Html', 'HTML')
        .replace('Css3', 'CSS3')
        .replace('Css', 'CSS')
        .replace('Ci/cd', 'CI/CD')
        .replace('Rest Api', 'REST API')
        .replace('Rest Apis', 'REST APIs')
        .replace('Pdca Standards', 'PDCA Standards');

      if (!detectedSkills.includes(formatted)) {
        detectedSkills.push(formatted);
      }
    }
  });

  // 2. Role-Based Required Keywords Alignment
  const roleKeywordsMap = {
    'software engineer': ['Java', 'Data Structures', 'Algorithms', 'System Design', 'Git', 'REST API', 'CI/CD', 'SQL'],
    'lead software engineer': ['Java', 'Microservices', 'Kubernetes', 'System Design', 'Leadership', 'AWS Cloud', 'REST APIs'],
    'full stack developer': ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'REST API', 'Tailwind CSS', 'Docker'],
    'frontend developer': ['React', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'Web Performance', 'Figma'],
    'backend developer': ['Node.js', 'Java', 'Python', 'PostgreSQL', 'MongoDB', 'REST API', 'Docker', 'Redis', 'Microservices'],
    'project manager': ['Project Management', 'Leadership', 'Cost Management', 'Agile', 'Scrum', 'Jira', 'Stakeholder Management'],
    'it project manager': ['IT Project Management', 'Cloud Knowledge', 'Budget Management', 'Agile', 'Leadership', 'Scrum'],
    'quality control inspector': ['Quality Control', 'PDCA Standards', 'Documentation', 'Inspection', 'Safety Compliance'],
    'data scientist': ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'SQL', 'Machine Learning', 'Data Visualization'],
    'data analyst': ['SQL', 'Excel', 'Python', 'Tableau', 'Power BI', 'Data Entry', 'Statistics'],
    'data entry': ['Data Entry', 'Microsoft Office', 'Excel', 'Data Management', 'Typing Speed', 'Accuracy', 'CRM'],
    'ui/ux designer': ['Figma', 'Wireframing', 'Prototyping', 'User Research', 'Design Systems', 'Usability Testing'],
    'devops engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux', 'Bash', 'Prometheus']
  };

  const matchedRoleKey = Object.keys(roleKeywordsMap).find(k => cleanedRole.toLowerCase().includes(k)) || 'software engineer';
  const targetKeywords = roleKeywordsMap[matchedRoleKey];
  const missingKeywords = targetKeywords.filter(kw => !text.includes(kw.toLowerCase()));

  // 3. Structural Section Markers (Standard ATS Heading Check)
  const hasSummaryHeader = /\b(summary|professional summary|about me|profile)\b/i.test(rawText);
  const hasSkillsHeader = /\b(skills|technical skills|core competencies|expertise)\b/i.test(rawText);
  const hasExperienceHeader = /\b(experience|professional experience|work history|employment history)\b/i.test(rawText);
  const hasEducationHeader = /\b(education|academic background|qualifications)\b/i.test(rawText);
  const hasAchievementsHeader = /\b(achievements|key accomplishments|projects|certifications)\b/i.test(rawText);

  // 4. Strong Action Verbs & Metrics Detection (Matching high-scoring reference resumes)
  const actionVerbs = [
    'developed', 'built', 'implemented', 'designed', 'architected', 'optimized',
    'spearheaded', 'created', 'improved', 'automated', 'engineered', 'increased',
    'reduced', 'led', 'managed', 'oversaw', 'directed', 'coordinated', 'trained', 'executed'
  ];

  let actionVerbCount = 0;
  actionVerbs.forEach(v => {
    if (text.includes(v)) actionVerbCount++;
  });

  // Quantified metrics pattern: percentages (15%), currency ($2M, $4 billion), volumes (15M trade events), ranges (9-12 man-hour)
  const metricRegex = /\d+%|\$\d+|\b\d+(\.\d+)?\s*(m|k|billion|million|man-hour|hours|users|engineers|projects)\b|\b\d+\+\b/i;
  const hasMetrics = metricRegex.test(rawText);
  const metricMatches = (rawText.match(/(\d+%|\$\d+|[0-9]+\+|\b(reduced|increased|improved|boosted|saved|scaled)\b)/gi) || []).length;

  const hasLinks = /github|linkedin|portfolio|http|\.com/i.test(text);
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(rawText);
  const hasPhone = /\+?[0-9\s\-()]{7,15}/.test(rawText);

  // 5. Section Weight & Accurate ATS Metric Calculations (Benchmark standard)

  // A. Formatting & Structure Score (20% Weight)
  let formattingScore = 70;
  if (hasEmail) formattingScore += 6;
  if (hasPhone) formattingScore += 6;
  if (hasLinks) formattingScore += 6;
  if (hasSummaryHeader && hasSkillsHeader && hasExperienceHeader && hasEducationHeader) formattingScore += 10;
  if (rawText.length >= 300 && rawText.length <= 5000) formattingScore += 6;
  formattingScore = Math.min(formattingScore, 98);

  // B. Skills Match Score (30% Weight)
  const matchedKeywordCount = targetKeywords.filter(kw => text.includes(kw.toLowerCase())).length;
  const keywordRatio = targetKeywords.length > 0 ? (matchedKeywordCount / targetKeywords.length) : 0.6;
  let skillsMatchScore = Math.round(50 + (keywordRatio * 35) + Math.min(detectedSkills.length * 2, 13));
  skillsMatchScore = Math.min(skillsMatchScore, 98);

  // C. Experience & Bullet Impact Score (35% Weight)
  let experienceImpactScore = 55;
  if (actionVerbCount >= 5) experienceImpactScore += 20;
  else if (actionVerbCount >= 3) experienceImpactScore += 14;
  else if (actionVerbCount >= 1) experienceImpactScore += 8;

  if (metricMatches >= 3) experienceImpactScore += 20;
  else if (metricMatches >= 1) experienceImpactScore += 12;

  if (hasAchievementsHeader) experienceImpactScore += 5;
  experienceImpactScore = Math.min(experienceImpactScore, 98);

  // D. Education & Credential Score (15% Weight)
  let educationScore = hasEducationHeader ? 94 : 75;

  // Weighted ATS Score Formula
  const atsScore = Math.round(
    (skillsMatchScore * 0.30) +
    (experienceImpactScore * 0.35) +
    (formattingScore * 0.20) +
    (educationScore * 0.15)
  );

  let atsCompatibility = 'Needs ATS Optimization';
  if (atsScore >= 88) atsCompatibility = 'Elite ATS Match (Top 5% Benchmark)';
  else if (atsScore >= 78) atsCompatibility = 'Strong ATS Compatibility';
  else if (atsScore >= 65) atsCompatibility = 'Moderate ATS Compatibility';

  // 6. Detailed Strengths based on Reference Benchmark Resumes
  const strengths = [];

  if (hasSummaryHeader) {
    strengths.push('Clear Professional Summary section matching top ATS layout standards.');
  }

  if (detectedSkills.length >= 4) {
    strengths.push(`Solid technical skill coverage identified (${detectedSkills.slice(0, 4).join(', ')}).`);
  } else if (detectedSkills.length > 0) {
    strengths.push(`Identified core domain skills: ${detectedSkills.join(', ')}.`);
  }

  if (metricMatches >= 2) {
    strengths.push('Contains quantified impact metrics (e.g. percentages, cost savings, project scale) required by top recruiters.');
  } else if (actionVerbCount >= 3) {
    strengths.push('Uses active action verbs (e.g. Led, Designed, Implemented, Managed) to lead accomplishment bullets.');
  }

  if (hasLinks) {
    strengths.push('Includes professional profile & portfolio references (LinkedIn/GitHub) in header.');
  }

  if (hasEducationHeader) {
    strengths.push('Standard academic qualification section formatted for automated ATS parsing.');
  }

  // Ensure 4 strengths
  while (strengths.length < 4) {
    strengths.push(`Good structure alignment for ${cleanedRole} job screeners.`);
  }

  // 7. Identified Weakness Areas
  const weaknesses = [];
  if (missingKeywords.length > 0) {
    weaknesses.push(`Missing target role keywords for ${cleanedRole}: ${missingKeywords.slice(0, 3).join(', ')}.`);
  }
  if (metricMatches < 2) {
    weaknesses.push('Lacks quantified accomplishment metrics (e.g., missing percentages, monetary figures, or operational scale).');
  }
  if (actionVerbCount < 3) {
    weaknesses.push('Weak action verb density; bullet points rely on passive phrases ("responsible for", "worked on").');
  }
  if (!hasLinks) {
    weaknesses.push('Missing professional links (LinkedIn or GitHub profile URLs) in contact section.');
  }
  if (detectedSkills.length < 5) {
    weaknesses.push('Limited technical & domain skill keywords detected for automated ATS screening.');
  }
  while (weaknesses.length < 3) {
    weaknesses.push('Non-standard section headers compared to top candidate ATS templates.');
  }

  // 8. Actionable Improvement Recommendations
  const improvements = [];

  if (missingKeywords.length > 0) {
    improvements.push(`Add missing role keywords: ${missingKeywords.slice(0, 4).join(', ')} to boost ATS keyword match.`);
  }

  if (metricMatches < 2) {
    improvements.push('Quantify your experience bullets with concrete data (e.g. "Reduced latency by 25%", "Managed $2M portfolio", "Trained 5+ team members").');
  }

  if (!hasLinks) {
    improvements.push('Include clickable LinkedIn and GitHub/Portfolio links in your contact header.');
  }

  if (actionVerbCount < 4) {
    improvements.push('Start every work bullet with strong action verbs like "Spearheaded", "Architected", "Engineered", or "Oversaw".');
  }

  if (detectedSkills.length < 6) {
    improvements.push('Group your Technical Skills under dedicated categories (Languages, Frameworks, Tools) as seen in top ATS templates.');
  }

  while (improvements.length < 4) {
    improvements.push('Ensure standard ATS heading labels: SUMMARY, SKILLS, EXPERIENCE, EDUCATION, and ACHIEVEMENTS.');
  }

  // 9. Executive Summary
  const summary = `Resume evaluated against ATS benchmark standards for '${cleanedRole}'. Scored ${atsScore}/100 ATS compatibility. ${atsScore >= 80
      ? 'Exhibits strong layout structure, clear skill categorization, and quantifiable achievement metrics aligned with top candidate profiles.'
      : 'Demonstrates solid core content but requires additional role keywords and quantified bullet metrics to reach top candidate ATS ranking.'
    }`;

  // 10. Benchmark Bullet Rewrites
  const suggestedBulletRewrites = [
    {
      original: 'Responsible for work activities and assisting team members',
      improved: `Spearheaded delivery of 8+ core deliverables using ${detectedSkills[0] || 'Java'} & ${detectedSkills[1] || 'SQL'}, boosting project efficiency by 25%`,
      reason: 'Replaced passive duty statement with a strong action verb and measurable business impact.'
    },
    {
      original: 'Worked on software projects and system maintenance',
      improved: `Architected scalable solutions handling 10k+ daily transactions with ${detectedSkills[2] || 'Cloud'} infrastructure and optimized database indexing`,
      reason: 'Added operational scale, technical stack specifics, and performance metrics.'
    }
  ];

  return {
    atsScore,
    atsCompatibility,
    summary,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    improvements: improvements.slice(0, 4),
    detectedSkills,
    missingKeywords,
    sectionScores: {
      formatting: formattingScore,
      skillsMatch: skillsMatchScore,
      experienceImpact: experienceImpactScore,
      education: educationScore,
    },
    suggestedBulletRewrites,
  };
};

/**
 * Helper to ensure JSON response structure matches expectations
 */
const normalizeAnalysisOutput = (parsed, targetRole) => {
  const atsScore = Math.max(0, Math.min(100, parseInt(parsed.atsScore) || 75));
  let atsCompatibility = parsed.atsCompatibility || (atsScore >= 80 ? 'High Compatibility' : atsScore >= 65 ? 'Moderate Compatibility' : 'Needs Optimization');

  return {
    atsScore,
    atsCompatibility,
    summary: parsed.summary || `Resume evaluated for ${targetRole} with an ATS score of ${atsScore}/100.`,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : ['Clear overall resume structure'],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5) : ['Lacks quantified metrics in bullet points'],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : ['Add quantified metrics to project bullet points'],
    detectedSkills: Array.isArray(parsed.detectedSkills) ? parsed.detectedSkills : [],
    missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
    sectionScores: {
      formatting: Math.min(100, parseInt(parsed.sectionScores?.formatting) || 80),
      skillsMatch: Math.min(100, parseInt(parsed.sectionScores?.skillsMatch) || 78),
      experienceImpact: Math.min(100, parseInt(parsed.sectionScores?.experienceImpact) || 75),
      education: Math.min(100, parseInt(parsed.sectionScores?.education) || 85),
    },
    suggestedBulletRewrites: Array.isArray(parsed.suggestedBulletRewrites) ? parsed.suggestedBulletRewrites : [],
  };
};
