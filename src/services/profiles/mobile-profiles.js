/**
 * Mobile Device Profiles v1.3.0
 * Comprehensive mobile device profiles for iOS and Android devices
 */

const MOBILE_PROFILES = {
  // iOS Devices
  'iphone-14-pro': {
    name: 'iPhone 14 Pro',
    type: 'mobile',
    platform: 'iOS',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    hardware: {
      processor: 'A16 Bionic',
      cores: 6,
      memory: 6144,
      storage: 128,
      gpu: 'Apple GPU (5-core)',
      screen: {
        width: 1179,
        height: 2556,
        density: 460,
        diagonal: 6.1
      }
    },
    sensors: {
      accelerometer: true,
      gyroscope: true,
      magnetometer: true,
      proximity: true,
      barometer: true,
      faceId: true
    },
    network: {
      cellular: '5G',
      wifi: '802.11ax',
      bluetooth: '5.3',
      nfc: true
    },
    behavioral: {
      scrollPattern: 'flick',
      tapPressure: 'light',
      swipeVelocity: 'fast',
      multiTouch: true,
      orientation: 'portrait'
    }
  },

  'iphone-13': {
    name: 'iPhone 13',
    type: 'mobile',
    platform: 'iOS',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    hardware: {
      processor: 'A15 Bionic',
      cores: 6,
      memory: 4096,
      storage: 128,
      gpu: 'Apple GPU (4-core)',
      screen: {
        width: 1170,
        height: 2532,
        density: 460,
        diagonal: 6.1
      }
    },
    sensors: {
      accelerometer: true,
      gyroscope: true,
      magnetometer: true,
      proximity: true,
      barometer: true,
      faceId: true
    },
    network: {
      cellular: '5G',
      wifi: '802.11ax',
      bluetooth: '5.0',
      nfc: true
    },
    behavioral: {
      scrollPattern: 'smooth',
      tapPressure: 'medium',
      swipeVelocity: 'medium',
      multiTouch: true,
      orientation: 'portrait'
    }
  },

  'ipad-pro-12.9': {
    name: 'iPad Pro 12.9"',
    type: 'tablet',
    platform: 'iOS',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    hardware: {
      processor: 'M2',
      cores: 8,
      memory: 8192,
      storage: 256,
      gpu: 'Apple M2 GPU (10-core)',
      screen: {
        width: 2048,
        height: 2732,
        density: 264,
        diagonal: 12.9
      }
    },
    sensors: {
      accelerometer: true,
      gyroscope: true,
      magnetometer: true,
      proximity: false,
      barometer: true,
      faceId: true,
      applePencil: true
    },
    network: {
      cellular: '5G',
      wifi: '802.11ax',
      bluetooth: '5.3',
      nfc: false
    },
    behavioral: {
      scrollPattern: 'precise',
      tapPressure: 'firm',
      swipeVelocity: 'controlled',
      multiTouch: true,
      orientation: 'landscape'
    }
  },

  // Android Devices
  'samsung-galaxy-s23': {
    name: 'Samsung Galaxy S23',
    type: 'mobile',
    platform: 'Android',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    hardware: {
      processor: 'Snapdragon 8 Gen 2',
      cores: 8,
      memory: 8192,
      storage: 256,
      gpu: 'Adreno 740',
      screen: {
        width: 1080,
        height: 2340,
        density: 425,
        diagonal: 6.1
      }
    },
    sensors: {
      accelerometer: true,
      gyroscope: true,
      magnetometer: true,
      proximity: true,
      barometer: true,
      fingerprint: true,
      heartRate: true
    },
    network: {
      cellular: '5G',
      wifi: '802.11ax',
      bluetooth: '5.3',
      nfc: true
    },
    behavioral: {
      scrollPattern: 'bounce',
      tapPressure: 'variable',
      swipeVelocity: 'adaptive',
      multiTouch: true,
      orientation: 'portrait'
    },
    android: {
      version: '13',
      apiLevel: 33,
      build: 'SM-S911U',
      manufacturer: 'Samsung'
    }
  },

  'pixel-7-pro': {
    name: 'Google Pixel 7 Pro',
    type: 'mobile',
    platform: 'Android',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 3.5,
    isMobile: true,
    hasTouch: true,
    hardware: {
      processor: 'Google Tensor G2',
      cores: 8,
      memory: 12288,
      storage: 256,
      gpu: 'Mali-G710 MP7',
      screen: {
        width: 1440,
        height: 3120,
        density: 512,
        diagonal: 6.7
      }
    },
    sensors: {
      accelerometer: true,
      gyroscope: true,
      magnetometer: true,
      proximity: true,
      barometer: true,
      fingerprint: true,
      ambient: true
    },
    network: {
      cellular: '5G',
      wifi: '802.11ax',
      bluetooth: '5.2',
      nfc: true
    },
    behavioral: {
      scrollPattern: 'smooth',
      tapPressure: 'consistent',
      swipeVelocity: 'natural',
      multiTouch: true,
      orientation: 'portrait'
    },
    android: {
      version: '13',
      apiLevel: 33,
      build: 'TD1A.220804.031',
      manufacturer: 'Google'
    }
  },

  'oneplus-11': {
    name: 'OnePlus 11',
    type: 'mobile',
    platform: 'Android',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; CPH2449) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    hardware: {
      processor: 'Snapdragon 8 Gen 2',
      cores: 8,
      memory: 16384,
      storage: 256,
      gpu: 'Adreno 740',
      screen: {
        width: 1440,
        height: 3216,
        density: 525,
        diagonal: 6.7
      }
    },
    sensors: {
      accelerometer: true,
      gyroscope: true,
      magnetometer: true,
      proximity: true,
      barometer: false,
      fingerprint: true,
      ambient: true
    },
    network: {
      cellular: '5G',
      wifi: '802.11ax',
      bluetooth: '5.3',
      nfc: true
    },
    behavioral: {
      scrollPattern: 'fluid',
      tapPressure: 'responsive',
      swipeVelocity: 'quick',
      multiTouch: true,
      orientation: 'portrait'
    },
    android: {
      version: '13',
      apiLevel: 33,
      build: 'CPH2449',
      manufacturer: 'OnePlus'
    }
  },

  // Tablet Devices
  'galaxy-tab-s8': {
    name: 'Samsung Galaxy Tab S8',
    type: 'tablet',
    platform: 'Android',
    userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-X706B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 800, height: 1280 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    hardware: {
      processor: 'Snapdragon 8 Gen 1',
      cores: 8,
      memory: 8192,
      storage: 128,
      gpu: 'Adreno 730',
      screen: {
        width: 1600,
        height: 2560,
        density: 274,
        diagonal: 11.0
      }
    },
    sensors: {
      accelerometer: true,
      gyroscope: true,
      magnetometer: true,
      proximity: false,
      barometer: true,
      fingerprint: true,
      spen: true
    },
    network: {
      cellular: '5G',
      wifi: '802.11ax',
      bluetooth: '5.2',
      nfc: false
    },
    behavioral: {
      scrollPattern: 'precise',
      tapPressure: 'deliberate',
      swipeVelocity: 'measured',
      multiTouch: true,
      orientation: 'landscape',
      stylus: true
    },
    android: {
      version: '12',
      apiLevel: 31,
      build: 'SM-X706B',
      manufacturer: 'Samsung'
    }
  }
};

