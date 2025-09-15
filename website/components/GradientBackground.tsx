'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface GradientBackgroundProps {
  children: React.ReactNode
  variant?: 'hero' | 'section' | 'card' | 'subtle'
  className?: string
  animated?: boolean
}

export default function GradientBackground({
  children,
  variant = 'subtle',
  className = '',
  animated = true
}: GradientBackgroundProps) {
  const getBackgroundClass = () => {
    switch (variant) {
      case 'hero':
        return 'bg-gradient-to-br from-white via-accent-50/30 to-primary-50/40'
      case 'section':
        return 'bg-gradient-to-r from-accent-600 to-accent-700'
      case 'card':
        return 'bg-gradient-to-br from-white to-primary-50/30'
      case 'subtle':
      default:
        return 'bg-gradient-to-br from-white via-primary-50/20 to-accent-50/20'
    }
  }

  const floatingElements = animated && (
    <>
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-accent-200/30 to-accent-300/30 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-r from-primary-200/30 to-primary-300/30 rounded-full blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 25, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div
        className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-success-200/20 to-success-300/20 rounded-full blur-3xl"
        animate={{
          x: [0, 20, 0],
          y: [0, -15, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
    </>
  )

  return (
    <div className={`relative ${getBackgroundClass()} ${className}`}>
      {floatingElements}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}