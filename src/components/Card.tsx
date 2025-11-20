"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

interface CardProps {
  type: string
  icon: string
  formType: string
}

const Card: React.FC<CardProps> = ({ type, icon, formType }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/form?type=${formType}`)
  }

  const getIconClass = (icon: string) => {
    switch (icon) {
      case "home":
        return "fas fa-home"
      case "car":
        return "fas fa-car"
      case "building":
        return "fas fa-building"
      default:
        return "fas fa-question"
    }
  }

  return (
    <motion.div
      className="card"
      onClick={handleClick}
      whileHover={{
        y: -8,
        scale: 1.01,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <motion.div
        className="imagePlaceholder"
        whileHover={{
          scale: 1.1,
          transition: { duration: 0.2 },
        }}
      >
        <i className={getIconClass(icon)}></i>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {type}
      </motion.p>
    </motion.div>
  )
}

export default Card
