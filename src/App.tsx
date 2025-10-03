"use client"

import type React from "react"
import { HashRouter as Router, Routes, Route } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Header from "./components/Header"
import HamburgerMenu from "./components/HamburgerMenu"
import CardsPage from "./pages/CardsPage"
import FormPage from "./pages/FormPage"
import PaymentPage from "./pages/PaymentPage"
import PaymentSuccessPage from "./pages/PaymentSuccessPage"
import AdminDashboardPage from "./pages/AdminDashboardPage"
import AboutUsPage from "./pages/AboutUsPage"
import LoginPage from "./pages/LoginPage"
import JoinPage from "./pages/JoinPage"
import HelpContactPage from "./pages/helpContactPage"
import "./pages/AboutUsPage.css"
import "./pages/PaymentPage.css"
import "./pages/PaymentSuccessPage.css"
import "./pages/AdminDashboardPage.css"

const App: React.FC = () => {
  return (
    <Router>
      <div className="page-container">
        <HamburgerMenu />

        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/"
              element={
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Header />
                  <motion.div
                    className="instruction"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    <p>Choose your verification type to get started</p>
                  </motion.div>
                  <CardsPage />
                </motion.div>
              }
            />
            <Route path="/form" element={<FormPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/help" element={<HelpContactPage />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  )
}

export default App
