"use client"

import type React from "react"
import { motion } from "framer-motion"

const Header: React.FC = () => {
  return (
    <motion.div
      className="header"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Verify Customer
      </motion.h1>
      <motion.div
        className="quoteLine"
        initial={{ width: 0 }}
        animate={{ width: "5rem" }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      <motion.p
        className="quote"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        Simply Connecting Verified Customers and Companies
      </motion.p>
    </motion.div>
  )
}

export default Header
