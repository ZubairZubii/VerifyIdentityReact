"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

type BackButtonProps = {
	onBack?: () => void
}

const BackButton: React.FC<BackButtonProps> = ({ onBack }) => {
	const navigate = useNavigate()

	const handleBack = () => {
		if (onBack) {
			onBack()
		} else {
			navigate(-1)
		}
	}

	return (
		<motion.button
			className="back-button"
			onClick={handleBack}
			whileHover={{ scale: 1.1, y: -2 }}
			whileTap={{ scale: 0.9 }}
			initial={{ opacity: 0, x: -50 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3 }}
		>
			<i className="fas fa-arrow-left"></i>
		</motion.button>
	)
}

export default BackButton
