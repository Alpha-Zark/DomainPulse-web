import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for static export
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Configure base path if needed
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Configure asset prefix for proper handling of static assets
  assetPrefix: process.env.ASSET_PREFIX || '',
  
  // Trailing slash for better static hosting compatibility
  trailingSlash: true,
  
  // Skip build-time generation of sitemap, robots.txt, etc. for static export
  skipTrailingSlashRedirect: true,

  // Environment configuration
  env: {
    ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  },
};

export default nextConfig;
