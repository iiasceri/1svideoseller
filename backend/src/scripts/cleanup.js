const mongoose = require('mongoose');
const User = require('../models/User');
const Video = require('../models/Video');
const fs = require('fs').promises;
const path = require('path');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/videoseller');
    
    // Delete all videos except those belonging to admin and test users
    const protectedUsers = await User.find({ username: { $in: ['admin', 'test'] } });
    const protectedUserIds = protectedUsers.map(user => user._id);
    
    // Get all videos to delete
    const videosToDelete = await Video.find({ userId: { $nin: protectedUserIds } });
    
    // Delete video files
    for (const video of videosToDelete) {
      const filePath = path.join(__dirname, '../../../uploads', video.filename);
      try {
        await fs.unlink(filePath);
        console.log(`Deleted video file: ${video.filename}`);
      } catch (err) {
        console.error(`Failed to delete video file: ${video.filename}`, err);
      }
    }
    
    // Delete video records from database
    await Video.deleteMany({ userId: { $nin: protectedUserIds } });
    console.log('Deleted video records from database');
    
    // Delete all users except admin and test
    await User.deleteMany({ username: { $nin: ['admin', 'test'] } });
    console.log('Deleted users except admin and test');
    
    // Create test user if it doesn't exist
    const testUser = await User.findOne({ username: 'test' });
    if (!testUser) {
      await User.create({
        username: 'test',
        password: 'test123',
        isAdmin: false
      });
      console.log('Created test user');
    }
    
    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup(); 