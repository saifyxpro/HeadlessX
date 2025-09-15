'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  gradient?: string
  delay?: number
  onClick?: () => void
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient = 'from-blue-500 to-cyan-500',
  delay = 0,
  onClick
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="card card-hover p-8 text-center group cursor-pointer"
      onClick={onClick}
    >
      <motion.div
        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="w-8 h-8 text-white" />
      </motion.div>
      
      <h3 className="text-xl font-semibold text-primary-900 mb-4 group-hover:text-accent-700 transition-colors">
        {title}
      </h3>
      
      <p className="text-primary-600 leading-relaxed group-hover:text-primary-700 transition-colors">
        {description}
      </p>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-50/0 to-accent-100/0 group-hover:from-accent-50/50 group-hover:to-accent-100/50 rounded-xl transition-all duration-300 pointer-events-none" />
    </motion.div>
  )
}