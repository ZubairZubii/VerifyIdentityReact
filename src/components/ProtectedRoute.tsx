"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        
        if (!token || !userStr) {
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }

        const user = JSON.parse(userStr)
        
        // Check if token is valid by making a request to the backend
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          setIsAuthenticated(true)
          setIsAdmin(user.role === 'admin')
          
          // If admin route is required but user is not admin
          if (requireAdmin && user.role !== 'admin') {
            navigate('/#/')
            return
          }
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [navigate, requireAdmin])

  if (isLoading) {
    return (
      <motion.div
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%'
          }}
        />
      </motion.div>
    )
  }

  if (!isAuthenticated) {
    navigate('/#/login')
    return null
  }

  if (requireAdmin && !isAdmin) {
    navigate('/#/')
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute

