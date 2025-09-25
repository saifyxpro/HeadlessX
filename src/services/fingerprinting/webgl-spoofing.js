/**
 * WebGL Fingerprinting Control
 * Advanced WebGL fingerprint manipulation and spoofing
 * HeadlessX v1.3.0 - Enhanced Anti-Detection
 */

const crypto = require('crypto');

class WebGLSpoofing {
    constructor() {
        this.vendorProfiles = {
            'nvidia-gtx': {
                vendor: 'NVIDIA Corporation',
                renderer: 'NVIDIA GeForce GTX 1660/PCIe/SSE2',
                unmaskedVendor: 'Google Inc. (NVIDIA)',
                unmaskedRenderer: 'ANGLE (NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0)',
                extensions: ['WEBGL_debug_renderer_info', 'EXT_texture_filter_anisotropic', 'EXT_frag_depth', 'OES_texture_float']
            },
            'nvidia-rtx': {
                vendor: 'NVIDIA Corporation',
                renderer: 'NVIDIA GeForce RTX 3070/PCIe/SSE2',
                unmaskedVendor: 'Google Inc. (NVIDIA)',
                unmaskedRenderer: 'ANGLE (NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0)',
                extensions: ['WEBGL_debug_renderer_info', 'EXT_texture_filter_anisotropic', 'EXT_frag_depth', 'OES_texture_float']
            },
            'intel-hd': {
                vendor: 'Intel Inc.',
                renderer: 'Intel(R) HD Graphics 4000',
                unmaskedVendor: 'Google Inc. (Intel)',
                unmaskedRenderer: 'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)',
                extensions: ['WEBGL_debug_renderer_info', 'EXT_texture_filter_anisotropic']
            },
            'amd-radeon': {
                vendor: 'ATI Technologies Inc.',
                renderer: 'AMD Radeon RX 580 Series',
                unmaskedVendor: 'Google Inc. (AMD)',
                unmaskedRenderer: 'ANGLE (AMD Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0)',
                extensions: ['WEBGL_debug_renderer_info', 'EXT_texture_filter_anisotropic', 'EXT_frag_depth', 'OES_texture_float']
            }
        };

        this.parameterValues = {
            // Common WebGL parameters with realistic values
            MAX_VIEWPORT_DIMS: [16384, 16384],
            MAX_TEXTURE_SIZE: 16384,
            MAX_COMBINED_TEXTURE_IMAGE_UNITS: 80,
            MAX_CUBE_MAP_TEXTURE_SIZE: 16384,
            MAX_RENDERBUFFER_SIZE: 16384,
            MAX_TEXTURE_IMAGE_UNITS: 16,
            MAX_VERTEX_TEXTURE_IMAGE_UNITS: 16,
            MAX_FRAGMENT_UNIFORM_VECTORS: 1024,
            MAX_VERTEX_UNIFORM_VECTORS: 1024,
            MAX_VARYING_VECTORS: 30,
            MAX_VERTEX_ATTRIBS: 16,
            ALIASED_LINE_WIDTH_RANGE: [1, 1],
            ALIASED_POINT_SIZE_RANGE: [1, 8191]
        };
    }

