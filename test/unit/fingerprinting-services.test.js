/**
 * HeadlessX v1.3.0 - Fingerprinting Services Unit Tests
 * Tests for all advanced fingerprinting modules
 */

const { expect } = require('@jest/globals');

// Import fingerprinting services
const CanvasSpoofing = require('../../src/services/fingerprinting/canvas-spoofing');
const WebGLSpoofing = require('../../src/services/fingerprinting/webgl-spoofing');
const AudioContext = require('../../src/services/fingerprinting/audio-context');
const WebRTCController = require('../../src/services/fingerprinting/webrtc-controller');
const HardwareNoise = require('../../src/services/fingerprinting/hardware-noise');
const TimezoneManager = require('../../src/services/fingerprinting/timezone-manager');
const FontSpoofing = require('../../src/services/fingerprinting/font-spoofing');
const MediaDevices = require('../../src/services/fingerprinting/media-devices');
const ClientRects = require('../../src/services/fingerprinting/client-rects');
const SpeechSynthesis = require('../../src/services/fingerprinting/speech-synthesis');
const NavigatorProps = require('../../src/services/fingerprinting/navigator-props');

describe('Fingerprinting Services Unit Tests', () => {
    describe('Canvas Spoofing', () => {
        let canvasSpoofing;

        beforeEach(() => {
            canvasSpoofing = new CanvasSpoofing({
                noiseLevel: 'medium',
                consistencyKey: 'test-key-123'
            });
        });

        test('should initialize with proper configuration', () => {
            expect(canvasSpoofing).toBeDefined();
            expect(canvasSpoofing.noiseLevel).toBe('medium');
            expect(canvasSpoofing.consistencyKey).toBe('test-key-123');
        });

        test('should generate consistent noise patterns', () => {
            const noise1 = canvasSpoofing.generateNoise(100, 100, 'test-context-1');
            const noise2 = canvasSpoofing.generateNoise(100, 100, 'test-context-1');
            
            expect(noise1).toEqual(noise2);
        });

        test('should generate different noise for different contexts', () => {
            const noise1 = canvasSpoofing.generateNoise(100, 100, 'context-1');
            const noise2 = canvasSpoofing.generateNoise(100, 100, 'context-2');
            
            expect(noise1).not.toEqual(noise2);
        });

        test('should generate script for browser injection', () => {
            const script = canvasSpoofing.getInjectionScript();
            
            expect(script).toContain('HTMLCanvasElement.prototype.toDataURL');
            expect(script).toContain('getImageData');
            expect(typeof script).toBe('string');
        });
    });

    describe('WebGL Spoofing', () => {
        let webglSpoofing;

        beforeEach(() => {
            webglSpoofing = new WebGLSpoofing({
                vendor: 'NVIDIA Corporation',
                renderer: 'NVIDIA GeForce RTX 3080',
                version: 'WebGL 1.0',
                extensions: ['WEBGL_debug_renderer_info']
            });
        });

        test('should initialize with WebGL configuration', () => {
            expect(webglSpoofing.vendor).toBe('NVIDIA Corporation');
            expect(webglSpoofing.renderer).toBe('NVIDIA GeForce RTX 3080');
            expect(webglSpoofing.extensions).toContain('WEBGL_debug_renderer_info');
        });

        test('should generate WebGL parameter overrides', () => {
            const parameters = webglSpoofing.generateParameters();
            
            expect(parameters).toHaveProperty('MAX_TEXTURE_SIZE');
            expect(parameters).toHaveProperty('MAX_RENDERBUFFER_SIZE');
            expect(typeof parameters.MAX_TEXTURE_SIZE).toBe('number');
        });

        test('should create injection script for WebGL spoofing', () => {
            const script = webglSpoofing.getInjectionScript();
            
            expect(script).toContain('WebGLRenderingContext.prototype.getParameter');
            expect(script).toContain('WEBGL_debug_renderer_info');
            expect(typeof script).toBe('string');
        });
    });

    describe('Audio Context Spoofing', () => {
        let audioContext;

        beforeEach(() => {
            audioContext = new AudioContext({
                sampleRate: 44100,
                fingerprint: '124.04347527516074'
            });
        });

        test('should initialize with audio configuration', () => {
            expect(audioContext.sampleRate).toBe(44100);
            expect(audioContext.fingerprint).toBe('124.04347527516074');
        });

        test('should generate consistent audio fingerprint', () => {
            const fingerprint1 = audioContext.generateFingerprint('test-seed');
            const fingerprint2 = audioContext.generateFingerprint('test-seed');
            
            expect(fingerprint1).toBe(fingerprint2);
        });

        test('should create audio context injection script', () => {
            const script = audioContext.getInjectionScript();
            
            expect(script).toContain('AudioContext');
            expect(script).toContain('webkitAudioContext');
            expect(script).toContain('createOscillator');
            expect(typeof script).toBe('string');
        });
    });

    describe('WebRTC Controller', () => {
        let webrtcController;

        beforeEach(() => {
            webrtcController = new WebRTCController({
                blockPublicIP: true,
                blockLocalIPs: true,
                allowedIPs: ['127.0.0.1']
            });
        });

        test('should initialize with WebRTC configuration', () => {
            expect(webrtcController.blockPublicIP).toBe(true);
            expect(webrtcController.blockLocalIPs).toBe(true);
            expect(webrtcController.allowedIPs).toContain('127.0.0.1');
        });

        test('should detect IP leak attempts', () => {
            const isLeaky = webrtcController.detectIPLeak('192.168.1.1');
            expect(typeof isLeaky).toBe('boolean');
        });

        test('should generate WebRTC blocking script', () => {
            const script = webrtcController.getInjectionScript();
            
            expect(script).toContain('RTCPeerConnection');
            expect(script).toContain('createDataChannel');
            expect(script).toContain('onicecandidate');
            expect(typeof script).toBe('string');
        });
    });

    describe('Hardware Noise Generator', () => {
        let hardwareNoise;

        beforeEach(() => {
            hardwareNoise = new HardwareNoise({
                cpuNoise: 0.1,
                memoryNoise: 0.05,
                timingNoise: 0.02
            });
        });

        test('should initialize with noise configuration', () => {
            expect(hardwareNoise.cpuNoise).toBe(0.1);
            expect(hardwareNoise.memoryNoise).toBe(0.05);
            expect(hardwareNoise.timingNoise).toBe(0.02);
        });

        test('should generate consistent hardware metrics', () => {
            const metrics1 = hardwareNoise.generateHardwareMetrics('test-seed');
            const metrics2 = hardwareNoise.generateHardwareMetrics('test-seed');
            
            expect(metrics1).toEqual(metrics2);
        });

        test('should apply timing noise to performance measurements', () => {
            const baseTime = 100;
            const noisyTime = hardwareNoise.applyTimingNoise(baseTime, 'test-context');
            
            expect(noisyTime).not.toBe(baseTime);
            expect(Math.abs(noisyTime - baseTime)).toBeLessThan(baseTime * 0.1);
        });
    });

    describe('Timezone Manager', () => {
        let timezoneManager;

        beforeEach(() => {
            timezoneManager = new TimezoneManager({
                timezone: 'America/New_York',
                locale: 'en-US',
                currency: 'USD'
            });
        });

        test('should initialize with timezone configuration', () => {
            expect(timezoneManager.timezone).toBe('America/New_York');
            expect(timezoneManager.locale).toBe('en-US');
            expect(timezoneManager.currency).toBe('USD');
        });

        test('should validate timezone consistency', () => {
            const isConsistent = timezoneManager.validateConsistency('en-US', 'USD');
            expect(isConsistent).toBe(true);
        });

        test('should generate timezone override script', () => {
            const script = timezoneManager.getInjectionScript();
            
            expect(script).toContain('Date.prototype.getTimezoneOffset');
            expect(script).toContain('Intl.DateTimeFormat');
            expect(typeof script).toBe('string');
        });
    });

    describe('Font Spoofing', () => {
        let fontSpoofing;

        beforeEach(() => {
            fontSpoofing = new FontSpoofing({
                systemFonts: ['Arial', 'Times New Roman', 'Helvetica'],
                fontLoadingDelay: 50
            });
        });

        test('should initialize with font configuration', () => {
            expect(fontSpoofing.systemFonts).toContain('Arial');
            expect(fontSpoofing.fontLoadingDelay).toBe(50);
        });

        test('should generate consistent font metrics', () => {
            const metrics1 = fontSpoofing.generateFontMetrics('Arial', 'test-seed');
            const metrics2 = fontSpoofing.generateFontMetrics('Arial', 'test-seed');
            
            expect(metrics1).toEqual(metrics2);
        });

        test('should create font spoofing injection script', () => {
            const script = fontSpoofing.getInjectionScript();
            
            expect(script).toContain('document.fonts');
            expect(script).toContain('FontFace');
            expect(typeof script).toBe('string');
        });
    });

    describe('Media Devices Spoofing', () => {
        let mediaDevices;

        beforeEach(() => {
            mediaDevices = new MediaDevices({
                cameras: ['HD Webcam'],
                microphones: ['Built-in Microphone'],
                speakers: ['Built-in Speakers']
            });
        });

        test('should initialize with media device configuration', () => {
            expect(mediaDevices.cameras).toContain('HD Webcam');
            expect(mediaDevices.microphones).toContain('Built-in Microphone');
            expect(mediaDevices.speakers).toContain('Built-in Speakers');
        });

        test('should generate media device list', () => {
            const devices = mediaDevices.generateDeviceList();
            
            expect(Array.isArray(devices)).toBe(true);
            expect(devices.length).toBeGreaterThan(0);
            expect(devices[0]).toHaveProperty('deviceId');
            expect(devices[0]).toHaveProperty('label');
        });

        test('should create media devices injection script', () => {
            const script = mediaDevices.getInjectionScript();
            
            expect(script).toContain('navigator.mediaDevices');
            expect(script).toContain('enumerateDevices');
            expect(typeof script).toBe('string');
        });
    });

    describe('Client Rects Spoofing', () => {
        let clientRects;

        beforeEach(() => {
            clientRects = new ClientRects({
                noiseLevel: 0.1,
                consistencyKey: 'test-client-rects'
            });
        });

        test('should initialize with client rects configuration', () => {
            expect(clientRects.noiseLevel).toBe(0.1);
            expect(clientRects.consistencyKey).toBe('test-client-rects');
        });

        test('should generate consistent rect modifications', () => {
            const rect1 = clientRects.modifyRect({ x: 10, y: 20, width: 100, height: 50 }, 'test-element');
            const rect2 = clientRects.modifyRect({ x: 10, y: 20, width: 100, height: 50 }, 'test-element');
            
            expect(rect1).toEqual(rect2);
        });

        test('should create client rects injection script', () => {
            const script = clientRects.getInjectionScript();
            
            expect(script).toContain('Element.prototype.getBoundingClientRect');
            expect(script).toContain('getClientRects');
            expect(typeof script).toBe('string');
        });
    });

    describe('Speech Synthesis Spoofing', () => {
        let speechSynthesis;

        beforeEach(() => {
            speechSynthesis = new SpeechSynthesis({
                voices: [
                    { name: 'Microsoft David', lang: 'en-US' },
                    { name: 'Microsoft Zira', lang: 'en-US' }
                ]
            });
        });

        test('should initialize with speech synthesis configuration', () => {
            expect(speechSynthesis.voices).toHaveLength(2);
            expect(speechSynthesis.voices[0].name).toBe('Microsoft David');
        });

        test('should generate voice list', () => {
            const voices = speechSynthesis.generateVoices();
            
            expect(Array.isArray(voices)).toBe(true);
            expect(voices.length).toBeGreaterThan(0);
            expect(voices[0]).toHaveProperty('name');
            expect(voices[0]).toHaveProperty('lang');
        });

        test('should create speech synthesis injection script', () => {
            const script = speechSynthesis.getInjectionScript();
            
            expect(script).toContain('speechSynthesis');
            expect(script).toContain('getVoices');
            expect(typeof script).toBe('string');
        });
    });

    describe('Navigator Properties Spoofing', () => {
        let navigatorProps;

        beforeEach(() => {
            navigatorProps = new NavigatorProps({
                platform: 'Win32',
                userAgent: 'Mozilla/5.0...',
                language: 'en-US',
                languages: ['en-US', 'en'],
                hardwareConcurrency: 8,
                deviceMemory: 8
            });
        });

        test('should initialize with navigator configuration', () => {
            expect(navigatorProps.platform).toBe('Win32');
            expect(navigatorProps.hardwareConcurrency).toBe(8);
            expect(navigatorProps.languages).toContain('en-US');
        });

        test('should validate property consistency', () => {
            const isConsistent = navigatorProps.validateConsistency();
            expect(typeof isConsistent).toBe('boolean');
        });

        test('should create navigator properties injection script', () => {
            const script = navigatorProps.getInjectionScript();
            
            expect(script).toContain('Object.defineProperty');
            expect(script).toContain('navigator');
            expect(script).toContain('platform');
            expect(typeof script).toBe('string');
        });
    });

    describe('Integration Tests', () => {
        test('should coordinate multiple fingerprinting services', () => {
            const canvasService = new CanvasSpoofing({ noiseLevel: 'low' });
            const webglService = new WebGLSpoofing({ vendor: 'NVIDIA' });
            const audioService = new AudioContext({ sampleRate: 44100 });

            const canvasScript = canvasService.getInjectionScript();
            const webglScript = webglService.getInjectionScript();
            const audioScript = audioService.getInjectionScript();

            // All scripts should be valid JavaScript strings
            expect(typeof canvasScript).toBe('string');
            expect(typeof webglScript).toBe('string');
            expect(typeof audioScript).toBe('string');

            // Scripts should not conflict with each other
            expect(canvasScript).not.toContain('WebGL');
            expect(webglScript).not.toContain('Canvas');
            expect(audioScript).not.toContain('WebGL');
        });

        test('should maintain consistent fingerprints across services', () => {
            const consistencyKey = 'integration-test-key';
            
            const canvasService = new CanvasSpoofing({ 
                noiseLevel: 'medium', 
                consistencyKey 
            });
            
            const hardwareService = new HardwareNoise({
                cpuNoise: 0.1,
                consistencyKey
            });

            const canvasNoise1 = canvasService.generateNoise(100, 100, 'test');
            const canvasNoise2 = canvasService.generateNoise(100, 100, 'test');
            
            const hardware1 = hardwareService.generateHardwareMetrics('test');
            const hardware2 = hardwareService.generateHardwareMetrics('test');

            expect(canvasNoise1).toEqual(canvasNoise2);
            expect(hardware1).toEqual(hardware2);
        });
    });
});
 
 