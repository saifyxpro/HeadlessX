'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Terminal } from 'lucide-react'

interface CodeBlockProps {
  children: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  copyButton?: boolean
  terminal?: boolean
  className?: string
}

export default function CodeBlock({
  children,
  language = 'javascript',
  filename,
  showLineNumbers = false,
  copyButton = true,
  terminal = false,
  className = ''
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (terminal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-primary-900 border border-primary-700 rounded-xl overflow-hidden relative ${className}`}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary-800 border-b border-primary-700">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-success-400" />
            <span className="text-sm font-medium text-primary-100">Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-4 font-mono text-sm">
          <div className="flex items-start gap-2">
            <span className="text-success-400 flex-shrink-0">$</span>
            <span className="text-primary-100">{children}</span>
          </div>
        </div>

        {copyButton && (
          <button
            onClick={copyToClipboard}
            className="absolute top-3 right-3 text-primary-400 hover:text-primary-200 transition-colors p-1"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-primary-50 border border-primary-200 rounded-xl overflow-hidden relative ${className}`}
    >
      {/* Code Header */}
      {(filename || copyButton) && (
        <div className="flex items-center justify-between px-4 py-3 bg-primary-100 border-b border-primary-200">
          <div className="flex items-center gap-3">
            {filename && (
              <span className="text-sm font-medium text-primary-700">{filename}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {copyButton && (
              <button
                onClick={copyToClipboard}
                className="text-primary-500 hover:text-primary-700 transition-colors p-1 rounded hover:bg-primary-200"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Code Content */}
      <div className="relative">
        <pre className="p-4 overflow-x-auto">
          <code className={`language-${language} text-sm font-mono leading-relaxed text-primary-800`}>
            {children}
          </code>
        </pre>
        
        {!filename && copyButton && (
          <button
            onClick={copyToClipboard}
            className="absolute top-3 right-3 text-primary-500 hover:text-primary-700 transition-colors p-1 rounded hover:bg-primary-200/80 backdrop-blur-sm"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </motion.div>
  )
}
