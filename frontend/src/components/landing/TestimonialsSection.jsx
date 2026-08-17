import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Senior AI Engineer at Meta',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      text: 'CareerPilot AI identified key gaps in my system design and transformer knowledge within 5 minutes. The roadmap got me from senior developer to lead AI engineer with a 45% pay bump.',
      rating: 5,
    },
    {
      name: 'Sophia Rodriguez',
      role: 'Data Scientist at Snowflake',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
      text: 'The 1-on-1 mentor match was an absolute game changer. My mentor helped me refine my portfolio projects and gave me direct interview prep that matched exact recruiter questions.',
      rating: 5,
    },
    {
      name: 'David Kim',
      role: 'Full Stack Architect at Stripe',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      text: 'Bypassing noisy job boards and having recruiter visibility directly through CareerPilot AI landed me 4 interviews in my first week. Incredible platform aesthetics and accuracy!',
      rating: 5,
    },
  ];

  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="section-header center">
          <span className="section-tag">SUCCESS STORIES</span>
          <h2 className="section-title">Trusted by Top Tech Professionals</h2>
          <p className="section-subtitle">
            See how ambitious engineers and leaders transformed their careers with CareerPilot AI.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              className="testimonial-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="testimonial-card-header">
                <div className="stars-row">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={18} className="star-filled" />
                  ))}
                </div>
                <Quote size={28} className="quote-icon" />
              </div>

              <p className="testimonial-quote">"{t.text}"</p>

              <div className="testimonial-author">
                <img src={t.avatar} alt={t.name} className="author-avatar" />
                <div>
                  <h4 className="author-name">{t.name}</h4>
                  <span className="author-role">{t.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
