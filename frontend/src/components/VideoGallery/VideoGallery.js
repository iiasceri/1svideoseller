import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUploads } from '../../services/videoService';
import './VideoGallery.css';
import CustomVideoPlayer from '../CustomVideoPlayer/CustomVideoPlayer';

const VideoGallery = ({ userOnly = true }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, user } = useAuth();
  const [viewMode, setViewMode] = useState(userOnly ? 'user' : 'all');
  const [selectedVideos, setSelectedVideos] = useState(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await getUploads(token, viewMode === 'user' ? user._id : null);
        if (!response.success) {
          throw new Error(response.message || 'Failed to load videos');
        }
        setVideos(response.videos);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError(err.message || 'Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [token, user, viewMode]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      const data = await response.json();
      if (data.success) {
        setVideos(videos.filter(video => video._id !== videoId));
      } else {
        setError(data.message || 'Failed to delete video');
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      setError(err.message || 'Failed to delete video');
    }
  };

  const handleDownloadMerged = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/videos/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoIds: Array.from(selectedVideos)
        })
      });

      if (!response.ok) throw new Error('Failed to merge videos');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_videos_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error merging videos:', err);
      setError(err.message || 'Failed to merge videos');
    }
  };

  const handleSingleDownload = async (videoId, originalName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/videos/download/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to download video');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading video:', err);
      setError(err.message || 'Failed to download video');
    }
  };

  const handleDownloadAllMerged = async () => {
    try {
      setIsMerging(true);
      const allVideoIds = videos.map(video => video._id);
      
      const response = await fetch('http://localhost:3001/api/videos/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoIds: allVideoIds
        })
      });

      if (!response.ok) throw new Error('Failed to merge videos');

      const blob = await response.blob();
      const videoBlob = new Blob([blob], { type: 'video/mp4' });
      const url = window.URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_videos_merged_${Date.now()}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error('Error merging all videos:', err);
      setError(err.message || 'Failed to merge all videos');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownloadAllZip = async () => {
    try {
      setIsDownloadingZip(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/videos/download-all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to download videos');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_videos_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading all videos:', err);
      setError(err.message || 'Failed to download all videos');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  if (loading) return <div className="loading">Loading videos...</div>;
  if (error) return <div className="gallery-error">{error}</div>;

  return (
    <div className="video-gallery">
      <div className="gallery-header">
        <div className="header-left">
          <h2>{viewMode === 'user' ? 'Your Videos' : 'All User Videos'}</h2>
          {user?.isAdmin && (
            <div className="view-controls">
              <button 
                className={`view-button ${viewMode === 'user' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('user')}
              >
                My Videos
              </button>
              <button 
                className={`view-button ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('all')}
              >
                All Videos
              </button>
            </div>
          )}
        </div>
        {user?.isAdmin && (
          <div className="header-right">
            <button 
              className={`download-all-button ${isDownloadingZip ? 'downloading' : ''}`}
              onClick={handleDownloadAllZip}
              disabled={isDownloadingZip}
            >
              {isDownloadingZip ? 'Preparing ZIP...' : 'Download All (ZIP)'}
            </button>
            {videos.length > 1 && (
              <button 
                className={`merge-all-button ${isMerging ? 'merging' : ''}`}
                onClick={handleDownloadAllMerged}
                disabled={isMerging}
              >
                {isMerging ? 'Merging...' : 'Merge All Videos'}
              </button>
            )}
            {selectedVideos.size > 0 && (
              <button 
                className="merge-button"
                onClick={handleDownloadMerged}
              >
                Merge Selected ({selectedVideos.size})
              </button>
            )}
          </div>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="no-videos">No videos found</div>
      ) : (
        <div className="video-grid">
          {videos.map(video => (
            <div key={video._id} className="video-card">
              {user?.isAdmin && viewMode === 'all' && (
                <div className="video-owner">
                  Uploaded by: {video.userId?.username || 'Unknown User'}
                </div>
              )}
              <CustomVideoPlayer
                src={`http://localhost:3001/uploads/${video.filename}?t=${Date.now()}`}
                onEnded={() => console.log('Video ended')}
              />
              <div className="video-info">
                <p className="video-title">{video.originalname}</p>
                <p className="upload-date">
                  Uploaded: {new Date(video.uploadDate).toLocaleDateString()}
                </p>
                {user?.isAdmin && (
                  <div className="admin-controls">
                    <div className="admin-actions">
                      <input
                        type="checkbox"
                        checked={selectedVideos.has(video._id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedVideos);
                          if (e.target.checked) {
                            newSelected.add(video._id);
                          } else {
                            newSelected.delete(video._id);
                          }
                          setSelectedVideos(newSelected);
                        }}
                      />
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteVideo(video._id)}
                      >
                        Delete Video
                      </button>
                      <button
                        className="download-btn"
                        onClick={() => handleSingleDownload(video._id, video.originalname)}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoGallery; 