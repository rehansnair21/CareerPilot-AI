import React, { useState, useEffect } from 'react';
import { Compass, Menu, X, Sparkles, ArrowRight } from 'lucide-react';

export const Navbar = ({ onOpenAuth }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'Features', href: '#features' },
    { name: 'Careers', href: '#careers' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="landing-nav-container">
        {/* Left: Brand Logo & Title */}
        <a href="#hero" className="landing-brand">
          <div className="landing-logo-box">
            <Compass className="landing-logo-icon" size={26} />
          </div>
          <span className="landing-brand-text">
            CareerPilot <span className="landing-brand-badge">AI</span>
          </span>
        </a>

        {/* Desktop Links & Actions */}
        <div className="landing-nav-links-desktop">
          <nav className="landing-nav-menu">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="landing-nav-item">
                {link.name}
              </a>
            ))}
          </nav>

          <div className="landing-nav-actions">
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-landing-secondary"
            >
              Login
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="btn-landing-primary"
            >
              <span>Register</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <nav className="mobile-nav-links">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="mobile-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="mobile-nav-actions">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('login');
              }}
              className="btn-landing-secondary full-w"
            >
              Login
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('register');
              }}
              className="btn-landing-primary full-w"
            >
              Register
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
