const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI || "mongodb+srv://mindmasters5167_db_user:r02VzCsxlIcdrSBQ@cluster0.4vnuwks.mongodb.net/impact-lms?retryWrites=true&w=majority&appName=Cluster0";
    const conn = await mongoose.connect(dbURI);
    console.log(`📡 [DATABASE_CONNECTED]: Cloud Atlas tunnel mapped at: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ [DATABASE_OFFLINE]: Cloud handshake pipeline crashed:', err);
    process.exit(1);
  }
};

module.exports = connectDB;