import React, { useState, useRef, useEffect } from 'react';
import { uploadVideo } from '../../services/videoService';
import { useAuth } from '../../contexts/AuthContext';
import './VideoUploader.css';

const VideoUploader = () => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', () => {
        setDuration(videoRef.current.duration);
      });
    }
  }, [preview]);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      // Check file size (2GB limit)
      if (selectedFile.size > 2 * 1024 * 1024 * 1024) {
        setError('File size too large. Maximum size is 2GB.');
        setFile(null);
        setPreview(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      setStartTime(0);
    } else {
      setError('Please select a valid video file');
      setFile(null);
      setPreview(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !videoRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    // Ensure we have at least 1 second of video after the start time
    const maxStartTime = Math.max(0, duration - 1);
    const roundedTime = Math.round(newTime * 100) / 100; // Round to 2 decimal places
    setStartTime(Math.min(roundedTime, maxStartTime));
    videoRef.current.currentTime = newTime;
  };

  const handleTimelineDrag = (e) => {
    if (!isDragging) return;
    handleTimelineClick(e);
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      setSuccess(null);

      if (!token) {
        throw new Error('Please log in to upload videos');
      }

      const formData = new FormData();
      formData.append('video', file);
      formData.append('startTime', startTime.toFixed(2)); // Send with 2 decimal precision

      await uploadVideo(formData, token, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(progress);
      });

      setFile(null);
      setPreview(null);
      setProgress(0);
      setStartTime(0);
      setSuccess('Video uploaded successfully! View it in the gallery.');
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="video-uploader">
      <div className="upload-container">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="file-input"
        />
        
        {preview && (
          <div className="preview-container">
            <video
              ref={videoRef}
              src={preview}
              controls
              className="video-preview"
            />
            
            <div className="video-timeline-container">
              <div className="time-display">
                <span>Start: {formatTime(startTime)}</span>
                <span>End: {formatTime(startTime + 1)}</span>
              </div>
              
              <div 
                ref={timelineRef}
                className="video-timeline"
                onClick={handleTimelineClick}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleTimelineDrag}
              >
                <div 
                  className="timeline-progress" 
                  style={{ width: `${(startTime / duration) * 100}%` }}
                />
                <div 
                  className="timeline-selector"
                  style={{ left: `${(startTime / duration) * 100}%` }}
                />
                <div 
                  className="timeline-window"
                  style={{ 
                    left: `${(startTime / duration) * 100}%`,
                    width: `${(1 / duration) * 100}%`
                  }}
                />
              </div>
              
              <p className="timeline-help">
                Click and drag on the timeline to select your 1-second clip
              </p>
            </div>
          </div>
        )}
        
        {file && (
          <div className="upload-info">
            <p>Selected file: {file.name}</p>
            <p>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p>Selected segment: {formatTime(startTime)} - {formatTime(startTime + 1)}</p>
          </div>
        )}
        
        {uploading && (
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
            <span className="progress-text">{progress}%</span>
          </div>
        )}
        
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`upload-button ${uploading ? 'uploading' : ''}`}
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader; 