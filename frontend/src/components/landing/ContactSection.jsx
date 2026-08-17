import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

export const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 4000);
  };

  return (
    <section id="contact" className="landing-section dark-alt-bg">
      <div className="landing-container contact-container">
        {/* Left Column: Contact Info */}
        <motion.div
          className="contact-left"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">GET IN TOUCH</span>
          <h2 className="section-title text-left">We'd Love to Hear From You</h2>
          <p className="section-subtitle text-left">
            Have questions about enterprise mentorship, recruiter partnerships, or platform features? Reach out to our team.
          </p>

          <div className="contact-info-list">
            <div className="contact-info-item">
              <div className="contact-icon-box">
                <Mail size={22} />
              </div>
              <div>
                <span className="info-label">Direct Email</span>
                <span className="info-val">support@careerpilot.ai</span>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-box">
                <Phone size={22} />
              </div>
              <div>
                <span className="info-label">Phone Support</span>
                <span className="info-val">+1 (800) 555-PILOT</span>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-box">
                <MapPin size={22} />
              </div>
              <div>
                <span className="info-label">Headquarters</span>
                <span className="info-val">500 University Ave, Palo Alto, CA 94301</span>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-box">
                <Clock size={22} />
              </div>
              <div>
                <span className="info-label">Response Time</span>
                <span className="info-val">Within 24 Hours • 24/7 AI Concierge</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Modern Contact Form */}
        <motion.div
          className="contact-right"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="contact-form-glass">
            <h3 className="form-card-title">Send Us a Message</h3>

            {submitted ? (
              <div className="form-success-state">
                <CheckCircle2 size={48} className="success-icon" />
                <h4>Message Sent Successfully!</h4>
                <p>Thank you for reaching out. A CareerPilot AI specialist will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="landing-contact-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    className="landing-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@company.com"
                    className="landing-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Inquiry Type</label>
                  <select
                    className="landing-input landing-select"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Enterprise Mentorship">Enterprise Mentorship</option>
                    <option value="Recruiter Hiring Partner">Recruiter Hiring Partner</option>
                    <option value="Technical Support">Technical Support</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us how we can help your career goals..."
                    className="landing-input landing-textarea"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn-landing-primary full-w form-submit-btn">
                  <span>Send Message</span>
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
