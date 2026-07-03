const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`📡 [DATABASE_CONNECTED]: Cloud Atlas tunnel mapped at: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ [DATABASE_OFFLINE]: Cloud handshake pipeline crashed:', err);
    process.exit(1);
  }
};

module.exports = connectDB;