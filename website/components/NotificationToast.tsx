'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface NotificationToastProps {
  id: string
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
}

export default function NotificationToast({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  position = 'top-right'
}: NotificationToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-accent-600" />
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'border-success-200 bg-success-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-warning-200 bg-warning-50'
      case 'info':
      default:
        return 'border-accent-200 bg-accent-50'
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'top-right':
      default:
        return 'top-4 right-4'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`fixed z-50 ${getPositionClasses()} max-w-sm w-full`}
    >
      <div className={`${getColorClasses()} border rounded-xl shadow-elegant-lg backdrop-blur-md p-4`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-primary-900 mb-1">
              {title}
            </h4>
            {message && (
              <p className="text-sm text-primary-600 leading-relaxed">
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={() => onClose(id)}
            className="flex-shrink-0 text-primary-400 hover:text-primary-600 transition-colors p-1 rounded-lg hover:bg-white/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress bar */}
        {duration > 0 && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-accent-400 to-accent-600 rounded-b-xl"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        )}
      </div>
    </motion.div>
  )
}

// Toast manager hook
export function useToast() {
  const [toasts, setToasts] = React.useState<NotificationToastProps[]>([])

  const addToast = (toast: Omit<NotificationToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <AnimatePresence>
      {toasts.map(toast => (
        <NotificationToast key={toast.id} {...toast} />
      ))}
    </AnimatePresence>
  )

  return { addToast, removeToast, ToastContainer }
}