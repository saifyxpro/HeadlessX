'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SectionProps {
  children: React.ReactNode
  id?: string
  className?: string
  containerClassName?: string
  background?: 'default' | 'accent' | 'gradient' | 'white' | 'transparent'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full'
  animated?: boolean
  animationDelay?: number
}

export default function Section({
  children,
  id,
  className = '',
  containerClassName = '',
  background = 'default',
  padding = 'lg',
  maxWidth = '7xl',
  animated = true,
  animationDelay = 0
}: SectionProps) {
  const getBackgroundClass = () => {
    switch (background) {
      case 'accent':
        return 'bg-accent-50/60 backdrop-blur-sm'
      case 'gradient':
        return 'bg-gradient-to-r from-accent-600 to-accent-700'
      case 'white':
        return 'bg-white/80 backdrop-blur-sm'
      case 'transparent':
        return 'bg-transparent'
      case 'default':
      default:
        return 'bg-white/60 backdrop-blur-sm'
    }
  }

  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return ''
      case 'sm':
        return 'py-8'
      case 'md':
        return 'py-12'
      case 'lg':
        return 'py-20'
      case 'xl':
        return 'py-32'
      default:
        return 'py-20'
    }
  }

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm'
      case 'md':
        return 'max-w-md'
      case 'lg':
        return 'max-w-lg'
      case 'xl':
        return 'max-w-xl'
      case '2xl':
        return 'max-w-2xl'
      case '4xl':
        return 'max-w-4xl'
      case '6xl':
        return 'max-w-6xl'
      case '7xl':
        return 'max-w-7xl'
      case 'full':
        return 'max-w-full'
      default:
        return 'max-w-7xl'
    }
  }

  const content = (
    <section
      id={id}
      className={`${getPaddingClass()} ${getBackgroundClass()} ${className}`}
    >
      <div className={`${getMaxWidthClass()} mx-auto px-4 sm:px-6 lg:px-8 ${containerClassName}`}>
        {children}
      </div>
    </section>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: animationDelay }}
        viewport={{ once: true, margin: '-50px' }}
      >
        {content}
      </motion.div>
    )
  }

  return content
}