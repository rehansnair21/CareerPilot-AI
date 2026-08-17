import React from 'react';
import { Compass, Github, Twitter, Linkedin, Youtube, ArrowUp } from 'lucide-react';

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="footer-top-grid">
          {/* Column 1: Brand Info */}
          <div className="footer-col brand-col">
            <a href="#hero" className="landing-brand footer-brand">
              <div className="landing-logo-box">
                <Compass className="landing-logo-icon" size={24} />
              </div>
              <span className="landing-brand-text">
                CareerPilot <span className="landing-brand-badge">AI</span>
              </span>
            </a>

            <p className="footer-brand-desc">
              The next-generation AI career acceleration platform. Map your roadmaps, close skill gaps, and connect with top tech recruiters.
            </p>

            <div className="footer-socials">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="social-link" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-link" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-link" aria-label="YouTube">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <ul className="footer-links-list">
              <li><a href="#features">AI Skill Analyzer</a></li>
              <li><a href="#careers">Career Roadmaps</a></li>
              <li><a href="#how-it-works">Mentor Matching</a></li>
              <li><a href="#hero">Resume ATS Optimizer</a></li>
              <li><a href="#careers">Salary Intelligence</a></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <ul className="footer-links-list">
              <li><a href="#about">Documentation</a></li>
              <li><a href="#careers">Tech Career Index 2026</a></li>
              <li><a href="#how-it-works">Mentorship Guide</a></li>
              <li><a href="#about">Student Case Studies</a></li>
              <li><a href="#contact">Community Forum</a></li>
            </ul>
          </div>

          {/* Column 4: Company & Legal */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links-list">
              <li><a href="#about">About CareerPilot AI</a></li>
              <li><a href="#careers">We're Hiring</a></li>
              <li><a href="#contact">Press & Media</a></li>
              <li><a href="#contact">Privacy Policy</a></li>
              <li><a href="#contact">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} CareerPilot AI Inc. All rights reserved. Designed with precision for global tech leaders.
          </p>

          <button onClick={scrollToTop} className="back-to-top-btn" aria-label="Back to Top">
            <span>Back to top</span>
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};
