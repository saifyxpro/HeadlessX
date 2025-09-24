/**
 * Timezone Manager v1.3.0
 * Manages timezone consistency based on IP geolocation
 */

class TimezoneManager {
    /**
     * Timezone database with IP region mapping
     */
    static getTimezoneDatabase() {
        return {
            // North America
            'us-east': {
                timezone: 'America/New_York',
                offset: -300, // EST offset in minutes
                dst: true,
                languages: ['en-US', 'en'],
                locale: 'en-US',
                currency: 'USD',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h'
            },
            'us-west': {
                timezone: 'America/Los_Angeles',
                offset: -480, // PST offset in minutes
                dst: true,
                languages: ['en-US', 'en'],
                locale: 'en-US',
                currency: 'USD',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h'
            },
            'us-central': {
                timezone: 'America/Chicago',
                offset: -360, // CST offset in minutes
                dst: true,
                languages: ['en-US', 'en'],
                locale: 'en-US',
                currency: 'USD',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h'
            },
            canada: {
                timezone: 'America/Toronto',
                offset: -300, // EST offset in minutes
                dst: true,
                languages: ['en-CA', 'fr-CA', 'en'],
                locale: 'en-CA',
                currency: 'CAD',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h'
            },

            // Europe
            uk: {
                timezone: 'Europe/London',
                offset: 0, // GMT offset in minutes
                dst: true,
                languages: ['en-GB', 'en'],
                locale: 'en-GB',
                currency: 'GBP',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h'
            },
            germany: {
                timezone: 'Europe/Berlin',
                offset: 60, // CET offset in minutes
                dst: true,
                languages: ['de-DE', 'de', 'en'],
                locale: 'de-DE',
                currency: 'EUR',
                dateFormat: 'DD.MM.YYYY',
                timeFormat: '24h'
            },
            france: {
                timezone: 'Europe/Paris',
                offset: 60, // CET offset in minutes
                dst: true,
                languages: ['fr-FR', 'fr', 'en'],
                locale: 'fr-FR',
                currency: 'EUR',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h'
            },
            netherlands: {
                timezone: 'Europe/Amsterdam',
                offset: 60, // CET offset in minutes
                dst: true,
                languages: ['nl-NL', 'nl', 'en'],
                locale: 'nl-NL',
                currency: 'EUR',
                dateFormat: 'DD-MM-YYYY',
                timeFormat: '24h'
            },

            // Asia Pacific
            australia: {
                timezone: 'Australia/Sydney',
                offset: 600, // AEST offset in minutes
                dst: true,
                languages: ['en-AU', 'en'],
                locale: 'en-AU',
                currency: 'AUD',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '12h'
            },
            japan: {
                timezone: 'Asia/Tokyo',
                offset: 540, // JST offset in minutes
                dst: false,
                languages: ['ja-JP', 'ja'],
                locale: 'ja-JP',
                currency: 'JPY',
                dateFormat: 'YYYY/MM/DD',
                timeFormat: '24h'
            },
            singapore: {
                timezone: 'Asia/Singapore',
                offset: 480, // SGT offset in minutes
                dst: false,
                languages: ['en-SG', 'zh-SG', 'ms-SG', 'ta-SG'],
                locale: 'en-SG',
                currency: 'SGD',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '12h'
            }
        };
    }

    /**
     * Get timezone configuration for a specific region
     */
    static getTimezoneConfig(region = 'us-east') {
        const database = this.getTimezoneDatabase();
        return database[region] || database['us-east'];
    }

    /**
     * Generate timezone-consistent Date configuration
     */
    static generateDateConfig(region) {
        const config = this.getTimezoneConfig(region);
        const now = new Date();

        // Calculate current offset considering DST
        let currentOffset = config.offset;
        if (config.dst && this.isDSTActive(region, now)) {
            currentOffset += 60; // Add 1 hour for DST
        }

        return {
            timezone: config.timezone,
            timezoneOffset: -currentOffset, // JavaScript uses negative values
            locale: config.locale,
            languages: config.languages,
            dateFormat: config.dateFormat,
            timeFormat: config.timeFormat,
            currency: config.currency,
            isDST: config.dst && this.isDSTActive(region, now)
        };
    }

