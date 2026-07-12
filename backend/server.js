const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Fix local IPv4 resolution lags inside Windows hosts
dns.setServers(["1.1.1.1", "8.8.8.8"]); // Resolve MongoDB Atlas SRV querySrv connection issues

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Custom safe NoSQL Injection sanitizer compatible with Express 5
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};
const customMongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  next();
};

const connectDB = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// 🛡️ SECURITY MIDDLEWARE PROTOCOLS
app.use(helmet()); // Secure HTTP response headers
app.use(customMongoSanitize); // Prevent NoSQL Injection attacks

// Rate Limiting (Defend against Brute Force & DoS attacks)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many telemetry requests, please try again after 15 minutes." }
});

// Secure Policy Network Access Configuration Rules
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Establish Data Stream Handshake
connectDB();

// Bind Consolidated Route Orchestrator Network Tree
app.use('/api', apiLimiter, apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log("-----------------------------------------------------------------");
  console.log(`🚀 [SERVER RUNNING]: Advanced Modular Engine active on Port: ${PORT}`);
  console.log("-----------------------------------------------------------------");
});