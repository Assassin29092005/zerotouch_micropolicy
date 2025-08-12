require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // CORS origins
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5500',
    process.env.FRONTEND_URL || 'https://your-frontend.onrender.com'
  ],
  
  // JWT options
  JWT_EXPIRES_IN: '24h',
  
  // Rate limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Email configuration (for future use)
  EMAIL: {
    HOST: process.env.EMAIL_HOST,
    PORT: process.env.EMAIL_PORT,
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS
  }
};
