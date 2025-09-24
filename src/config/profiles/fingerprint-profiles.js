/**
 * Enhanced Browser Fingerprint Profiles
 * Comprehensive device fingerprint database with consistency validation
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const FINGERPRINT_PROFILES = {
  // === WINDOWS DESKTOP PROFILES ===
  "windows-chrome-high-end": {
    id: "windows-chrome-high-end",
    name: "Windows 10 Chrome High-End Desktop",
    category: "desktop",
    platform: "windows",
    browser: "chrome",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1
    },
    viewport: {
      width: 1366,
      height: 768
    },
    webgl: {
      vendor: "Google Inc. (NVIDIA)",
      renderer: "ANGLE (NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0)",
      unmaskedVendor: "NVIDIA Corporation",
      unmaskedRenderer: "NVIDIA GeForce RTX 3070/PCIe/SSE2",
      extensions: ["WEBGL_debug_renderer_info", "EXT_texture_filter_anisotropic", "EXT_frag_depth", "OES_texture_float", "OES_texture_float_linear"]
    },
    hardware: {
      cores: 8,
      memory: 16,
      platform: "Win32",
      maxTouchPoints: 0,
      hardwareConcurrency: 8,
      deviceMemory: 8
    },
    audio: {
      sampleRate: 44100,
      channelCount: 2,
      baseLatency: 0.01,
      outputLatency: 0.02
    },
    geolocation: {
      timezone: "America/New_York",
      language: "en-US",
      languages: ["en-US", "en"],
      locale: "en-US",
      currency: "USD"
    },
    behavioral: {
      mouseProfile: "confident",
      keyboardProfile: "fast",
      device: "mouse"
    }
  },

  "windows-chrome-mid-range": {
    id: "windows-chrome-mid-range",
    name: "Windows 10 Chrome Mid-Range Desktop",
    category: "desktop",
    platform: "windows",
    browser: "chrome",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1
    },
    viewport: {
      width: 1280,
      height: 720
    },
    webgl: {
      vendor: "Google Inc. (Intel)",
      renderer: "ANGLE (Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)",
      unmaskedVendor: "Intel Inc.",
      unmaskedRenderer: "Intel(R) UHD Graphics 630",
      extensions: ["WEBGL_debug_renderer_info", "EXT_texture_filter_anisotropic"]
    },
    hardware: {
      cores: 4,
      memory: 8,
      platform: "Win32",
      maxTouchPoints: 0,
      hardwareConcurrency: 4,
      deviceMemory: 8
    },
    audio: {
      sampleRate: 44100,
      channelCount: 2,
      baseLatency: 0.012,
      outputLatency: 0.025
    },
    geolocation: {
      timezone: "America/Chicago",
      language: "en-US",
      languages: ["en-US", "en"],
      locale: "en-US",
      currency: "USD"
    },
    behavioral: {
      mouseProfile: "natural",
      keyboardProfile: "normal",
      device: "mouse"
    }
  },

  "windows-firefox-standard": {
    id: "windows-firefox-standard",
    name: "Windows 10 Firefox Standard Desktop",
    category: "desktop",
    platform: "windows",
    browser: "firefox",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1
    },
    viewport: {
      width: 1366,
      height: 768
    },
    webgl: {
      vendor: "Mozilla",
      renderer: "Mozilla -- ANGLE (NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0)",
      unmaskedVendor: "Google Inc. (NVIDIA)",
      unmaskedRenderer: "ANGLE (NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0)",
      extensions: ["WEBGL_debug_renderer_info", "EXT_texture_filter_anisotropic", "EXT_frag_depth"]
    },
    hardware: {
      cores: 6,
      memory: 16,
      platform: "Win32",
      maxTouchPoints: 0,
      hardwareConcurrency: 6,
      deviceMemory: 8
    },
    audio: {
      sampleRate: 44100,
      channelCount: 2,
      baseLatency: 0.008,
      outputLatency: 0.015
    },
    geolocation: {
      timezone: "America/Los_Angeles",
      language: "en-US",
      languages: ["en-US", "en"],
      locale: "en-US",
      currency: "USD"
    },
    behavioral: {
      mouseProfile: "natural",
      keyboardProfile: "normal",
      device: "mouse"
    }
  },

  // === LAPTOP PROFILES ===
  "laptop-chrome-business": {
    id: "laptop-chrome-business",
    name: "Business Laptop Chrome",
    category: "laptop",
    platform: "windows",
    browser: "chrome",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    screen: {
      width: 1366,
      height: 768,
      availWidth: 1366,
      availHeight: 728,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1
    },
    viewport: {
      width: 1200,
      height: 600
    },
    webgl: {
      vendor: "Google Inc. (Intel)",
      renderer: "ANGLE (Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0)",
      unmaskedVendor: "Intel Inc.",
      unmaskedRenderer: "Intel(R) HD Graphics 620",
      extensions: ["WEBGL_debug_renderer_info", "EXT_texture_filter_anisotropic"]
    },
    hardware: {
      cores: 4,
      memory: 8,
      platform: "Win32",
      maxTouchPoints: 0,
      hardwareConcurrency: 4,
      deviceMemory: 8
    },
    audio: {
      sampleRate: 44100,
      channelCount: 2,
      baseLatency: 0.015,
      outputLatency: 0.03
    },
    geolocation: {
      timezone: "America/New_York",
      language: "en-US",
      languages: ["en-US", "en"],
      locale: "en-US",
      currency: "USD"
    },
    behavioral: {
      mouseProfile: "cautious",
      keyboardProfile: "normal",
      device: "trackpad"
    }
  },

  // === MACOS PROFILES ===
  "macos-safari-macbook": {
    id: "macos-safari-macbook",
    name: "MacBook Pro Safari",
    category: "laptop",
    platform: "macos",
    browser: "safari",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    screen: {
      width: 1440,
      height: 900,
      availWidth: 1440,
      availHeight: 875,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 2
    },
    viewport: {
      width: 1200,
      height: 700
    },
    webgl: {
      vendor: "WebKit",
      renderer: "WebKit WebGL",
      unmaskedVendor: "Apple Inc.",
      unmaskedRenderer: "Apple M1",
      extensions: ["WEBGL_debug_renderer_info", "EXT_texture_filter_anisotropic"]
    },
    hardware: {
      cores: 8,
      memory: 16,
      platform: "MacIntel",
      maxTouchPoints: 0,
      hardwareConcurrency: 8,
      deviceMemory: 8
    },
    audio: {
      sampleRate: 44100,
      channelCount: 2,
      baseLatency: 0.012,
      outputLatency: 0.025
    },
    geolocation: {
      timezone: "America/Los_Angeles",
      language: "en-US",
      languages: ["en-US", "en"],
      locale: "en-US",
      currency: "USD"
    },
    behavioral: {
      mouseProfile: "natural",
      keyboardProfile: "fast",
      device: "trackpad"
    }
  },

  // === MOBILE PROFILES ===
  "android-chrome-flagship": {
    id: "android-chrome-flagship",
    name: "Android Flagship Chrome",
    category: "mobile",
    platform: "android",
    browser: "chrome",
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
    screen: {
      width: 412,
      height: 915,
      availWidth: 412,
      availHeight: 915,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 3.5
    },
    viewport: {
      width: 412,
      height: 825
    },
    webgl: {
      vendor: "Qualcomm",
      renderer: "Adreno (TM) 660",
      unmaskedVendor: "Qualcomm",
      unmaskedRenderer: "Adreno (TM) 660",
      extensions: ["WEBGL_debug_renderer_info", "EXT_texture_filter_anisotropic"]
    },
    hardware: {
      cores: 8,
      memory: 12,
      platform: "Linux armv8l",
      maxTouchPoints: 5,
      hardwareConcurrency: 8,
      deviceMemory: 8
    },
    audio: {
      sampleRate: 44100,
      channelCount: 2,
      baseLatency: 0.02,
      outputLatency: 0.04
    },
    geolocation: {
      timezone: "America/New_York",
      language: "en-US",
      languages: ["en-US", "en"],
      locale: "en-US",
      currency: "USD"
    },
    behavioral: {
      mouseProfile: "natural",
      keyboardProfile: "normal",
      device: "touchscreen"
    }
  },

  // === TABLET PROFILES ===
  "ipad-safari-standard": {
    id: "ipad-safari-standard",
    name: "iPad Safari",
    category: "tablet",
    platform: "ios",
    browser: "safari",
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    screen: {
      width: 820,
      height: 1180,
      availWidth: 820,
      availHeight: 1180,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 2
    },
    viewport: {
      width: 820,
      height: 1080
    },
    webgl: {
      vendor: "Apple Inc.",
      renderer: "Apple GPU",
      unmaskedVendor: "Apple Inc.",
      unmaskedRenderer: "Apple A15 GPU",
      extensions: ["WEBGL_debug_renderer_info", "EXT_texture_filter_anisotropic"]
    },
    hardware: {
      cores: 6,
      memory: 8,
      platform: "iPad",
      maxTouchPoints: 5,
      hardwareConcurrency: 6,
      deviceMemory: 8
    },
    audio: {
      sampleRate: 44100,
      channelCount: 2,
      baseLatency: 0.02,
      outputLatency: 0.04
    },
    geolocation: {
      timezone: "America/Los_Angeles",
      language: "en-US",
      languages: ["en-US", "en"],
      locale: "en-US",
      currency: "USD"
    },
    behavioral: {
      mouseProfile: "natural",
      keyboardProfile: "normal",
      device: "touchscreen"
    }
  }
};

module.exports = FINGERPRINT_PROFILES;