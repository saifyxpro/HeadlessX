'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  Globe, 
  Zap, 
  Shield, 
  MousePointer, 
  Eye, 
  Download,
  CheckCircle,
  ArrowRight,
  Play,
  Code,
  Server,
  Gauge,
  Lock,
  Layers,
  Bot
} from 'lucide-react'

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const features = [
    {
      icon: <MousePointer className="h-8 w-8" />,
      title: "Human-like Behavior",
      description: "Natural mouse movements, realistic scrolling patterns, and human-like interactions"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "40+ Anti-Detection",
      description: "Advanced stealth techniques to bypass bot detection systems"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "User Agent Rotation",
      description: "9 realistic Windows browsers with proper headers and fingerprints"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Emergency Recovery",
      description: "Never lose data with intelligent timeout handling and fallback methods"
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Screenshots & PDFs",
      description: "Full page captures in multiple formats with batch processing"
    },
    {
      icon: <Layers className="h-8 w-8" />,
      title: "Docker Ready",
      description: "Complete containerization with nginx, PM2, and production configs"
    }
  ]

  const endpoints = [
    { method: 'GET', path: '/api/health', description: 'Server health and status check' },
    { method: 'GET', path: '/api/status', description: 'Detailed server information' },
    { method: 'POST', path: '/api/render', description: 'Full page rendering with JSON response' },
    { method: 'POST', path: '/api/html', description: 'Raw HTML extraction (POST)' },
    { method: 'GET', path: '/api/html', description: 'Raw HTML extraction (GET)' },
    { method: 'POST', path: '/api/content', description: 'Clean text extraction (POST)' },
    { method: 'GET', path: '/api/content', description: 'Clean text extraction (GET)' },
    { method: 'GET', path: '/api/screenshot', description: 'Capture page screenshots' },
    { method: 'GET', path: '/api/pdf', description: 'Generate PDF documents' },
    { method: 'POST', path: '/api/batch', description: 'Process multiple URLs in batch' }
  ]

  const stats = [
    { label: 'Success Rate', value: '99.9%' },
    { label: 'Avg Response', value: '<2s' },
    { label: 'Detection Rate', value: '0.01%' },
    { label: 'Uptime', value: '99.95%' }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [features.length])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              {/* Mobile square icon */}
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-black/20 ring-1 ring-white/10 md:hidden">
                <Image src="/logo.svg" alt="HeadlessX Logo" width={40} height={40} priority />
              </div>
              {/* Desktop horizontal logo */}
              <div className="hidden md:block">
                <Image src="/logo-horizontal.svg" alt="HeadlessX Logo" width={200} height={40} priority />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HeadlessX</h1>
                <p className="text-xs text-gray-300">v1.1.0</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#docs" className="text-gray-300 hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#api" className="text-gray-300 hover:text-white transition-colors">
                API
              </a>
              <a href="https://github.com/SaifyXPRO/HeadlessX" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Advanced
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {" "}Browserless{" "}
              </span>
              Web Scraping
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Open source browserless web scraping API with human-like behavior simulation, 40+ anti-detection techniques, 
              and comprehensive automation features. Built for scale and reliability.
            </p>
            
            {/* Quick Start Code */}
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-6 max-w-3xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-green-400 text-sm font-mono">$ Quick Start</span>
                <button 
                  onClick={() => copyToClipboard('curl -X GET "https://headless.saify.me/api/html?token=YOUR_TOKEN&url=https://example.com"')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                </button>
              </div>
              <code className="text-blue-300 font-mono text-sm md:text-base break-all">
                curl -X GET &quot;https://headless.saify.me/api/html?token=YOUR_TOKEN&url=https://example.com&quot;
              </code>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://github.com/SaifyXPRO/HeadlessX" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
              <a href="#api" className="border border-white/20 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                <Code className="h-5 w-5" />
                View Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Floating Animation Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose HeadlessX?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built with cutting-edge technology to deliver undetectable automation 
              and reliable data extraction at enterprise scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`feature-card rounded-xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer ${
                  index === activeFeature ? 'glow-effect' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Endpoints Section */}
      <section id="api" className="py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Comprehensive API
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              RESTful endpoints designed for developers. Simple integration, powerful results.
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="grid gap-4">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      endpoint.method === 'GET' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-blue-300 font-mono">{endpoint.path}</code>
                  </div>
                  <p className="text-gray-300 hidden md:block">{endpoint.description}</p>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Enterprise-Grade Technology
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built on proven technologies for maximum reliability and performance.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'Playwright', icon: <Server className="h-8 w-8" /> },
              { name: 'Node.js', icon: <Gauge className="h-8 w-8" /> },
              { name: 'Docker', icon: <Layers className="h-8 w-8" /> },
              { name: 'Nginx', icon: <Lock className="h-8 w-8" /> }
            ].map((tech, index) => (
              <div key={index} className="text-center p-6 feature-card rounded-xl">
                <div className="text-blue-400 mb-4 flex justify-center">{tech.icon}</div>
                <h3 className="text-white font-semibold">{tech.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Deploy HeadlessX on your server today. Open source, self-hosted, and completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://github.com/SaifyXPRO/HeadlessX" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Clone Repository
            </a>
            <a href="#api" className="border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              View API Docs
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">HeadlessX v1.1.0</div>
                <div className="text-gray-400 text-sm">Open Source Browserless Web Scraping API</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <a href="https://github.com/SaifyXPRO/HeadlessX" className="text-gray-400 hover:text-white transition-colors text-sm">
                GitHub
              </a>
              <a href="#docs" className="text-gray-400 hover:text-white transition-colors text-sm">
                Documentation
              </a>
              <div className="text-gray-400 text-sm">
                © 2025 SaifyXPRO. Open Source under MIT License.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}