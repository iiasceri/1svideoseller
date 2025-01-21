const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

async function setupAdmin() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/video-snippets';
    console.log('Connecting to MongoDB at:', uri);
    
    // Wait for MongoDB to be ready
    let retries = 5;
    while (retries > 0) {
      try {
        await mongoose.connect(uri);
        break;
      } catch (err) {
        console.log(`Failed to connect, retrying... (${retries} attempts left)`);
        retries--;
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('Connected to MongoDB');
    
    // Delete existing admin if exists
    await User.deleteOne({ username: 'admin' });
    console.log('Cleaned up any existing admin user');
    
    // Create new admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      isAdmin: true
    });

    // Save and wait for completion
    const savedUser = await adminUser.save();
    console.log('Admin user created:', {
      id: savedUser._id,
      username: savedUser.username,
      isAdmin: savedUser.isAdmin,
      passwordLength: savedUser.password?.length || 0
    });

    // Verify the user was created
    const verifyUser = await User.findOne({ username: 'admin' });
    if (verifyUser) {
      console.log('Verified admin user exists in database');
      // Test password match
      const testMatch = await verifyUser.comparePassword('admin123');
      console.log('Password verification test:', testMatch ? 'passed' : 'failed');
    } else {
      throw new Error('Failed to verify admin user creation');
    }

  } catch (error) {
    console.error('Error setting up admin:', error);
    console.error('Full error stack:', error.stack);
    throw error; // Let the calling script handle the error
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup and handle errors
setupAdmin().catch(error => {
  console.error('Failed to set up admin user:', error);
  process.exit(1);
}); 