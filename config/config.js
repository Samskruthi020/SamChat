require('dotenv').config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://narvasiddhartha:mwLII3LSRd6F4mHQ@chatapp.rtas1vn.mongodb.net/chatapp?retryWrites=true&w=majority&appName=chatapp',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000'
};

module.exports = config; 