/**
 * Mobile Profile Manager
 */
class MobileProfileManager {
  constructor() {
    this.profiles = MOBILE_PROFILES;
  }

  /**
   * Get all available mobile profiles
   */
  getAllProfiles() {
    return Object.keys(this.profiles).map(key => ({
      id: key,
      ...this.profiles[key]
    }));
  }

  /**
   * Get profile by ID
   */
  getProfile(profileId) {
    return this.profiles[profileId] || null;
  }

  /**
   * Get profiles by platform
   */
  getProfilesByPlatform(platform) {
    return Object.keys(this.profiles)
      .filter(key => this.profiles[key].platform === platform)
      .map(key => ({
        id: key,
        ...this.profiles[key]
      }));
  }

  /**
   * Get profiles by type
   */
  getProfilesByType(type) {
    return Object.keys(this.profiles)
      .filter(key => this.profiles[key].type === type)
      .map(key => ({
        id: key,
        ...this.profiles[key]
      }));
  }

  /**
   * Generate mobile-specific browser context options
   */
  generateContextOptions(profileId) {
    const profile = this.getProfile(profileId);
    if (!profile) return null;

    return {
      userAgent: profile.userAgent,
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor,
      isMobile: profile.isMobile,
      hasTouch: profile.hasTouch,
      geolocation: this.generateMobileGeolocation(profile),
      permissions: this.generateMobilePermissions(profile)
    };
  }

