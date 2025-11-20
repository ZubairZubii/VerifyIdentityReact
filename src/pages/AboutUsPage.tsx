"use client"

import type React from "react"
import { motion } from "framer-motion"
import BackButton from "../components/BackButton"

const AboutUsPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  }

  const features = [
    {
      icon: "fas fa-users",
      title: "Help individuals connect",
      description: "Building bridges between people and businesses",
    },
    {
      icon: "fas fa-handshake",
      title: "Support business relationships",
      description: "Fostering trust in professional interactions",
    },
    {
      icon: "fas fa-cogs",
      title: "Simplify the process",
      description: "Making verification easy and accessible",
    },
  ]

  const stats = [
    { number: "2024", label: "Founded" },
    { number: "100%", label: "Secure" },
    { number: "24/7", label: "Support" },
    { number: "∞", label: "Possibilities" },
  ]

  return (
    <div className="about-us-page">
      <BackButton />

      <motion.div className="about-us-container" variants={containerVariants} initial="hidden" animate="visible">
        {/* Hero Section */}
        <motion.div className="about-hero" variants={itemVariants}>
          <div className="about-hero-content">
            <motion.div className="about-logo" whileHover={{ scale: 1.05, rotate: 5 }} transition={{ duration: 0.3 }}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-22%20at%2016.42.08_dab971c7.jpg-9BED9Q025888YEH9vNPqUosd8Nyz0O.jpeg"
                alt="Verify Customer Logo"
              />
            </motion.div>
            <h1>About Verify Customer</h1>
            <p className="hero-subtitle">Connecting Customers and Companies</p>
            <div className="hero-divider"></div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div className="stats-section" variants={itemVariants}>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div className="about-content" variants={itemVariants}>
          <div className="content-section">
            <div className="section-icon">
              <i className="fas fa-rocket"></i>
            </div>
            <h2>Our Journey</h2>
            <div className="quote-container">
              <blockquote>
                "The best way to predict the future is to create it."
                <cite>- Peter Drucker</cite>
              </blockquote>
            </div>
            <p>
              Founded in 2024, our verification system addresses the need for trusted connections. Our platform matches
              customer and company information, creating a more connected and secure experience for everyone involved.
            </p>
            <p>
              The Verify Customer Team believes that all interactions should be reliable and trustworthy. We developed
              this comprehensive system to support that vision and make verification accessible to all.
            </p>
          </div>
        </motion.div>

        {/* Mission Section */}
        <motion.div className="mission-section" variants={itemVariants}>
          <div className="section-header">
            <div className="section-icon">
              <i className="fas fa-bullseye"></i>
            </div>
            <h2>Our Mission: More Reliable Connections</h2>
            <p>
              The Verify Customer Team is committed to making interactions more reliable and secure. We aim to build a
              foundation of trust in the digital world.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* What We Do Section */}
        <motion.div className="what-we-do-section" variants={itemVariants}>
          <div className="section-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h2>What We Do</h2>
          <div className="service-cards">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-user-check"></i>
              </div>
              <h3>Identity Verification</h3>
              <p>Secure and reliable identity verification for individuals and businesses</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-building"></i>
              </div>
              <h3>Business Validation</h3>
              <p>Comprehensive business verification and validation services</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-lock"></i>
              </div>
              <h3>Secure Platform</h3>
              <p>State-of-the-art security measures to protect your information</p>
            </div>
          </div>
        </motion.div>

        {/* Future Vision Section */}
        <motion.div className="future-section" variants={itemVariants}>
          <div className="future-content">
            <div className="section-icon">
              <i className="fas fa-eye"></i>
            </div>
            <h2>The Future</h2>
            <p>
              The Verify Customer Team envisions a world built on trust and reliability, where every interaction is
              secure and every connection is meaningful. We're building the infrastructure for a more trustworthy
              digital future.
            </p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div className="cta-section" variants={itemVariants}>
          <div className="cta-content">
            <div className="section-icon">
              <i className="fas fa-hands-helping"></i>
            </div>
            <h2>Join Us</h2>
            <p>
              Join us in building a more reliable future. The Verify Customer Team welcomes you to be part of this
              transformative journey.
            </p>
            <motion.button
              className="cta-button"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (window.location.href = "/join")}
            >
              Get Started Today
              <i className="fas fa-arrow-right"></i>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default AboutUsPage
