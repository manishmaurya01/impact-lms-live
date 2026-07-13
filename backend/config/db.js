const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI;
    if (!dbURI) {
      console.error('❌ [DATABASE_ERROR]: MONGO_URI is not set in .env file. Cannot connect to database.');
      process.exit(1);
    }
    const conn = await mongoose.connect(dbURI);
    console.log(`📡 [DATABASE_CONNECTED]: MongoDB connected at: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ [DATABASE_ERROR]: Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;