"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import BackButton from "../components/BackButton"

const HelpContactPage: React.FC = () => {
  const [openQuestions, setOpenQuestions] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleQuestion = (index: number) => {
    setOpenQuestions((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      console.log("Contact form submitted:", contactForm)
      setIsSubmitting(false)
      setContactForm({ name: "", email: "", subject: "", message: "" })
    }, 2000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setContactForm((prev) => ({ ...prev, [name]: value }))
  }

  const faqs = [
    {
      question: "What does this service offer?",
      answer:
        "We aim to help customers and businesses connect with greater confidence. Our platform facilitates information matching and verification to build trust in digital interactions.",
      category: "General",
    },
    {
      question: "How does it generally work?",
      answer:
        "The system is designed to allow matching of customer and business information through a secure verification process that validates identities and builds trust between parties.",
      category: "General",
    },
    {
      question: "Who might find this service useful?",
      answer:
        "This service may be helpful for businesses seeking to verify customers, individuals wanting to establish trust online, and organizations requiring identity verification.",
      category: "General",
    },
    {
      question: "Are there any costs associated with using this service?",
      answer:
        "To determine the applicable payment methods and costs for each verification, please fill out the form. After submission, you will be guided to the cost information.",
      category: "Pricing",
    },
    {
      question: "I'm having trouble with my account. What can I do?",
      answer:
        "Please contact our support team at help@verifycustomer.com, and they will assist you with any account-related issues within 24 hours.",
      category: "Account",
    },
    {
      question: "I've forgotten my password. How can I reset it?",
      answer:
        "You can reset your password by using the 'Forgot Password' link on the login page. If you experience difficulties, please email help@verifycustomer.com.",
      category: "Account",
    },
    {
      question: "What information is typically needed?",
      answer:
        "The specific information required will vary depending on whether you are a customer or a business. Generally, we need identity documents, contact information, and relevant business credentials.",
      category: "Verification",
    },
    {
      question: "How long does verification usually take?",
      answer:
        "The duration of the verification process typically ranges from 24-72 hours, depending on the complexity of the verification and document review required.",
      category: "Verification",
    },
    {
      question: "What happens if my verification isn't successful?",
      answer:
        "You can reach out to help@verifycustomer.com, and our team will review your case and provide guidance on next steps or additional requirements.",
      category: "Verification",
    },
    {
      question: "How can my business get verified?",
      answer:
        "To get your business verified, go to the hamburger menu, select the 'Join' section, and fill out the join form with your business information.",
      category: "Business",
    },
  ]

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const categories = ["All", ...Array.from(new Set(faqs.map((faq) => faq.category)))]
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categoryFilteredFaqs = filteredFaqs.filter(
    (faq) => selectedCategory === "All" || faq.category === selectedCategory,
  )

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <div className="page-container">
      <BackButton />

      <motion.div className="help-container" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header Section */}
        <motion.div className="help-header" variants={itemVariants}>
          <div className="help-icon">
            <i className="fas fa-question-circle"></i>
          </div>
          <h1>Help & Support</h1>
          <p>Find answers to common questions or get in touch with our support team</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="quick-actions" variants={itemVariants}>
          <div className="action-card">
            <i className="fas fa-search"></i>
            <h3>Search FAQs</h3>
            <p>Find quick answers</p>
          </div>
          <div className="action-card">
            <i className="fas fa-envelope"></i>
            <h3>Contact Support</h3>
            <p>Get personalized help</p>
          </div>
          <div className="action-card">
            <i className="fas fa-phone"></i>
            <h3>Call Us</h3>
            <p>Speak with an expert</p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div className="faq-section" variants={itemVariants}>
          <h2>Frequently Asked Questions</h2>

          {/* Search Bar */}
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="category-filter">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="faq-list">
            <AnimatePresence>
              {categoryFilteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  className="faq-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="faq-question"
                    onClick={() => toggleQuestion(index)}
                    whileHover={{ backgroundColor: "var(--accent-purple)" }}
                  >
                    <div className="question-content">
                      <span className="category-tag">{faq.category}</span>
                      <h3>{faq.question}</h3>
                    </div>
                    <motion.i
                      className={`fas ${openQuestions.includes(index) ? "fa-chevron-up" : "fa-chevron-down"}`}
                      animate={{ rotate: openQuestions.includes(index) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>
                  <AnimatePresence>
                    {openQuestions.includes(index) && (
                      <motion.div
                        className="faq-answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div className="contact-section" variants={itemVariants}>
          <div className="contact-info">
            <h2>Still Need Help?</h2>
            <p>Can't find what you're looking for? Our support team is here to help!</p>

            <div className="contact-methods">
              <div className="contact-method">
                <i className="fas fa-envelope"></i>
                <div>
                  <h4>Email Support</h4>
                  <p>
                    <a href="mailto:help@verifycustomer.com">help@verifycustomer.com</a>
                  </p>
                  <span>Response within 24 hours</span>
                </div>
              </div>
              <div className="contact-method">
                <i className="fas fa-phone"></i>
                <div>
                  <h4>Phone Support</h4>
                  <p>+1 (555) 123-4567</p>
                  <span>Mon-Fri, 9AM-6PM EST</span>
                </div>
              </div>
              <div className="contact-method">
                <i className="fas fa-comments"></i>
                <div>
                  <h4>Live Chat</h4>
                  <p>Available on our website</p>
                  <span>Mon-Fri, 9AM-6PM EST</span>
                </div>
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleContactSubmit}>
            <h3>Send us a Message</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={contactForm.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <select id="subject" name="subject" value={contactForm.subject} onChange={handleInputChange} required>
                <option value="">Select a subject</option>
                <option value="account">Account Issues</option>
                <option value="verification">Verification Questions</option>
                <option value="billing">Billing & Pricing</option>
                <option value="technical">Technical Support</option>
                <option value="business">Business Inquiries</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={contactForm.message}
                onChange={handleInputChange}
                rows={5}
                placeholder="Please describe your question or issue in detail..."
                required
              />
            </div>

            <motion.button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <div className="loading"></div>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Send Message
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default HelpContactPage
