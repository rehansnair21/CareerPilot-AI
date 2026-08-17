import React from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { CareersSection } from './CareersSection';
import { AboutSection } from './AboutSection';
import { HowItWorksSection } from './HowItWorksSection';
import { StatisticsSection } from './StatisticsSection';
import { TestimonialsSection } from './TestimonialsSection';
import { ContactSection } from './ContactSection';
import { Footer } from './Footer';

export const LandingPage = ({ onOpenAuth }) => {
  return (
    <div className="landing-page-wrapper">
      <Navbar onOpenAuth={onOpenAuth} />
      <main className="landing-main-content">
        <HeroSection onOpenAuth={onOpenAuth} />
        <FeaturesSection />
        <CareersSection onOpenAuth={onOpenAuth} />
        <AboutSection />
        <HowItWorksSection />
        <StatisticsSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};
