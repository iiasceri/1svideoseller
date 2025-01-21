const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function cleanDatabase() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/video-snippets';
    console.log('Connecting to MongoDB at:', uri);
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    // Drop the entire database
    await mongoose.connection.dropDatabase();
    console.log('Database dropped successfully');

    // Delete all uploaded video files
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      fs.readdirSync(uploadsDir).forEach(file => {
        const filePath = path.join(uploadsDir, file);
        if (file !== '.gitkeep') { // Keep the .gitkeep file
          fs.unlinkSync(filePath);
        }
      });
      console.log('All uploaded videos deleted');
    }

  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanDatabase(); 