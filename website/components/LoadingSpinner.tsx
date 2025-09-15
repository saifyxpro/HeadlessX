'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'accent' | 'white' | 'success' | 'warning'
  variant?: 'dots' | 'spinner' | 'pulse' | 'bars'
  text?: string
  className?: string
}

export default function LoadingSpinner({
  size = 'md',
  color = 'accent',
  variant = 'spinner',
  text,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const colorClasses = {
    primary: 'text-primary-600',
    accent: 'text-accent-600',
    white: 'text-white',
    success: 'text-success-600',
    warning: 'text-warning-600'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
        {text && (
          <p className={`${textSizeClasses[size]} ${colorClasses[color]} font-medium`}>
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full`}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {text && (
          <p className={`${textSizeClasses[size]} ${colorClasses[color]} font-medium`}>
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'bars') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex space-x-1">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`w-1 ${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full`}
              animate={{
                scaleY: [1, 2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
        {text && (
          <p className={`${textSizeClasses[size]} ${colorClasses[color]} font-medium`}>
            {text}
          </p>
        )}
      </div>
    )
  }

  // Default spinner variant
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full ${colorClasses[color]}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {text && (
        <p className={`${textSizeClasses[size]} ${colorClasses[color]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  )
}