// ──────────────────────────────────────────────────────────────
// config/db.js  –  MongoDB connection using Mongoose
// ──────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the MONGODB_URI environment variable.
 * Mongoose 7+ uses the new connection‐string parser and unified
 * topology by default, so no extra options are needed.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
