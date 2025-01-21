import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Add request interceptor to add token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('Sending request with token:', token ? 'yes' : 'no');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadVideo = async (formData, token, onProgress) => {
  try {
    const response = await api.post('/api/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error uploading video');
  }
};

export const getUploads = async (token, userId = null) => {
  try {
    const url = userId 
      ? `${API_URL}/api/videos?userId=${userId}`
      : `${API_URL}/api/videos`;
    
    const response = await axios.get(url, {
      withCredentials: true,
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    console.log('Response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error in getUploads:', error); // Debug log
    throw new Error(error.response?.data?.message || 'Error fetching uploads');
  }
};

export const downloadVideo = async (videoId, filename, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/videos/download/${videoId}`, {
      responseType: 'blob',
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    
    // Append to html link element page
    document.body.appendChild(link);
    
    // Start download
    link.click();
    
    // Clean up and remove the link
    link.parentNode.removeChild(link);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(error.response?.data?.message || 'Error downloading video');
  }
};

export const deleteVideo = async (videoId, token) => {
  try {
    await api.delete(`/api/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error deleting video');
  }
}; 