    /**
     * Generate WebGL spoofing script for page injection
     * @param {string} profileId - Profile identifier
     * @param {string} vendorProfile - Vendor profile key
     * @param {Object} customParams - Custom WebGL parameters
     * @returns {string} JavaScript code for WebGL spoofing
     */
    getWebGLSpoofingScript(profileId, vendorProfile = 'nvidia-gtx', customParams = {}) {
        const profile = this.vendorProfiles[vendorProfile] || this.vendorProfiles['nvidia-gtx'];
        const params = { ...this.parameterValues, ...customParams };

        return `
        (function() {
            const profileId = '${profileId}';
            const vendorProfile = ${JSON.stringify(profile)};
            const parameterValues = ${JSON.stringify(params)};
            
            // WebGL constants
            const GL_CONSTANTS = {
                VENDOR: 7936,
                RENDERER: 7937,
                VERSION: 7938,
                SHADING_LANGUAGE_VERSION: 35724,
                UNMASKED_VENDOR_WEBGL: 37445,
                UNMASKED_RENDERER_WEBGL: 37446,
                MAX_VIEWPORT_DIMS: 33901,
                MAX_TEXTURE_SIZE: 3379,
                MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
                MAX_CUBE_MAP_TEXTURE_SIZE: 34076,
                MAX_RENDERBUFFER_SIZE: 34024,
                MAX_TEXTURE_IMAGE_UNITS: 34930,
                MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
                MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
                MAX_VERTEX_UNIFORM_VECTORS: 36347,
                MAX_VARYING_VECTORS: 36348,
                MAX_VERTEX_ATTRIBS: 34921,
                ALIASED_LINE_WIDTH_RANGE: 33902,
                ALIASED_POINT_SIZE_RANGE: 33901
            };

            // Override getContext for both webgl and experimental-webgl
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
                const context = originalGetContext.call(this, contextType, ...args);
                
                if (context && (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2')) {
                    
                    // Override getParameter
                    const originalGetParameter = context.getParameter;
                    context.getParameter = function(parameter) {
                        try {
                            switch (parameter) {
                                case GL_CONSTANTS.VENDOR:
                                    return vendorProfile.vendor;
                                case GL_CONSTANTS.RENDERER:
                                    return vendorProfile.renderer;
                                case GL_CONSTANTS.UNMASKED_VENDOR_WEBGL:
                                    return vendorProfile.unmaskedVendor;
                                case GL_CONSTANTS.UNMASKED_RENDERER_WEBGL:
                                    return vendorProfile.unmaskedRenderer;
                                case GL_CONSTANTS.VERSION:
                                    return 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
                                case GL_CONSTANTS.SHADING_LANGUAGE_VERSION:
                                    return 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)';
                                case GL_CONSTANTS.MAX_VIEWPORT_DIMS:
                                    return new Int32Array(parameterValues.MAX_VIEWPORT_DIMS);
                                case GL_CONSTANTS.MAX_TEXTURE_SIZE:
                                    return parameterValues.MAX_TEXTURE_SIZE;
                                case GL_CONSTANTS.MAX_COMBINED_TEXTURE_IMAGE_UNITS:
                                    return parameterValues.MAX_COMBINED_TEXTURE_IMAGE_UNITS;
                                case GL_CONSTANTS.MAX_CUBE_MAP_TEXTURE_SIZE:
                                    return parameterValues.MAX_CUBE_MAP_TEXTURE_SIZE;
                                case GL_CONSTANTS.MAX_RENDERBUFFER_SIZE:
                                    return parameterValues.MAX_RENDERBUFFER_SIZE;
                                case GL_CONSTANTS.MAX_TEXTURE_IMAGE_UNITS:
                                    return parameterValues.MAX_TEXTURE_IMAGE_UNITS;
                                case GL_CONSTANTS.MAX_VERTEX_TEXTURE_IMAGE_UNITS:
                                    return parameterValues.MAX_VERTEX_TEXTURE_IMAGE_UNITS;
                                case GL_CONSTANTS.MAX_FRAGMENT_UNIFORM_VECTORS:
                                    return parameterValues.MAX_FRAGMENT_UNIFORM_VECTORS;
                                case GL_CONSTANTS.MAX_VERTEX_UNIFORM_VECTORS:
                                    return parameterValues.MAX_VERTEX_UNIFORM_VECTORS;
                                case GL_CONSTANTS.MAX_VARYING_VECTORS:
                                    return parameterValues.MAX_VARYING_VECTORS;
                                case GL_CONSTANTS.MAX_VERTEX_ATTRIBS:
                                    return parameterValues.MAX_VERTEX_ATTRIBS;
                                case GL_CONSTANTS.ALIASED_LINE_WIDTH_RANGE:
                                    return new Float32Array(parameterValues.ALIASED_LINE_WIDTH_RANGE);
                                case GL_CONSTANTS.ALIASED_POINT_SIZE_RANGE:
                                    return new Float32Array(parameterValues.ALIASED_POINT_SIZE_RANGE);
                                default:
                                    return originalGetParameter.call(this, parameter);
                            }
                        } catch (e) {
                            return originalGetParameter.call(this, parameter);
                        }
                    };

                    // Override getSupportedExtensions
                    const originalGetSupportedExtensions = context.getSupportedExtensions;
                    context.getSupportedExtensions = function() {
                        try {
                            // Return consistent extension list based on vendor profile
                            const baseExtensions = [
                                'ANGLE_instanced_arrays',
                                'EXT_blend_minmax',
                                'EXT_color_buffer_half_float',
                                'EXT_disjoint_timer_query',
                                'EXT_frag_depth',
                                'EXT_shader_texture_lod',
                                'EXT_texture_filter_anisotropic',
                                'WEBKIT_EXT_texture_filter_anisotropic',
                                'EXT_sRGB',
                                'OES_element_index_uint',
                                'OES_standard_derivatives',
                                'OES_texture_float',
                                'OES_texture_float_linear',
                                'OES_texture_half_float',
                                'OES_texture_half_float_linear',
                                'OES_vertex_array_object',
                                'WEBGL_color_buffer_float',
                                'WEBGL_compressed_texture_s3tc',
                                'WEBKIT_WEBGL_compressed_texture_s3tc',
                                'WEBGL_debug_renderer_info',
                                'WEBGL_debug_shaders',
                                'WEBGL_depth_texture',
                                'WEBKIT_WEBGL_depth_texture',
                                'WEBGL_draw_buffers',
                                'WEBGL_lose_context'
                            ];

                            return baseExtensions.concat(vendorProfile.extensions || []);
                        } catch (e) {
                            return originalGetSupportedExtensions ? originalGetSupportedExtensions.call(this) : [];
                        }
                    };

                    // Override getExtension
                    const originalGetExtension = context.getExtension;
                    context.getExtension = function(name) {
                        try {
                            if (name === 'WEBGL_debug_renderer_info') {
                                return {
                                    UNMASKED_VENDOR_WEBGL: GL_CONSTANTS.UNMASKED_VENDOR_WEBGL,
                                    UNMASKED_RENDERER_WEBGL: GL_CONSTANTS.UNMASKED_RENDERER_WEBGL
                                };
                            }
                            return originalGetExtension.call(this, name);
                        } catch (e) {
                            return originalGetExtension.call(this, name);
                        }
                    };

                    // Override getShaderPrecisionFormat for consistent shader capabilities
                    const originalGetShaderPrecisionFormat = context.getShaderPrecisionFormat;
                    context.getShaderPrecisionFormat = function(shaderType, precisionType) {
                        try {
                            // Return consistent precision format
                            return {
                                rangeMin: 127,
                                rangeMax: 127,
                                precision: 23
                            };
                        } catch (e) {
                            return originalGetShaderPrecisionFormat.call(this, shaderType, precisionType);
                        }
                    };

                    // Override shader compilation for consistent results
                    const originalShaderSource = context.shaderSource;
                    context.shaderSource = function(shader, source) {
                        try {
                            // Add profile-specific comment to shader source for consistency
                            const modifiedSource = '// Profile: ' + profileId.slice(0, 8) + '\\n' + source;
                            return originalShaderSource.call(this, shader, modifiedSource);
                        } catch (e) {
                            return originalShaderSource.call(this, shader, source);
                        }
                    };

                    console.log('🎮 WebGL fingerprint spoofing active - Vendor:', vendorProfile.unmaskedRenderer.slice(0, 30) + '...');
                }
                
                return context;
            };

            // Override WebGL2 if available
            if (window.WebGL2RenderingContext) {
                const originalWebGL2GetParameter = window.WebGL2RenderingContext.prototype.getParameter;
                window.WebGL2RenderingContext.prototype.getParameter = function(parameter) {
                    // Apply same spoofing to WebGL2
                    try {
                        switch (parameter) {
                            case GL_CONSTANTS.UNMASKED_VENDOR_WEBGL:
                                return vendorProfile.unmaskedVendor;
                            case GL_CONSTANTS.UNMASKED_RENDERER_WEBGL:
                                return vendorProfile.unmaskedRenderer;
                            default:
                                return originalWebGL2GetParameter.call(this, parameter);
                        }
                    } catch (e) {
                        return originalWebGL2GetParameter.call(this, parameter);
                    }
                };
            }

        })();
        `;
    }

