import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Cloud, ShieldCheck, BarChart3, Layout, Server, ArrowUpRight, DollarSign } from 'lucide-react';

export const CareersSection = ({ onOpenAuth }) => {
  const careers = [
    {
      icon: <Cpu size={28} />,
      title: 'AI & ML Engineer',
      desc: 'Build foundational LLMs, RAG architecture, and scalable AI infrastructure.',
      salary: '$165,000 / yr',
    },
    {
      icon: <Cloud size={28} />,
      title: 'Cloud Architect',
      desc: 'Design resilient microservices, Kubernetes clusters, and AWS serverless systems.',
      salary: '$155,000 / yr',
    },
    {
      icon: <ShieldCheck size={28} />,
      title: 'Cybersecurity Lead',
      desc: 'Protect enterprise infrastructure, execute threat modeling, and zero-trust security.',
      salary: '$148,000 / yr',
    },
    {
      icon: <BarChart3 size={28} />,
      title: 'Data Science Lead',
      desc: 'Transform complex big data into predictive intelligence and strategic insights.',
      salary: '$150,000 / yr',
    },
    {
      icon: <Layout size={28} />,
      title: 'Product Design Lead',
      desc: 'Craft world-class UX design systems, user journeys, and sleek digital experiences.',
      salary: '$140,000 / yr',
    },
    {
      icon: <Server size={28} />,
      title: 'DevOps & Site Reliability',
      desc: 'Automate CI/CD pipelines, high-availability deployments, and system telemetry.',
      salary: '$152,000 / yr',
    },
  ];

  return (
    <section id="careers" className="landing-section dark-alt-bg">
      <div className="landing-container">
        <div className="section-header center">
          <span className="section-tag">HIGH-DEMAND TRACKS</span>
          <h2 className="section-title">Accelerate Into Top AI & Tech Roles</h2>
          <p className="section-subtitle">
            Curated career paths backed by real-time hiring trends and market compensation intelligence.
          </p>
        </div>

        <div className="careers-grid">
          {careers.map((career, idx) => (
            <motion.div
              key={idx}
              className="career-card-horizontal"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
            >
              <div className="career-card-left">
                <div className="career-icon-box">{career.icon}</div>
                <div className="career-info">
                  <h3 className="career-name">{career.title}</h3>
                  <p className="career-desc">{career.desc}</p>
                  <div className="career-salary-tag">
                    <DollarSign size={16} />
                    <span>Avg Salary: <strong>{career.salary}</strong></span>
                  </div>
                </div>
              </div>

              <div className="career-card-right">
                <button
                  onClick={() => onOpenAuth('register')}
                  className="btn-career-explore"
                >
                  <span>Explore Track</span>
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
