const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    required: true
  },
  startTime: {
    type: Number,
    default: 0
  },
  path: String,
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing'
  }
}, {
  timestamps: true
});

// Add pre-save middleware to validate required fields
videoSchema.pre('save', function(next) {
  if (!this.filename || !this.path) {
    next(new Error('Filename and path are required'));
  }
  next();
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video; 