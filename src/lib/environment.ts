// Simplified environment configuration for API-only setup

/**
 * Get environment-specific configuration
 * Since we only use API data now, this is greatly simplified
 */
export function getEnvironmentConfig() {
  return {
    // API configuration from environment variables
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Certificate Status Page',
    // Always use API data - no more mock data
    useBackendAPI: true,
    useMockData: false
  } as const;
}

/**
 * Log environment information for debugging
 */
export function logEnvironmentInfo() {
  const config = getEnvironmentConfig();
  console.log('🔧 Environment Configuration:', {
    apiBaseUrl: config.apiBaseUrl,
    appName: config.appName,
    useBackendAPI: config.useBackendAPI,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
  });
}