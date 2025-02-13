const mongoose = require('mongoose');

const dbName = 'agent';
const uri = process.env.MONGO_URL;

async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    throw err;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

module.exports = { connectDB, disconnectDB };