  /**
   * Generate mobile-specific geolocation
   */
  generateMobileGeolocation(profile) {
    // Default to major cities based on platform
    const locations = {
      iOS: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
      Android: { latitude: 34.0522, longitude: -118.2437 } // Los Angeles
    };

    return locations[profile.platform] || locations.iOS;
  }

  /**
   * Generate mobile-specific permissions
   */
  generateMobilePermissions(profile) {
    const basePermissions = ['geolocation'];
    
    if (profile.sensors?.accelerometer) {
      basePermissions.push('accelerometer');
    }
    
    if (profile.sensors?.gyroscope) {
      basePermissions.push('gyroscope');
    }
    
    if (profile.sensors?.magnetometer) {
      basePermissions.push('magnetometer');
    }
    
    if (profile.network?.nfc) {
      basePermissions.push('nfc');
    }

    return basePermissions;
  }

  /**
   * Generate mobile fingerprint data
   */
  generateMobileFingerprint(profileId) {
    const profile = this.getProfile(profileId);
    if (!profile) return null;

    return {
      screen: {
        width: profile.hardware.screen.width,
        height: profile.hardware.screen.height,
        pixelDepth: 24,
        colorDepth: 24,
        availWidth: profile.hardware.screen.width,
        availHeight: profile.hardware.screen.height - 20 // Status bar
      },
      navigator: {
        platform: profile.platform === 'iOS' ? 'iPhone' : 'Linux armv8l',
        hardwareConcurrency: profile.hardware.cores,
        deviceMemory: Math.floor(profile.hardware.memory / 1024),
        maxTouchPoints: profile.hasTouch ? 5 : 0,
        connection: {
          effectiveType: profile.network.cellular === '5G' ? '4g' : '3g',
          downlink: profile.network.cellular === '5G' ? 10 : 1.5,
          rtt: profile.network.cellular === '5G' ? 50 : 150
        }
      },
      sensors: profile.sensors,
      battery: this.generateBatteryInfo(),
      orientation: profile.behavioral?.orientation || 'portrait'
    };
  }

  /**
   * Generate realistic battery information
   */
  generateBatteryInfo() {
    return {
      charging: Math.random() < 0.3, // 30% chance charging
      chargingTime: Infinity,
      dischargingTime: Math.floor(Math.random() * 28800) + 3600, // 1-8 hours
      level: Math.random() * 0.8 + 0.2 // 20-100%
    };
  }

  /**
   * Apply mobile-specific overrides to page
   */
  async applyMobileOverrides(page, profileId) {
    const profile = this.getProfile(profileId);
    if (!profile) return;

    await page.addInitScript((profileData) => {
      // Override touch events
      Object.defineProperty(navigator, 'maxTouchPoints', {
        get: () => profileData.hasTouch ? 5 : 0,
        configurable: true
      });

      // Override device-specific properties
      if (profileData.platform === 'iOS') {
        Object.defineProperty(navigator, 'platform', {
          get: () => 'iPhone',
          configurable: true
        });
        
        // iOS-specific properties
        window.DeviceMotionEvent = window.DeviceMotionEvent || function() {};
        window.DeviceOrientationEvent = window.DeviceOrientationEvent || function() {};
      } else if (profileData.platform === 'Android') {
        Object.defineProperty(navigator, 'platform', {
          get: () => 'Linux armv8l',
          configurable: true
        });
        
        // Android-specific properties
        window.chrome = window.chrome || {
          runtime: {},
          loadTimes: function() {},
          csi: function() {}
        };
      }

      // Override connection information
      if (navigator.connection) {
        Object.defineProperty(navigator.connection, 'effectiveType', {
          get: () => profileData.network.cellular === '5G' ? '4g' : '3g',
          configurable: true
        });
        
        Object.defineProperty(navigator.connection, 'downlink', {
          get: () => profileData.network.cellular === '5G' ? 10 : 1.5,
          configurable: true
        });
      }

      // Override device memory
      if (profileData.hardware.memory) {
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => Math.floor(profileData.hardware.memory / 1024),
          configurable: true
        });
      }

      // Override hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => profileData.hardware.cores,
        configurable: true
      });

      // Override orientation
      if (screen.orientation) {
        Object.defineProperty(screen.orientation, 'type', {
          get: () => profileData.behavioral?.orientation === 'landscape' ? 
            'landscape-primary' : 'portrait-primary',
          configurable: true
        });
      }
    }, profile);
  }
}

module.exports = { 
  MOBILE_PROFILES,
  MobileProfileManager
};