    /**
     * Get WebGL vendor profiles
     * @returns {Object} Available vendor profiles
     */
    getVendorProfiles() {
        return this.vendorProfiles;
    }

    /**
     * Generate WebGL fingerprint test data
     * @param {string} profileId - Profile identifier
     * @param {string} vendorProfile - Vendor profile key
     * @returns {Object} Test data for validation
     */
    generateTestFingerprint(profileId, vendorProfile = 'nvidia-gtx') {
        const profile = this.vendorProfiles[vendorProfile];

        return {
            profileId,
            vendorProfile,
            vendor: profile.vendor,
            renderer: profile.renderer,
            unmaskedVendor: profile.unmaskedVendor,
            unmaskedRenderer: profile.unmaskedRenderer,
            extensions: profile.extensions,
            parameters: this.parameterValues,
            timestamp: Date.now(),
            fingerprint: crypto.createHash('sha256')
                .update(profileId + profile.unmaskedRenderer)
                .digest('hex').slice(0, 16)
        };
    }

    /**
     * Generate random WebGL noise for shader compilation
     * @param {string} seed - Seed for consistent randomization
     * @returns {Function} Noise generation function
     */
    generateWebGLNoise(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
        }

        return (index) => {
            const x = Math.sin(hash + index) * 10000;
            return x - Math.floor(x);
        };
    }

    /**
     * Spoof WebGL renderer information
     */
    spoofRenderer(profileId = 'nvidia-gtx') {
        const profile = this.vendorProfiles[profileId] || this.vendorProfiles['nvidia-gtx'];

        return {
            vendor: profile.vendor,
            renderer: profile.renderer,
            unmaskedVendor: profile.unmaskedVendor,
            unmaskedRenderer: profile.unmaskedRenderer,
            extensions: profile.extensions,
            maxTextureSize: profile.maxTextureSize,
            shadingLanguageVersion: profile.shadingLanguageVersion
        };
    }
}

module.exports = WebGLSpoofing;
