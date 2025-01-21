const Video = require('../models/Video');
const path = require('path');
const fs = require('fs').promises;
const videoProcessingService = require('../services/videoProcessingService');

/**
 * Controller for handling video-related operations
 */
class VideoController {
  /**
   * Upload and process a new video
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async uploadVideo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No video file uploaded'
        });
      }

      // Log full file details
      console.log('Uploaded file:', {
        size: req.file.size,
        mimetype: req.file.mimetype,
        filename: req.file.filename,
        path: req.file.path,
        destination: req.file.destination
      });

      // Process video to 1 second
      const startTime = parseFloat(req.body.startTime) || 0;
      const processedFilename = await videoProcessingService.processVideo(req.file.path, startTime);

      // Create a unique filename and move to uploads directory
      const filename = `${Date.now()}_${path.basename(req.file.originalname, path.extname(req.file.originalname))}.mp4`;
      const uploadsDir = path.join(__dirname, '../../uploads');
      const finalPath = path.join(uploadsDir, filename);
      
      console.log('File paths:', {
        processedFilename,
        finalPath,
        uploadsDir
      });

      // Ensure uploads directory exists
      await fs.mkdir(uploadsDir, { recursive: true });
      
      // Move the processed file to uploads directory
      await fs.rename(req.file.path, finalPath);

      // Verify the final file
      const finalStats = await fs.stat(finalPath);
      console.log('Final video stats:', {
        size: finalStats.size,
        path: finalPath
      });

      const video = new Video({
        filename: processedFilename,
        originalname: req.file.originalname,
        path: path.join(__dirname, '../../uploads', processedFilename),
        size: req.file.size,
        mimetype: 'video/mp4',
        status: 'ready',
        userId: req.user._id,
        duration: 1.0,
        startTime: parseFloat(startTime) || 0,
        price: parseFloat(req.body.price) || parseFloat(process.env.DEFAULT_VIDEO_PRICE) || 1.00
      });
      
      await video.save();

      res.status(200).json({ 
        success: true, 
        message: 'Video uploaded and processed successfully',
        video
      });
    } catch (error) {
      // Clean up any uploaded file if there's an error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file after error:', cleanupError);
        }
      }
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Error uploading video' 
      });
    }
  }

  /**
   * Get all videos
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllVideos(req, res) {
    try {
      const videos = await Video.find().sort({ uploadDate: -1 });
      res.json({ success: true, videos });
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Error fetching videos' 
      });
    }
  }

  /**
   * Download a video
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async downloadVideo(req, res) {
    try {
      const video = await Video.findById(req.params.id);
      if (!video) {
        return res.status(404).json({ success: false, message: 'Video not found' });
      }

      // Only allow admin to download
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Stream the video
      const stat = await fs.stat(video.path);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${video.originalname}"`,
        'Cache-Control': 'no-cache'
      });
      
      const readStream = fs.createReadStream(video.path);
      readStream.pipe(res);
      
      readStream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error streaming video' });
        }
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Error downloading video' 
      });
    }
  }
}

module.exports = VideoController; 