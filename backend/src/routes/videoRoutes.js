const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/videoController');
const videoController = new VideoController();
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const Video = require('../models/Video');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const videoProcessingService = require('../services/videoProcessingService');
const archiver = require('archiver');

router.post('/upload', 
  auth,
  upload.single('video'),
  (req, res) => videoController.uploadVideo(req, res)
);

router.get('/', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const query = req.user.isAdmin && !req.query.userId 
      ? {} // Admin can see all videos
      : { userId: req.query.userId || req.user._id }; // Users see only their videos

    const videos = await Video.find(query)
      .populate('userId', 'username')
      .lean()  // Convert to plain JavaScript objects
      .sort({ uploadDate: -1 });

    const formattedVideos = videos.map(video => ({
      ...video,
      username: video.userId?.username || 'Unknown User',
      userId: video.userId?._id || video.userId // Ensure userId is always available
    }));

    res.json({ success: true, videos: formattedVideos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching videos' 
    });
  }
});

router.get('/download/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', video.filename);
    if (!fsSync.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Video file not found' });
    }

    res.download(filePath, video.originalname);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Download failed' });
  }
});

// Delete video (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Delete file from uploads
    const filePath = path.join(__dirname, '../../uploads', video.filename);
    if (fsSync.existsSync(filePath)) {
      fsSync.unlinkSync(filePath);
    }

    // Delete from database
    await video.remove();

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting video'
    });
  }
});

router.post('/merge', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { videoIds } = req.body;
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No videos selected for merging'
      });
    }

    const videos = await Video.find({ _id: { $in: videoIds } });
    const videoPaths = videos.map(video => video.path);
    
    const mergedPath = await videoProcessingService.mergeVideos(videoPaths);
    
    res.download(mergedPath, `merged_videos_${Date.now()}.mp4`, (err) => {
      if (err) console.error('Download error:', err);
      // Clean up after download completes
      fs.unlink(mergedPath).catch(console.error);
    });
  } catch (error) {
    console.error('Error merging videos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error merging videos'
    });
  }
});

// Download all videos as ZIP (admin only)
router.get('/download-all', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const videos = await Video.find({});
    
    // Set response headers
    res.attachment(`all_processed_videos_${Date.now()}.zip`);
    
    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    // Pipe archive data to response
    archive.pipe(res);
    
    // Add each processed video to the archive
    for (const video of videos) {
      const filePath = path.join(__dirname, '../../uploads', video.filename); // Use processed filename
      if (fsSync.existsSync(filePath)) {
        archive.file(filePath, { name: video.filename }); // Ensure processed filename is used
      }
    }
    
    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).end();
    });
    
    // Finalize archive
    await archive.finalize();
  } catch (error) {
    console.error('Error creating zip:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating zip file'
    });
  }
});

module.exports = router; 