import React, { useRef, useState } from 'react';
import './CustomVideoPlayer.css';

const CustomVideoPlayer = ({ src, onEnded }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState('');

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
      if (videoRef.current.currentTime >= 1.0) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
        setIsPlaying(false);
        if (onEnded) onEnded();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;
      setQuality(`${width}x${height}`);
    }
  };

  return (
    <div className="custom-video-player">
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
      />
      <div className="video-controls">
        <button className="play-button" onClick={togglePlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>
        {quality && <div className="quality-badge">{quality}</div>}
      </div>
    </div>
  );
};

export default CustomVideoPlayer; 