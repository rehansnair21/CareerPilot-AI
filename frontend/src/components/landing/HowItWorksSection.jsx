import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Cpu, Compass, Rocket } from 'lucide-react';

export const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      icon: <UserPlus size={36} />,
      title: 'Build Profile & Upload Resume',
      desc: 'Connect your GitHub, LinkedIn, or upload your resume for immediate AI skill parsing.',
    },
    {
      number: '02',
      icon: <Cpu size={36} />,
      title: 'AI Gap & Roadmap Generation',
      desc: 'Our engine identifies missing core competencies and crafts a personalized learning plan.',
    },
    {
      number: '03',
      icon: <Compass size={36} />,
      title: 'Mentorship & Project Sprints',
      desc: 'Execute real-world portfolio projects under direct guidance from verified industry mentors.',
    },
    {
      number: '04',
      icon: <Rocket size={36} />,
      title: 'Direct Hiring & Placement',
      desc: 'Get fast-tracked to recruiter pipelines and interview directly with partner companies.',
    },
  ];

  return (
    <section id="how-it-works" className="landing-section dark-alt-bg">
      <div className="landing-container">
        <div className="section-header center">
          <span className="section-tag">STREAMLINED WORKFLOW</span>
          <h2 className="section-title">How CareerPilot AI Works</h2>
          <p className="section-subtitle">
            A battle-tested 4-step framework to transition from where you are to your dream role.
          </p>
        </div>

        <div className="timeline-horizontal-container">
          <div className="timeline-connecting-line"></div>

          <div className="timeline-steps-grid">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                className="timeline-step-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
              >
                <div className="step-header">
                  <span className="step-number-badge">{step.number}</span>
                  <div className="step-icon-circle">{step.icon}</div>
                </div>

                <h3 className="step-card-title">{step.title}</h3>
                <p className="step-card-desc">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
