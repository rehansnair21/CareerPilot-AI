import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, PlayCircle, ShieldCheck, Zap, TrendingUp, Award, CheckCircle2 } from 'lucide-react';

export const HeroSection = ({ onOpenAuth }) => {
  return (
    <section id="hero" className="landing-section hero-section">
      <div className="landing-container hero-container">
        {/* Left Column: Hero Copy & Actions */}
        <motion.div
          className="hero-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-badge">
            <Sparkles size={16} className="badge-sparkle" />
            <span>Next-Gen AI Career Acceleration</span>
          </div>

          <h1 className="hero-title">
            Navigate Your Future With <span className="gradient-text">AI Precision</span>
          </h1>

          <p className="hero-description">
            CareerPilot AI analyzes your skills, generates personalized learning roadmaps, matches you with industry mentors, and fast-tracks high-paying tech roles.
          </p>

          <div className="hero-actions">
            <button
              onClick={() => onOpenAuth('register')}
              className="btn-landing-primary hero-btn-main"
            >
              <span>Get Started Free</span>
              <ArrowRight size={20} />
            </button>

            <a href="#how-it-works" className="btn-landing-secondary hero-btn-sub">
              <PlayCircle size={20} />
              <span>Watch Demo</span>
            </a>
          </div>

          <div className="hero-trust-bar">
            <div className="trust-item">
              <CheckCircle2 size={18} className="trust-icon" />
              <span>Free 14-day trial</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={18} className="trust-icon" />
              <span>No credit card required</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={18} className="trust-icon" />
              <span>Instant AI Roadmap</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Hero Dashboard Illustration */}
        <motion.div
          className="hero-right"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="dashboard-hero-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="mockup-address-bar">careerpilot.ai/dashboard/overview</div>
              <div className="mockup-badge">
                <Zap size={12} /> AI Live
              </div>
            </div>

            <div className="mockup-body">
              {/* Dashboard Top Stats Row */}
              <div className="mockup-stats-row">
                <div className="mockup-stat-card">
                  <span className="stat-label">AI Readiness Index</span>
                  <div className="stat-value-group">
                    <span className="stat-val gradient-text">94.8%</span>
                    <span className="stat-pill green">+12.4%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: '94%' }}></div>
                  </div>
                </div>

                <div className="mockup-stat-card">
                  <span className="stat-label">Target Career Match</span>
                  <div className="stat-value-group">
                    <span className="stat-val">Lead AI Engineer</span>
                  </div>
                  <span className="stat-sub">$165,000 / yr avg.</span>
                </div>
              </div>

              {/* Central Roadmap Visualizer */}
              <div className="mockup-main-panel">
                <div className="panel-header">
                  <div>
                    <h4 className="panel-title">AI Skill Gap Analysis</h4>
                    <p className="panel-subtitle">3 critical milestones remaining for Senior Tier</p>
                  </div>
                  <span className="live-status-pill">Active Roadmap</span>
                </div>

                <div className="roadmap-flow">
                  <div className="roadmap-step completed">
                    <div className="step-badge">01</div>
                    <div className="step-info">
                      <span className="step-name">Advanced PyTorch & LLMs</span>
                      <span className="step-status">Completed • Verified</span>
                    </div>
                  </div>

                  <div className="roadmap-connector active"></div>

                  <div className="roadmap-step active">
                    <div className="step-badge active">02</div>
                    <div className="step-info">
                      <span className="step-name">RAG & Vector Databases</span>
                      <span className="step-status">In Progress • 85% Done</span>
                    </div>
                  </div>

                  <div className="roadmap-connector"></div>

                  <div className="roadmap-step locked">
                    <div className="step-badge">03</div>
                    <div className="step-info">
                      <span className="step-name">Distributed Model Training</span>
                      <span className="step-status">Next Milestone</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Live Badge Overlay */}
              <motion.div
                className="hero-floating-badge top-right"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Award className="badge-icon gold" size={24} />
                <div>
                  <span className="badge-title">Top 1% Candidate</span>
                  <span className="badge-desc">Matched with 5 Tech Recrutiers</span>
                </div>
              </motion.div>

              <motion.div
                className="hero-floating-badge bottom-left"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <TrendingUp className="badge-icon blue" size={24} />
                <div>
                  <span className="badge-title">Mentorship Match</span>
                  <span className="badge-desc">Session booked with Meta Staff Eng</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
