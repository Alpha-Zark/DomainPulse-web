export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
    endpoints: {
      // Legacy endpoints
      certificates: '/certificates',
      locations: '/locations',
      regions: '/locations',
      auth: '/auth',

      // New unified API endpoints
      certStatus: '/status/cert', // GET: 获取证书状态, ?refresh_cache=true: 刷新缓存
      whoisStatus: '/status/whois', // GET: 获取WHOIS状态, ?refresh_cache=true: 刷新缓存

      // Domain management (legacy)
      domains: '/domains',
      whois: '/whois',

      // SSL management endpoints (legacy)
      ssl: {
        status: '/ssl/status',
        check: '/ssl/check',
        recheck: '/ssl/recheck'
      },

      // Cache management
      cache: {
        status: '/cache/status',
        clear: '/cache/clear',
        refresh: '/cache/refresh'
      },

      // WHOIS domain management
      whoisDomains: '/whois-domains'
    },
  },
  environment: {
    // API timeout settings
    apiTimeout: 10000, // 10 seconds
    // Retry settings
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Certificate Status Page',
    version: '1.0.0',
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    cacheTimeout: 10 * 60 * 1000, // 10 minutes
  },
  auth: {
    sessionKey: 'cert-status-auth',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  },
  status: {
    colors: {
      normal: 'green',
      warning: 'yellow', 
      critical: 'red',
    },
    thresholds: {
      warningDays: 30, // Show warning when less than 30 days left
      criticalDays: 7,  // Show critical when less than 7 days left
    },
  },
} as const;

export type Config = typeof config;