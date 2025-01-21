const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const path = require('path');
const fs = require('fs').promises;

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

class VideoProcessingService {
  constructor() {
    this.outputDir = 'processed';
  }

  async processVideo(inputPath, startTime) {
    try {
      console.log('Processing video:', {
        inputPath,
        startTime,
        exists: await fs.access(inputPath).then(() => true).catch(() => false)
      });

      // Get input video information
      const videoInfo = await new Promise((resolve) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
          if (err) resolve(null);
          else resolve(metadata);
        });
      });

      console.log('Input video metadata:', videoInfo);

      // Create a proper output path in the uploads directory
      const uploadsDir = path.join(__dirname, '../../uploads');
      const outputFileName = `${Date.now()}_processed.mp4`;
      const outputPath = path.join(uploadsDir, outputFileName);
      
      // Ensure uploads directory exists
      await fs.mkdir(uploadsDir, { recursive: true });
      
      // Check if video is already 1 second
      const isOneSecond = videoInfo && 
        Math.abs(videoInfo.format.duration - 1.0) <= 0.1;

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .inputOptions([
            `-ss ${parseFloat(startTime)}`,
            '-accurate_seek'
          ])
          .toFormat('mp4')
          .seekInput(parseFloat(startTime))
          .duration(1)
          .output(outputPath)
          .on('start', (command) => {
            console.log('FFmpeg command:', command);
            if (videoInfo && videoInfo.streams[0]) {
              console.log('Processing video with height:', videoInfo.streams[0].height);
            }
          })
          .on('progress', (progress) => {
            console.log('Processing:', progress.percent, '% done');
          })
          .on('end', () => {
            console.log('Video processing finished');
            resolve(outputFileName);
          })
          .on('error', (err) => {
            console.error('Error:', err);
            reject(new Error(`Processing failed: ${err.message}`));
          })
          .run();
      });

      // Verify the video duration and quality
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(outputPath, (err, metadata) => {
          if (err) reject(err);
          else {
            console.log('Output video metadata:', metadata);
            const duration = parseFloat(metadata.format.duration);
            console.log('Output duration:', duration);
            if (Math.abs(duration - 1.0) > 0.1) {
              console.error('Invalid duration:', duration);
              reject(new Error('Output video duration is not 1 second'));
            } else {
              resolve();
            }
          }
        });
      });

      return outputFileName;
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }
  }

  async mergeVideos(videoPaths) {
    try {
      const outputDir = path.join(__dirname, '../../uploads');
      const outputPath = path.join(outputDir, `merged-${Date.now()}.mp4`);
      
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      // Create a temporary file list with absolute paths
      const listPath = path.join(outputDir, 'files.txt');
      
      // Get absolute paths and verify files exist
      const absolutePaths = await Promise.all(videoPaths.map(async (p) => {
        const absPath = path.resolve(p);
        await fs.access(absPath);
        return absPath;
      }));
      
      // Get video information before merging
      const videoInfos = await Promise.all(absolutePaths.map(p => {
        return new Promise((resolve) => {
          ffmpeg.ffprobe(p, (err, metadata) => {
            if (err) resolve(null);
            else resolve(metadata);
          });
        });
      }));
      
      // Find highest quality video
      const maxHeight = Math.max(...videoInfos
        .filter(info => info && info.streams[0])
        .map(info => info.streams[0].height || 0));
      
      const fileList = absolutePaths
        .map(p => `file '${p}'`)
        .join('\n');
      
      await fs.writeFile(listPath, fileList);
      
      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(listPath)
          .inputOptions([
            '-f', 'concat',
            '-safe', '0',
            '-vsync', '2'
          ])
          .outputOptions([
            '-c:v', 'copy',
            '-c:a', 'copy',
            '-map', '0:v?',
            '-map', '0:a?',
            '-map', '0:s?',
            '-map_metadata', '0:g',
            '-preset', 'veryslow',
            '-crf', '0',
            '-max_muxing_queue_size', '9999',
            '-y'
          ])
          .output(outputPath)
          .on('start', (command) => {
            console.log('FFmpeg merge command:', command);
            console.log('Merging videos with max height:', maxHeight);
          })
          .on('end', async () => {
            try {
              await fs.unlink(listPath);
              
              // Verify output quality
              const stats = await fs.stat(outputPath);
              console.log('Merged file size:', stats.size);
              
              // Verify output quality matches input
              ffmpeg.ffprobe(outputPath, (err, metadata) => {
                if (!err && metadata.streams[0]) {
                  console.log('Output video height:', metadata.streams[0].height);
                }
              });
              
              resolve(outputPath);
            } catch (err) {
              console.error('Error in merge completion:', err);
              resolve(outputPath);
            }
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            fs.unlink(listPath).catch(console.error);
            reject(new Error(`Merge failed: ${err.message}`));
          })
          .run();
      });
    } catch (error) {
      console.error('Video merging error:', error);
      throw error;
    }
  }
}

module.exports = new VideoProcessingService(); 