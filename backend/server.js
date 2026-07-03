const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Fix local IPv4 resolution lags inside Windows hosts

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

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
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log("-----------------------------------------------------------------");
  console.log(`🚀 [SERVER RUNNING]: Advanced Modular Engine active on Port: ${PORT}`);
  console.log("-----------------------------------------------------------------");
});