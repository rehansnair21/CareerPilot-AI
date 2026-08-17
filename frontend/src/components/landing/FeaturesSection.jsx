import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Route, Users, FileCheck, Briefcase, TrendingUp } from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      icon: <Sparkles size={32} className="feature-icon-svg" />,
      title: 'AI Skill Gap Analyzer',
      description:
        'Instantly audit your current skillset against industry standards and pinpoint high-impact learning priorities with precision.',
    },
    {
      icon: <Route size={32} className="feature-icon-svg" />,
      title: 'Dynamic Career Roadmaps',
      description:
        'Adaptive step-by-step milestones tailored to your target job role, timeline, and preferred learning velocity.',
    },
    {
      icon: <Users size={32} className="feature-icon-svg" />,
      title: '1-on-1 Verified Mentor Match',
      description:
        'Connect directly with vetted senior engineers and hiring leads from Silicon Valley to guide your career growth.',
    },
    {
      icon: <FileCheck size={32} className="feature-icon-svg" />,
      title: 'ATS Resume & Portfolio Optimizer',
      description:
        'AI engine scans your resume against corporate applicant tracking systems to maximize recruiter callback rates.',
    },
    {
      icon: <Briefcase size={32} className="feature-icon-svg" />,
      title: 'Direct Recruiter Pipeline',
      description:
        'Bypass traditional job portals and place your AI-verified profile directly in front of active hiring managers.',
    },
    {
      icon: <TrendingUp size={32} className="feature-icon-svg" />,
      title: 'Real-Time Salary Intelligence',
      description:
        'Access live compensation benchmarks, equity estimates, and negotiation leverage insights for every tech role.',
    },
  ];

  return (
    <section id="features" className="landing-section">
      <div className="landing-container">
        <div className="section-header center">
          <span className="section-tag">POWERFUL CAPABILITIES</span>
          <h2 className="section-title">Engineered for Rapid Career Growth</h2>
          <p className="section-subtitle">
            Everything you need to master high-demand tech skills and land your target offer.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="feature-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="feature-icon-wrapper">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
