"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import BackButton from "../components/BackButton"

const JoinPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    businessIndustry: "",
    companySize: "",
    website: "",
    description: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [passwordError, setPasswordError] = useState("")
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear password error when user starts typing
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError("")
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    // Final validation
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Show success popup
        setShowSuccessPopup(true)
        
        // Redirect to home page after successful signup
        setTimeout(() => {
          window.location.href = '/#/'
        }, 1000)
      } else {
        setPasswordError(data.message || "Registration failed")
      }
    } catch (error) {
      console.error("Registration error:", error)
      setPasswordError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    // Validate passwords match before proceeding
    if (currentStep === 1) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError("Passwords do not match")
        return
      }
      if (formData.password.length < 8) {
        setPasswordError("Password must be at least 8 characters long")
        return
      }
    }
    
    if (currentStep < 2) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  return (
    <div className="page-container">
      <BackButton />

      <motion.div className="join-container" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="join-header" variants={itemVariants}>
          <div className="join-icon">
            <i className="fas fa-handshake"></i>
          </div>
          <h1>Join Our Network</h1>
          <p>Partner with us to build trust in digital interactions</p>
        </motion.div>

        <motion.div className="progress-bar" variants={itemVariants}>
          <div className="progress-steps">
            <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
              <span>1</span>
              <label>Personal Info</label>
            </div>
            <div className="step-connector"></div>
            <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
              <span>2</span>
              <label>Business Info</label>
            </div>
          </div>
          <div className="progress-fill" style={{ width: `${(currentStep / 2) * 100}%` }}></div>
        </motion.div>

        <motion.form className="join-form" onSubmit={handleSubmit} variants={itemVariants}>
          {currentStep === 1 && (
            <motion.div
              className="form-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              key="step1"
            >
              <h3>Personal Information</h3>

              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Last, First, Middle Initial"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <div className="input-wrapper">
                  <i className="fas fa-envelope input-icon"></i>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <div className="input-wrapper">
                  <i className="fas fa-phone input-icon"></i>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="(000) 000-0000"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a secure password"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {passwordError && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <i className="fas fa-exclamation-triangle"></i>
                  {passwordError}
                </motion.div>
              )}

              <motion.button
                type="button"
                className="next-button"
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Next Step
                <i className="fas fa-arrow-right"></i>
              </motion.button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              className="form-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              key="step2"
            >
              <h3>Business Information</h3>

              <div className="form-group">
                <label htmlFor="companyName">Company Name *</label>
                <div className="input-wrapper">
                  <i className="fas fa-building input-icon"></i>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Your Company Name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="businessIndustry">Business Industry *</label>
                <div className="input-wrapper">
                  <i className="fas fa-industry input-icon"></i>
                  <select
                    id="businessIndustry"
                    name="businessIndustry"
                    value={formData.businessIndustry}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Industry</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="education">Education</option>
                    <option value="real-estate">Real Estate</option>
                    <option value="consulting">Consulting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="companySize">Company Size</label>
                <div className="input-wrapper">
                  <i className="fas fa-users input-icon"></i>
                  <select id="companySize" name="companySize" value={formData.companySize} onChange={handleInputChange}>
                    <option value="">Select Size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="website">Website</label>
                <div className="input-wrapper">
                  <i className="fas fa-globe input-icon"></i>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Business Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about your business..."
                  rows={4}
                />
              </div>

              <div className="form-buttons">
                <motion.button
                  type="button"
                  className="back-button-form"
                  onClick={prevStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back
                </motion.button>

                <motion.button
                  type="submit"
                  className="submit-button"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <div className="loading"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Join Network
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          <motion.div className="login-link" variants={itemVariants}>
            <p>
              Already have an account?{" "}
              <Link to="/login" className="link">
                Sign in here
              </Link>
            </p>
          </motion.div>
        </motion.form>
      </motion.div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <motion.div
          className="success-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="success-popup"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Welcome to Our Network!</h2>
            <p>Your account has been created successfully.</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default JoinPage
