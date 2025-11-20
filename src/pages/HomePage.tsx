"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import Header from "../components/Header"
import HamburgerMenu from "../components/HamburgerMenu"
import CardsPage from "./CardsPage"

const HomePage: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({})

  const features = [
    {
      icon: "fas fa-shield-alt",
      title: "Secure Verification",
      description: "Bank-level security with end-to-end encryption to protect your personal information",
      color: "#8b5cf6",
    },
    {
      icon: "fas fa-clock",
      title: "Quick Process",
      description: "Complete verification in minutes, not hours. Fast and efficient processing",
      color: "#06b6d4",
    },
    {
      icon: "fas fa-users",
      title: "Trusted Network",
      description: "Join thousands of verified customers and businesses in our trusted network",
      color: "#10b981",
    },
    {
      icon: "fas fa-mobile-alt",
      title: "Mobile Friendly",
      description: "Access from any device, anywhere. Fully responsive and optimized experience",
      color: "#f59e0b",
    },
  ]

  const stats = [
    { number: "50K+", label: "Verified Users", icon: "fas fa-users" },
    { number: "99.9%", label: "Success Rate", icon: "fas fa-check-circle" },
    { number: "24/7", label: "Support", icon: "fas fa-headset" },
    { number: "256-bit", label: "Encryption", icon: "fas fa-lock" },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Business Owner",
      content:
        "The verification process was incredibly smooth and professional. It gave me confidence in my business relationships.",
      rating: 5,
      avatar: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Property Manager",
      content:
        "Fast, secure, and reliable. This platform has streamlined our tenant verification process significantly.",
      rating: 5,
      avatar: "MC",
    },
    {
      name: "Emily Rodriguez",
      role: "Freelancer",
      content: "As a freelancer, having verified credentials has opened up so many more opportunities for me.",
      rating: 5,
      avatar: "ER",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Choose Type",
      description: "Select your verification type from our available options",
      icon: "fas fa-mouse-pointer",
    },
    {
      number: "02",
      title: "Fill Details",
      description: "Provide your information and upload required documents",
      icon: "fas fa-edit",
    },
    {
      number: "03",
      title: "Get Verified",
      description: "Receive your verification status within 24-48 hours",
      icon: "fas fa-certificate",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }))
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = document.querySelectorAll("[id]")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  }

  return (
    <div className="home-page">
      <HamburgerMenu />

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-background">
          <div className="hero-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>

        <div className="hero-content">
          <Header />

          <motion.div className="hero-main" variants={containerVariants} initial="hidden" animate="visible">
            <motion.div className="hero-badge" variants={itemVariants}>
              <i className="fas fa-star"></i>
              <span>Trusted by 50,000+ users worldwide</span>
            </motion.div>

            <motion.h1 className="hero-title" variants={itemVariants}>
              Verify Your Identity with
              <span className="gradient-text"> Confidence</span>
            </motion.h1>

            <motion.p className="hero-subtitle" variants={itemVariants}>
              Join our secure verification network and build trust in your digital interactions. Fast, reliable, and
              completely secure.
            </motion.p>

            <motion.div className="hero-cta" variants={itemVariants}>
              <button
                className="cta-primary"
                onClick={() => document.getElementById("verification-types")?.scrollIntoView({ behavior: "smooth" })}
              >
                <i className="fas fa-rocket"></i>
                Start Verification
              </button>
              <Link to="/about" className="cta-secondary">
                <i className="fas fa-play-circle"></i>
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" id="stats">
        <motion.div
          className="stats-container"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible.stats ? "visible" : "hidden"}
        >
          {stats.map((stat, index) => (
            <motion.div key={index} className="stat-item" variants={itemVariants}>
              <div className="stat-icon">
                <i className={stat.icon}></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Verification Types Section */}
      <section className="verification-section" id="verification-types">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible["verification-types"] ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2>Choose Your Verification Type</h2>
          <p>Select the verification that best fits your needs</p>
        </motion.div>

        <CardsPage />
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible.features ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2>Why Choose Our Platform</h2>
          <p>Experience the benefits of our advanced verification system</p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible.features ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="feature-icon" style={{ color: feature.color }}>
                <i className={feature.icon}></i>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="steps-section" id="how-it-works">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible["how-it-works"] ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2>How It Works</h2>
          <p>Get verified in three simple steps</p>
        </motion.div>

        <motion.div
          className="steps-container"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible["how-it-works"] ? "visible" : "hidden"}
        >
          {steps.map((step, index) => (
            <motion.div key={index} className="step-item" variants={itemVariants}>
              <div className="step-number">{step.number}</div>
              <div className="step-icon">
                <i className={step.icon}></i>
              </div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimonials">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible.testimonials ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2>What Our Users Say</h2>
          <p>Join thousands of satisfied customers</p>
        </motion.div>

        <div className="testimonials-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial}
              className="testimonial-card"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <div className="testimonial-content">
                <div className="testimonial-rating">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <i key={i} className="fas fa-star"></i>
                  ))}
                </div>
                <p>"{testimonials[currentTestimonial].content}"</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonials[currentTestimonial].avatar}</div>
                <div className="author-info">
                  <h4>{testimonials[currentTestimonial].name}</h4>
                  <span>{testimonials[currentTestimonial].role}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentTestimonial ? "active" : ""}`}
                onClick={() => setCurrentTestimonial(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta-section" id="get-started">
        <motion.div
          className="cta-container"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible["get-started"] ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="cta-content">
            <h2>Ready to Get Verified?</h2>
            <p>Join our trusted network today and start building stronger relationships</p>
            <div className="cta-buttons">
              <button
                className="cta-primary"
                onClick={() => document.getElementById("verification-types")?.scrollIntoView({ behavior: "smooth" })}
              >
                <i className="fas fa-rocket"></i>
                Start Now
              </button>
              <Link to="/help" className="cta-secondary">
                <i className="fas fa-question-circle"></i>
                Need Help?
              </Link>
            </div>
          </div>
          <div className="cta-visual">
            <div className="cta-shape"></div>
            <i className="fas fa-certificate cta-icon"></i>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

export default HomePage
