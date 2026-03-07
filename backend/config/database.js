const mongoose = require('mongoose');

// MongoDB Connection Function
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MONGODB_URI is not defined in .env file');
      console.log('Please add MONGODB_URI=your_connection_string to your .env file');
      return;
    }

    await mongoose.connect(mongoURI);

    console.log(' MongoDB Connected Successfully');
    console.log(` Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    console.log(' Make sure your MongoDB connection string is correct');
    // Don't exit process, let the app run without MongoDB
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Error:', err);
});

module.exports = connectDB;
