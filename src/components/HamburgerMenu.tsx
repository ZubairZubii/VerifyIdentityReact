"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

const HamburgerMenu: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false)
	const [user, setUser] = useState<any>(null)

	const closeMenu = () => setIsOpen(false)
	const toggleMenu = () => setIsOpen((v) => !v)

	// Check for authenticated user
	useEffect(() => {
		const userStr = localStorage.getItem('user')
		if (userStr) {
			try {
				setUser(JSON.parse(userStr))
			} catch (error) {
				console.error('Error parsing user data:', error)
			}
		}
	}, [])

	// Add/remove class to body when menu opens/closes
	useEffect(() => {
		if (isOpen) {
			document.body.classList.add('menu-open')
		} else {
			document.body.classList.remove('menu-open')
		}

		// Cleanup on unmount
		return () => {
			document.body.classList.remove('menu-open')
		}
	}, [isOpen])

	// Dynamic menu items based on user authentication and role
	const getMenuItems = () => {
		if (user) {
			// User is logged in - show all available options
			const baseItems = [
				{ path: "/", label: "Home" },
				{ path: "/about", label: "About Us" },
				{ path: "/help", label: "Help & Contact" },
			]

			if (user.role === 'admin') {
				// Admin user - show dashboard and logout
				return [
					...baseItems,
					{ path: "/admin-dashboard", label: "Admin Dashboard" },
					{ path: "/logout", label: "Logout", isAction: true }
				]
			} else {
				// Regular user - show logout
				return [
					...baseItems,
					{ path: "/logout", label: "Logout", isAction: true }
				]
			}
		} else {
			// User is not logged in - only show public pages and auth options
			return [
				{ path: "/about", label: "About Us" },
				{ path: "/help", label: "Help & Contact" },
				{ path: "/join", label: "Join" },
				{ path: "/login", label: "Login" },
			]
		}
	}

	const menuItems = getMenuItems()

	return (
		<>
			<motion.div
				className={`hamburger-menu ${isOpen ? 'open' : ''}`}
				onClick={toggleMenu}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				initial={{ opacity: 0, scale: 0 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3, delay: 0.5 }}
				aria-label={isOpen ? 'Close menu' : 'Open menu'}
			>
				<motion.i
					className={isOpen ? "fas fa-times" : "fas fa-bars"}
					animate={{ rotate: isOpen ? 0 : 0 }}
					transition={{ duration: 0.2 }}
				/>
			</motion.div>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						className="menu"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={closeMenu}
					>
						{/* Circular back button inside menu overlay */}
						<button type="button" className="menu-back" onClick={closeMenu} aria-label="Close menu">
							<i className="fas fa-arrow-left" />
						</button>

						<motion.ul
							initial={{ scale: 0.98, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.98, opacity: 0 }}
							transition={{ duration: 0.2, delay: 0.05 }}
						>
							{menuItems.map((item, index) => (
								<motion.li
									key={item.path}
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.06 + 0.05 }}
								>
									{item.isAction ? (
										<button 
											onClick={() => {
												if (item.path === '/logout') {
													localStorage.removeItem('token')
													localStorage.removeItem('user')
													setUser(null)
													closeMenu()
													window.location.href = '/#/login'
												}
											}}
											className="menu-logout-button"
										>
											{item.label}
										</button>
									) : (
										<Link to={item.path} onClick={closeMenu}>
											{item.label}
										</Link>
									)}
								</motion.li>
							))}
						</motion.ul>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}

export default HamburgerMenu
