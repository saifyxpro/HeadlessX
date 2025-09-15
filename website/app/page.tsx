'use client'

import React, { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { 
  Globe, 
  Zap, 
  Shield, 
  Code, 
  Server, 
  Download, 
  Play, 
  ChevronRight, 
  Star, 
  GitBranch,
  Package,
  Workflow,
  Eye,
  Image,
  Settings,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Copy,
  Sparkles,
  Activity,
  Users,
  Gauge,
  Crown
} from 'lucide-react'

export default function HomePage() {
  const [copied, setCopied] = useState(false)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, 200])
  const y2 = useTransform(scrollY, [0, 300], [0, -100])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stats = [
    { label: 'API Requests', value: '1M+', icon: Activity },
    { label: 'Active Users', value: '5K+', icon: Users },
    { label: 'Uptime', value: '99.9%', icon: Gauge },
    { label: 'n8n Workflows', value: '500+', icon: Workflow }
  ]

  const features = [
    {
      icon: Globe,
      title: 'Universal Web Scraping',
      description: 'Extract data from any website with enterprise-grade browser automation',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-second response times with optimized Playwright engine',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: 'Stealth Technology',
      description: 'Bypass detection with Google-level Chrome spoofing techniques',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Code,
      title: 'Developer-First API',
      description: 'RESTful endpoints with comprehensive documentation and SDKs',
      gradient: 'from-purple-500 to-pink-500'
    }
  ]

  const n8nOperations = [
    {
      category: '🎯 Content Extraction',
      operations: [
        'Extract HTML Content',
        'Get Page Text',
        'Extract Links',
        'Parse Structured Data'
      ]
    },
    {
      category: '📸 Visual Capture',
      operations: [
        'Full Page Screenshot',
        'Element Screenshot',
        'PDF Generation',
        'Visual Comparison'
      ]
    },
    {
      category: '⚡ Advanced Processing',
      operations: [
        'Wait for Elements',
        'Custom JavaScript',
        'Form Interactions',
        'Multi-step Automation'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-accent-50/40">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-accent-600 to-accent-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-primary-900">HeadlessX</span>
            </div>
            
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#features" className="text-primary-600 hover:text-accent-600 transition-colors">Features</a>
              <a href="#integrations" className="text-primary-600 hover:text-accent-600 transition-colors">Integrations</a>
              <a href="#api" className="text-primary-600 hover:text-accent-600 transition-colors">API Docs</a>
              <a href="https://github.com/SaifyXPRO/HeadlessX" target="_blank" rel="noopener noreferrer" 
                 className="text-primary-600 hover:text-accent-600 transition-colors flex items-center gap-1">
                GitHub <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <a href="https://github.com/SaifyXPRO/HeadlessX" target="_blank" rel="noopener noreferrer"
                 className="hidden sm:flex btn-secondary px-3 sm:px-4 py-2 rounded-lg text-sm font-medium items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span className="hidden md:inline">Source Code</span>
                <span className="md:hidden">GitHub</span>
              </a>
              <a href="#api" className="btn-primary px-3 sm:px-4 py-2 rounded-lg text-sm font-medium">
                <span className="hidden sm:inline">Get Started Free</span>
                <span className="sm:hidden">Start</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden">
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-20 left-4 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-r from-accent-200/40 to-accent-300/40 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute top-40 right-4 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-r from-primary-200/40 to-primary-300/40 rounded-full blur-3xl"
        />
        
        <div className="container-custom relative px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-accent-200 rounded-full px-3 sm:px-4 py-2 mb-6 sm:mb-8 text-xs sm:text-sm">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-accent-600" />
              <span className="font-medium text-primary-700">Free & Open Source • v1.2.0 • MIT License</span>
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-primary-900 mb-4 sm:mb-6 leading-tight px-2">
              Free & Open Source
              <span className="gradient-text block">Web Scraping Server</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-primary-600 mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto px-4">
              Completely free and open-source browserless automation server with enterprise-grade stealth technology. 
              Extract data, capture screenshots, generate PDFs, and integrate with Make.com, Zapier, n8n, and any HTTP client.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 px-4">
              <a href="https://github.com/SaifyXPRO/HeadlessX" target="_blank" rel="noopener noreferrer"
                 className="w-full sm:w-auto btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold flex items-center justify-center gap-2 group">
                <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
                View on GitHub
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              
              <a href="https://github.com/SaifyXPRO/n8n-nodes-headlessx" target="_blank" rel="noopener noreferrer"
                 className="w-full sm:w-auto btn-secondary px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold flex items-center justify-center gap-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                Install n8n Node
              </a>
            </div>

            {/* Code Example */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white/90 backdrop-blur-sm border border-primary-100 rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto shadow-elegant"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full" />
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full" />
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full" />
                </div>
                <button 
                  onClick={() => copyToClipboard('curl -X POST "https://your-domain.com/api/html?token=YOUR_TOKEN" -H "Content-Type: application/json" -d \'{"url": "https://example.com"}\'')}
                  className="text-primary-500 hover:text-accent-600 transition-colors p-1"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-left text-xs sm:text-sm text-primary-700 font-mono overflow-x-auto">
{`curl -X POST https://your-domain.com/api/html?token=YOUR_TOKEN \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
              </pre>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white/60 backdrop-blur-sm">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl mb-3 sm:mb-4">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-primary-900 mb-1 sm:mb-2">{stat.value}</div>
                <div className="text-sm sm:text-base text-primary-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-900 mb-4 sm:mb-6">
              Powerful Features
            </h2>
            <p className="text-lg sm:text-xl text-primary-600 max-w-2xl mx-auto px-4">
              Everything you need for modern web automation and data extraction
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card card-hover p-6 sm:p-8 text-center group"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-primary-900 mb-3 sm:mb-4">{feature.title}</h3>
                <p className="text-sm sm:text-base text-primary-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* n8n Integration Showcase */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 sm:px-4 py-2 rounded-full text-sm font-medium mb-4 sm:mb-6">
              <Package className="w-4 h-4" />
              <span>Featured Integration</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-900 mb-4 sm:mb-6">
              Official <span className="gradient-text">n8n Community Node</span>
            </h2>
            <p className="text-lg sm:text-xl text-primary-600 max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
              Our dedicated n8n community node package makes HeadlessX integration seamless with visual workflow automation
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-white/90 backdrop-blur-sm border border-primary-100 rounded-2xl p-6 sm:p-8 shadow-elegant">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-primary-900">n8n-nodes-headlessx</h3>
                    <p className="text-sm sm:text-base text-primary-600">Community Node Package</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                    <div className="text-sm text-primary-600 mb-2">Install via npm:</div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <code className="text-xs sm:text-sm font-mono text-primary-800 flex-1 break-all">
                        npm install n8n-nodes-headlessx
                      </code>
                      <button 
                        onClick={() => copyToClipboard('npm install n8n-nodes-headlessx')}
                        className="text-primary-500 hover:text-accent-600 transition-colors self-start sm:self-center p-1"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                    <div className="text-sm text-primary-600 mb-2">Or install via n8n Community Nodes:</div>
                    <code className="text-xs sm:text-sm font-mono text-primary-800">
                      Search for &ldquo;headlessx&rdquo; in Community Nodes
                    </code>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <a 
                      href="https://github.com/SaifyXPRO/n8n-nodes-headlessx" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 group"
                    >
                      <GitBranch className="w-4 h-4" />
                      View Source
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a 
                      href="https://www.npmjs.com/package/n8n-nodes-headlessx" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-outline px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      npm Package
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-primary-900 mb-4 sm:mb-6">Available Operations</h3>
              
              {n8nOperations.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/90 backdrop-blur-sm border border-primary-100 rounded-xl p-4 sm:p-6"
                >
                  <h4 className="text-base sm:text-lg font-semibold text-primary-900 mb-3 sm:mb-4">{category.category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {category.operations.map((operation, opIndex) => (
                      <div key={opIndex} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent-500 rounded-full flex-shrink-0" />
                        <span className="text-primary-700 text-sm">{operation}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              <div className="bg-gradient-to-r from-accent-50 to-purple-50 border border-accent-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-accent-600" />
                  <span className="font-semibold text-accent-800">Pro Tip</span>
                </div>
                <p className="text-accent-700 text-sm leading-relaxed">
                  The HeadlessX n8n node supports all server endpoints with a user-friendly interface, 
                  making complex web scraping workflows as simple as drag-and-drop.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HTTP Integrations Section */}
      <section id="integrations" className="py-16 sm:py-20 bg-white/80 backdrop-blur-sm">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6">
              <Workflow className="w-4 h-4 sm:w-5 sm:h-5 text-accent-600" />
              <span className="text-accent-800 font-semibold text-sm sm:text-base">Universal HTTP Integration</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                <span className="text-xs sm:text-sm text-primary-600">Any Platform</span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-900 mb-4 sm:mb-6">
              Connect to <span className="gradient-text">Any Platform</span>
            </h2>
            <p className="text-lg sm:text-xl text-primary-600 max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
              Integrate HeadlessX with Make.com, Zapier, n8n, or any application using simple HTTP requests
            </p>
          </motion.div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {[
              { 
                name: 'Make.com', 
                icon: Workflow, 
                description: 'Visual automation platform', 
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-600',
                example: 'HTTP Request Module'
              },
              { 
                name: 'Zapier', 
                icon: Zap, 
                description: 'Connect 5000+ apps', 
                bgColor: 'bg-orange-100',
                textColor: 'text-orange-600',
                example: 'Webhooks by Zapier'
              },
              { 
                name: 'n8n', 
                icon: Package, 
                description: 'Open source automation', 
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-600',
                example: 'Community Node Available'
              },
              { 
                name: 'Custom Apps', 
                icon: Code, 
                description: 'Any programming language', 
                bgColor: 'bg-green-100',
                textColor: 'text-green-600',
                example: 'REST API Calls'
              }
            ].map((platform, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/90 backdrop-blur-sm border border-primary-100 rounded-2xl p-4 sm:p-6 text-center shadow-elegant hover:shadow-lg transition-shadow"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${platform.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                  <platform.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${platform.textColor}`} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-primary-900 mb-2">{platform.name}</h3>
                <p className="text-sm text-primary-600 mb-3 leading-relaxed">{platform.description}</p>
                <span className="text-xs text-accent-600 font-medium bg-accent-50 px-2 sm:px-3 py-1 rounded-full">
                  {platform.example}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Quick Start Examples */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Basic cURL Example */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white/90 backdrop-blur-sm border border-primary-100 rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-primary-900">Quick Start - cURL</h3>
                <button 
                  onClick={() => copyToClipboard('curl -X POST "https://your-domain.com/api/html?token=YOUR_TOKEN" -H "Content-Type: application/json" -d \'{"url": "https://example.com"}\'')}
                  className="text-primary-500 hover:text-accent-600 transition-colors p-1"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-xs sm:text-sm font-mono text-primary-800 bg-primary-50 px-3 sm:px-4 py-3 rounded-lg overflow-x-auto">
{`curl -X POST "https://your-domain.com/api/html?token=YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
              </pre>
            </motion.div>

            {/* JavaScript Example */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white/90 backdrop-blur-sm border border-primary-100 rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-primary-900">JavaScript/Node.js</h3>
                <button 
                  onClick={() => copyToClipboard(`fetch('https://your-domain.com/api/html?token=YOUR_TOKEN', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
})`)}
                  className="text-primary-500 hover:text-accent-600 transition-colors p-1"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-xs sm:text-sm font-mono text-primary-800 bg-primary-50 px-3 sm:px-4 py-3 rounded-lg overflow-x-auto">
{`fetch('https://your-domain.com/api/html?token=YOUR_TOKEN', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
})`}
              </pre>
            </motion.div>
          </div>

          {/* Repository Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mt-8 sm:mt-12"
          >
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <a
                href="https://github.com/SaifyXPRO/HeadlessX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 btn-primary px-4 sm:px-6 py-3 rounded-xl font-semibold group"
              >
                <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
                HeadlessX Server
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://github.com/SaifyXPRO/n8n-nodes-headlessx"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 btn-outline px-4 sm:px-6 py-3 rounded-xl font-semibold group"
              >
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                n8n Node Package
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-16 sm:py-20">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-900 mb-4 sm:mb-6">
              Developer-Friendly <span className="gradient-text">REST API</span>
            </h2>
            <p className="text-lg sm:text-xl text-primary-600 max-w-2xl mx-auto px-4">
              Clean, RESTful endpoints with comprehensive documentation and examples
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-xl sm:text-2xl font-bold text-primary-900 mb-4 sm:mb-6">API Endpoints</h3>
              
              <div className="space-y-3">
                {[
                  { method: 'GET', endpoint: '/api/health', description: 'Server health and status check' },
                  { method: 'GET', endpoint: '/api/status', description: 'Detailed server information' },
                  { method: 'POST', endpoint: '/api/render', description: 'Full page rendering with JSON response' },
                  { method: 'POST', endpoint: '/api/html', description: 'Raw HTML extraction (POST)' },
                  { method: 'GET', endpoint: '/api/html', description: 'Raw HTML extraction (GET)' },
                  { method: 'POST', endpoint: '/api/content', description: 'Clean text extraction (POST)' },
                  { method: 'GET', endpoint: '/api/content', description: 'Clean text extraction (GET)' },
                  { method: 'GET', endpoint: '/api/screenshot', description: 'Capture page screenshots' },
                  { method: 'GET', endpoint: '/api/pdf', description: 'Generate PDF documents' },
                  { method: 'POST', endpoint: '/api/batch', description: 'Process multiple URLs in batch' }
                ].map((api, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/70 rounded-xl border border-primary-100 hover:bg-white/90 transition-colors">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium w-fit ${
                      api.method === 'POST' ? 'bg-success-100 text-success-700' : 'bg-accent-100 text-accent-700'
                    }`}>
                      {api.method}
                    </span>
                    <code className="font-mono text-primary-700 flex-1 text-sm sm:text-base break-all">{api.endpoint}</code>
                    <span className="text-primary-600 text-sm leading-tight">{api.description}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white/90 backdrop-blur-sm border border-primary-100 rounded-2xl p-6 sm:p-8 shadow-elegant"
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-base sm:text-lg font-semibold text-primary-900">Example Response</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success-500 rounded-full" />
                  <span className="text-sm text-primary-600">200 OK</span>
                </div>
              </div>
              
              <pre className="text-xs sm:text-sm text-primary-700 font-mono overflow-x-auto bg-primary-50 p-3 sm:p-4 rounded-lg">
{`{
  "success": true,
  "data": {
    "title": "Example Page",
    "content": "...",
    "links": [...],
    "images": [...],
    "metadata": {
      "loadTime": "1.2s",
      "timestamp": "2025-01-01T00:00:00Z"
    }
  },
  "status": 200
}`}
              </pre>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-accent-600 to-accent-700 text-white">
        <div className="container-custom text-center px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg sm:text-xl text-accent-100 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Join thousands of developers using HeadlessX for free web automation and scraping
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <a href="https://github.com/SaifyXPRO/HeadlessX" target="_blank" rel="noopener noreferrer"
                 className="w-full sm:w-auto bg-white text-accent-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-accent-50 transition-colors flex items-center justify-center gap-2 min-h-[48px]">
                <GitBranch className="w-5 h-5" />
                Download & Deploy
              </a>
              
              <a href="https://github.com/SaifyXPRO/n8n-nodes-headlessx" target="_blank" rel="noopener noreferrer"
                 className="w-full sm:w-auto border-2 border-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 min-h-[48px]">
                <Package className="w-5 h-5" />
                Install n8n Node
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-primary-900 text-white">
        <div className="container-custom px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
            <div className="flex items-center space-x-3 text-center md:text-left">
              <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <span className="text-xl font-bold">HeadlessX</span>
                <div className="text-xs text-primary-400">Free & Open Source • MIT License</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-primary-300">
              <a href="https://github.com/SaifyXPRO/HeadlessX" target="_blank" rel="noopener noreferrer" 
                 className="hover:text-white transition-colors flex items-center gap-1 text-sm sm:text-base min-h-[44px]">
                Server Repo
                <ExternalLink className="w-3 h-3" />
              </a>
              
              <a href="https://github.com/SaifyXPRO/n8n-nodes-headlessx" target="_blank" rel="noopener noreferrer"
                 className="hover:text-white transition-colors flex items-center gap-1 text-sm sm:text-base min-h-[44px]">
                n8n Node Repo
                <ExternalLink className="w-3 h-3" />
              </a>
              
              <div className="text-primary-400 text-xs sm:text-sm text-center">
                © 2025 SaifyXPRO. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}