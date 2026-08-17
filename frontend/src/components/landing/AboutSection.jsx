import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Award, CheckCircle, Sparkles, Zap, Users } from 'lucide-react';

export const AboutSection = () => {
  const highlights = [
    {
      icon: <Sparkles size={20} />,
      title: '99.4% Match Accuracy',
      desc: 'Deep learning algorithms match skills to recruiter expectations.',
    },
    {
      icon: <Users size={20} />,
      title: 'Top 1% Global Mentors',
      desc: 'Verified practitioners from Tier-1 tech platforms and labs.',
    },
    {
      icon: <Zap size={20} />,
      title: '3.5x Faster Outcomes',
      desc: 'Streamlined roadmaps reduce transition time from months to weeks.',
    },
  ];

  return (
    <section id="about" className="landing-section">
      <div className="landing-container about-container">
        {/* Left Column: Visual Illustration Graphic */}
        <motion.div
          className="about-left"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="about-illustration-card">
            <div className="illustration-glow-bg"></div>

            <div className="illustration-graphic">
              <div className="graphic-ring outer"></div>
              <div className="graphic-ring middle"></div>
              <div className="graphic-center-node">
                <Sparkles size={36} className="center-node-icon" />
              </div>

              {/* Orbiting Feature Nodes */}
              <div className="orbit-node node-1">
                <Target size={18} />
                <span>Skill Alignment</span>
              </div>
              <div className="orbit-node node-2">
                <Award size={18} />
                <span>Verified Badges</span>
              </div>
              <div className="orbit-node node-3">
                <Eye size={18} />
                <span>Recruiter Radar</span>
              </div>
            </div>

            <div className="illustration-glass-footer">
              <div className="footer-stat">
                <span className="stat-number">100K+</span>
                <span className="stat-label">Roadmaps Generated</span>
              </div>
              <div className="footer-divider"></div>
              <div className="footer-stat">
                <span className="stat-number">45+</span>
                <span className="stat-label">Countries Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: About Content */}
        <motion.div
          className="about-right"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="section-tag">ABOUT CAREERPILOT AI</span>
          <h2 className="section-title text-left">
            Bridging Human Ambition with Machine Intelligence
          </h2>

          <div className="about-block">
            <div className="about-block-header">
              <Target size={22} className="about-icon" />
              <h3>Our Mission</h3>
            </div>
            <p className="about-text">
              To democratize world-class career guidance by combining artificial intelligence with authentic human mentorship, ensuring every individual unlocks their true professional potential regardless of background.
            </p>
          </div>

          <div className="about-block">
            <div className="about-block-header">
              <Eye size={22} className="about-icon" />
              <h3>Our Vision</h3>
            </div>
            <p className="about-text">
              To build the global standard for workforce intelligence, where career progression is transparent, data-driven, and continuously aligned with the evolving global technology landscape.
            </p>
          </div>

          {/* Three Highlight Cards */}
          <div className="about-highlights-grid">
            {highlights.map((h, i) => (
              <div key={i} className="about-highlight-card">
                <div className="highlight-icon-box">{h.icon}</div>
                <div>
                  <h4 className="highlight-title">{h.title}</h4>
                  <p className="highlight-desc">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
