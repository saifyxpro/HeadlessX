'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface AnimatedButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  pulse?: boolean
}

export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  href,
  target,
  rel,
  disabled = false,
  loading = false,
  className = '',
  pulse = false
}: AnimatedButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl'
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
    xl: 'px-10 py-5 text-xl gap-3'
  }
  
  const variantClasses = {
    primary: 'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-500 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-primary-700 border-2 border-primary-200 hover:bg-primary-50 focus:ring-primary-500 shadow-md hover:shadow-lg',
    ghost: 'text-primary-600 hover:text-primary-700 hover:bg-primary-50 focus:ring-primary-500',
    outline: 'border-2 border-accent-600 text-accent-600 hover:bg-accent-600 hover:text-white focus:ring-accent-500'
  }
  
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`
  
  const buttonContent = (
    <>
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' || size === 'xl' ? 'w-6 h-6' : 'w-5 h-5'}`} />
      )}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && !loading && (
        <motion.div
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Icon className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' || size === 'xl' ? 'w-6 h-6' : 'w-5 h-5'}`} />
        </motion.div>
      )}
    </>
  )
  
  const motionProps = {
    whileHover: disabled ? {} : { scale: 1.02, y: -1 },
    whileTap: disabled ? {} : { scale: 0.98 },
    animate: pulse && !disabled ? { 
      boxShadow: [
        '0 0 0 0 rgba(59, 130, 246, 0.4)',
        '0 0 0 10px rgba(59, 130, 246, 0)',
        '0 0 0 0 rgba(59, 130, 246, 0)'
      ]
    } : {},
    transition: pulse ? { duration: 2, repeat: Infinity } : { duration: 0.2 }
  }
  
  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        className={combinedClasses}
        onClick={onClick}
        {...motionProps}
      >
        {buttonContent}
      </motion.a>
    )
  }
  
  return (
    <motion.button
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...motionProps}
    >
      {buttonContent}
    </motion.button>
  )
}