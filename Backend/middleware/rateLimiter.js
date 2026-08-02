const rateLimit = require('express-rate-limit');

// 🚦 STRICT limit for auth routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes window
  max: 50,                     // Maximum 50 attempts per window
  message: { 
    message: "Too many attempts. Try again after 15 minutes." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🚦 General API limit (less strict)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,  // 100 requests per 15 min
});

module.exports = { authLimiter, apiLimiter };