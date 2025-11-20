"use client"

import type React from "react"
import { motion } from "framer-motion"
import Card from "../components/Card"

const CardsPage: React.FC = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  }

  return (
    <motion.div className="cards" initial="hidden" animate="visible">
      <motion.div custom={0} variants={cardVariants}>
        <Card type="Residential" icon="home" formType="residential" />
      </motion.div>
      <motion.div custom={1} variants={cardVariants}>
        <Card type="Auto" icon="car" formType="auto" />
      </motion.div>
      <motion.div custom={2} variants={cardVariants}>
        <Card type="Commercial" icon="building" formType="commercial" />
      </motion.div>
    </motion.div>
  )
}

export default CardsPage
