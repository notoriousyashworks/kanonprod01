require('dotenv').config();

const env = process.env.KICKSAURA_ENV || 'local';

const configs = {
  local: {
    apiUrl: 'http://localhost:8080',
    adminToken: process.env.KICKSAURA_ADMIN_TOKEN || '',
  },
  production: {
    apiUrl: process.env.KICKSAURA_API_URL || 'https://pure-grace-production-6c99.up.railway.app', 
    adminToken: process.env.KICKSAURA_ADMIN_TOKEN || '',
  }
};

const activeConfig = configs[env];

module.exports = {
  env,
  apiUrl: activeConfig.apiUrl,
  adminToken: activeConfig.adminToken
};
