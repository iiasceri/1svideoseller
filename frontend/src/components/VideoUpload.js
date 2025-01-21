import React, { useState } from 'react';
import { uploadVideo } from '../services/videoService';

const VideoUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && !selectedFile.type.startsWith('video/')) {
      setError('Please select a video file');
      setFile(null);
    } else {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      if (!file) {
        throw new Error('Please select a video file');
      }

      const formData = new FormData();
      formData.append('video', file);

      const response = await uploadVideo(formData);
      
      if (response.success) {
        setSuccess(true);
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Error uploading video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="video-upload">
      <input 
        type="file" 
        accept="video/*" 
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Video'}
      </button>

      {error && (
        <div className="error" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="success" style={{ color: 'green', marginTop: '10px' }}>
          Video uploaded successfully!
        </div>
      )}
    </div>
  );
};

export default VideoUpload; 