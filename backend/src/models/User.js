const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  purchasedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  console.log('Saving user, password modified:', this.isModified('password'));
  if (this.isModified('password')) {
    console.log('Hashing password...');
    this.password = await bcrypt.hash(this.password, 8);
    console.log('Password hashed');
  }
  next();
});

// Check if user has purchased a video
userSchema.methods.hasPurchased = function(videoId) {
  return this.purchasedVideos.includes(videoId);
};

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  console.log('Comparing passwords...');
  const isMatch = await bcrypt.compare(password, this.password);
  console.log('Password match result:', isMatch);
  return isMatch;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 