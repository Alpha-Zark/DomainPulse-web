const { config } = require('dotenv');
const path = require('path');

// Load environment variables based on DOTENV_CONFIG_PATH or default Next.js behavior
function loadEnvConfig() {
  const customEnvPath = process.env.DOTENV_CONFIG_PATH;
  
  if (customEnvPath && require('fs').existsSync(path.resolve(customEnvPath))) {
    // Load custom env file (e.g., .env.staging)
    config({ path: path.resolve(customEnvPath) });
    console.log(`Loaded environment variables from: ${customEnvPath}`);
  }
  
  // Always load base .env files in Next.js priority order
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFiles = [
    '.env.local',
    `.env.${nodeEnv}`,
    '.env'
  ];
  
  envFiles.forEach(file => {
    if (require('fs').existsSync(path.resolve(file))) {
      config({ path: path.resolve(file), override: false });
    }
  });
}

loadEnvConfig();