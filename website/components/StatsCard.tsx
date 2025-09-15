'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string
  icon: LucideIcon
  index?: number
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  index = 0,
  trend,
  trendValue
}: StatsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-primary-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      className="text-center group"
    >
      <motion.div
        className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl mb-4 group-hover:shadow-glow transition-shadow duration-300"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        <Icon className="w-6 h-6 text-white" />
      </motion.div>
      
      <motion.div
        className="text-3xl font-bold text-primary-900 mb-2"
        initial={{ scale: 1 }}
        whileInView={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
      >
        {value}
      </motion.div>
      
      <div className="text-primary-600 mb-2">{label}</div>
      
      {trend && trendValue && (
        <div className={`text-xs font-medium ${getTrendColor()}`}>
          {trend === 'up' && '↗'} 
          {trend === 'down' && '↘'} 
          {trend === 'stable' && '→'} 
          {trendValue}
        </div>
      )}
    </motion.div>
  )
}