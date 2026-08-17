import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, BookOpen, Layers } from 'lucide-react';

export const StatisticsSection = () => {
  const stats = [
    {
      icon: <Users size={28} className="stat-icon-blue" />,
      number: '1,000+',
      label: 'Students Placed',
    },
    {
      icon: <Target size={28} className="stat-icon-cyan" />,
      number: '95%',
      label: 'Recommendation Accuracy',
    },
    {
      icon: <BookOpen size={28} className="stat-icon-indigo" />,
      number: '500+',
      label: 'Verified Courses',
    },
    {
      icon: <Layers size={28} className="stat-icon-purple" />,
      number: '300+',
      label: 'Industry Projects',
    },
  ];

  return (
    <section className="landing-section stats-section">
      <div className="landing-container">
        <motion.div
          className="stats-banner-glass"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="stats-grid-horizontal">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-icon-container">{stat.icon}</div>
                <div className="stat-content">
                  <span className="stat-big-number gradient-text">{stat.number}</span>
                  <span className="stat-label-text">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