    /**
     * Check if Daylight Saving Time is currently active
     */
    static isDSTActive(region, date = new Date()) {
        const config = this.getTimezoneConfig(region);
        if (!config.dst) return false;

        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        // Simplified DST calculation for major regions
        if (region.startsWith('us') || region === 'canada') {
            // US/Canada DST: Second Sunday in March to first Sunday in November
            const marchSecondSunday = this.getNthWeekday(year, 2, 1, 0); // Second Sunday in March
            const novemberFirstSunday = this.getNthWeekday(year, 10, 1, 0); // First Sunday in November

            const currentDate = month * 100 + day;
            return currentDate >= marchSecondSunday && currentDate < novemberFirstSunday;
        }

        if (region === 'uk' || region === 'germany' || region === 'france' || region === 'netherlands') {
            // EU DST: Last Sunday in March to last Sunday in October
            const marchLastSunday = this.getLastWeekday(year, 2, 0); // Last Sunday in March
            const octoberLastSunday = this.getLastWeekday(year, 9, 0); // Last Sunday in October

            const currentDate = month * 100 + day;
            return currentDate >= marchLastSunday && currentDate < octoberLastSunday;
        }

        if (region === 'australia') {
            // Australia DST: First Sunday in October to first Sunday in April (reversed seasons)
            const octoberFirstSunday = this.getNthWeekday(year, 9, 1, 0);
            const aprilFirstSunday = this.getNthWeekday(year, 3, 1, 0);

            const currentDate = month * 100 + day;
            return currentDate >= octoberFirstSunday || currentDate < aprilFirstSunday;
        }

        return false;
    }

    /**
     * Get the nth occurrence of a weekday in a month
     */
    static getNthWeekday(year, month, nth, weekday) {
        const firstDay = new Date(year, month, 1);
        const firstWeekday = firstDay.getDay();
        const offset = (weekday - firstWeekday + 7) % 7;
        const day = 1 + offset + (nth - 1) * 7;
        return month * 100 + day;
    }

    /**
     * Get the last occurrence of a weekday in a month
     */
    static getLastWeekday(year, month, weekday) {
        const lastDay = new Date(year, month + 1, 0).getDate();
        const lastWeekday = new Date(year, month, lastDay).getDay();
        const offset = (lastWeekday - weekday + 7) % 7;
        const day = lastDay - offset;
        return month * 100 + day;
    }

    /**
     * Generate browser headers consistent with timezone
     */
    static generateConsistentHeaders(region) {
        const config = this.getTimezoneConfig(region);

        return {
            'Accept-Language': config.languages.join(','),
            'Accept-Encoding': 'gzip, deflate, br',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Cache-Control': 'max-age=0',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document'
        };
    }

    /**
     * Inject timezone configuration into page
     */
    static getTimezoneInjectionScript(region) {
        const dateConfig = this.generateDateConfig(region);

        return `
        // Override Date object for timezone consistency
        (() => {
            const originalDate = Date;
            const timezoneOffset = ${dateConfig.timezoneOffset};
            const locale = '${dateConfig.locale}';
            const timezone = '${dateConfig.timezone}';
            
            window.Date = class extends originalDate {
                constructor(...args) {
                    super(...args);
                }
                
                getTimezoneOffset() {
                    return timezoneOffset;
                }
                
                toString() {
                    return super.toString().replace(/GMT[+-]\\d{4} \\(.+\\)/, 
                        'GMT${dateConfig.timezoneOffset >= 0 ? '+' : ''}${Math.floor(Math.abs(dateConfig.timezoneOffset) / 60).toString().padStart(2, '0')}${(Math.abs(dateConfig.timezoneOffset) % 60).toString().padStart(2, '0')} (${dateConfig.timezone.split('/').pop().replace(/_/g, ' ')})'
                    );
                }
                
                toLocaleString(locales, options) {
                    return super.toLocaleString(locale, options);
                }
            };
            
            // Copy all static methods and properties
            Object.getOwnPropertyNames(originalDate).forEach(prop => {
                if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
                    window.Date[prop] = originalDate[prop];
                }
            });
            
            // Override Intl.DateTimeFormat for consistency
            if (window.Intl && window.Intl.DateTimeFormat) {
                const originalDateTimeFormat = window.Intl.DateTimeFormat;
                window.Intl.DateTimeFormat = function(locales = locale, options = {}) {
                    options.timeZone = options.timeZone || timezone;
                    return new originalDateTimeFormat(locale, options);
                };
            }
            
            console.log('🕐 Timezone injected:', {
                timezone: timezone,
                offset: timezoneOffset,
                locale: locale,
                dst: ${dateConfig.isDST}
            });
        })();
        `;
    }
}

module.exports = TimezoneManager;
