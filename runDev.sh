#!/bin/bash

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to setup project directories
setup_project_structure() {
  echo -e "${YELLOW}Setting up project directories...${NC}"
  mkdir -p backend/temp
  mkdir -p backend/src/{controllers,services,models,interfaces,middleware,utils}
  mkdir -p frontend/src/{components,services,pages,utils}
  
  # Create .env file if it doesn't exist
  if [ ! -f "backend/.env" ]; then
    echo "MONGODB_URI=mongodb://localhost:27017/videoseller
JWT_SECRET=your-secret-key
PORT=3001
DEFAULT_VIDEO_PRICE=1.00" > backend/.env
  fi
  
  if [ ! -f ".gitignore" ]; then
    echo "node_modules/
.env
.DS_Store
backend/temp/
*.log" > .gitignore
  fi
}

# Function to setup dependencies
setup_dependencies() {
  echo -e "${YELLOW}Setting up dependencies...${NC}"
  
  # Only install if node_modules doesn't exist or --force flag is used
  if [ ! -d "backend/node_modules" ] || [ "$1" = "--force" ]; then
    # Clean install
    rm -rf node_modules frontend/node_modules backend/node_modules
    rm -f package-lock.json frontend/package-lock.json backend/package-lock.json
    
    # Install backend dependencies
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    rm -rf node_modules
    rm -f package-lock.json
    # Remove content filtering files
    rm -f src/services/contentFilteringService.js
    rm -f src/middleware/contentFilter.js
    
    npm install --no-audit --no-fund
    # Install ffmpeg-static with proper binaries
    npm install ffmpeg-static@4.4.0 --no-audit --no-fund --unsafe-perm
    cd ..
    
    # Install frontend dependencies
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install --no-audit --no-fund
    cd ..
  else
    echo -e "${GREEN}Dependencies already installed. Use --force to reinstall${NC}"
  fi
}

# Function to check MongoDB connection
check_mongodb() {
  echo -e "${YELLOW}Checking MongoDB connection...${NC}"
  
  # Wait for MongoDB to be ready
  for i in {1..5}; do
    if mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
      echo -e "${GREEN}MongoDB is running properly${NC}"
      return 0
    else
      echo -e "${YELLOW}Starting MongoDB...${NC}"
      if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start mongodb-community
      elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start mongod
      fi
      sleep 1
    fi
  done
  echo -e "${RED}MongoDB failed to start${NC}"
  return 1
}

# Function to clean database and files
clean_everything() {
  echo -e "${YELLOW}Cleaning database and files...${NC}"
  cd backend
  echo -e "${YELLOW}Installing required dependencies...${NC}"
  # Only install required dependencies for cleanup
  npm install mongoose bcryptjs dotenv --no-audit --no-fund
  
  echo -e "${YELLOW}Starting cleanup process...${NC}"
  node << EOF
  require('dotenv').config();
  const mongoose = require('mongoose');
  const User = require('./src/models/User');
  const Video = require('./src/models/Video');
  const fs = require('fs').promises;
  const path = require('path');

  async function cleanup() {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/videoseller');
      
      console.log('Finding protected users...');
      // Find admin and test users
      const protectedUsers = await User.find({ username: { $in: ['admin', 'test'] } });
      console.log('Found protected users:', protectedUsers.map(u => u.username));
      const protectedUserIds = protectedUsers.map(user => user._id);
      
      console.log('Deleting videos...');
      // Get all videos to delete
      const videosToDelete = await Video.find({ userId: { $nin: protectedUserIds } });
      console.log('Found videos to delete:', videosToDelete.length);
      
      // Delete video files
      for (const video of videosToDelete) {
        const filePath = path.join(__dirname, 'uploads', video.filename);
        try {
          await fs.unlink(filePath);
          console.log('Deleted video file:', video.filename);
        } catch (err) {
          console.error('Failed to delete video file:', video.filename, err.message);
        }
      }
      
      console.log('Cleaning database...');
      // Delete video records from database
      const deletedVideos = await Video.deleteMany({ userId: { $nin: protectedUserIds } });
      console.log('Deleted video records:', deletedVideos.deletedCount);
      
      // Delete all users except admin and test
      const deletedUsers = await User.deleteMany({ username: { $nin: ['admin', 'test'] } });
      console.log('Deleted users:', deletedUsers.deletedCount);
      
      console.log('Ensuring admin and test users exist...');
      // Ensure admin and test users exist
      const adminExists = await User.findOne({ username: 'admin' });
      if (!adminExists) {
        await User.create({
          username: 'admin',
          password: await require('bcryptjs').hash('admin123', 10),
          isAdmin: true
        });
        console.log('Admin user created');
      }
      
      const testExists = await User.findOne({ username: 'test' });
      if (!testExists) {
        await User.create({
          username: 'test',
          password: await require('bcryptjs').hash('test123', 10),
          isAdmin: false
        });
        console.log('Test user created');
      }
      
      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Cleanup failed:', error);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  cleanup();
EOF
  cd ..
  echo -e "${GREEN}Cleanup completed!${NC}"
}

# Function to ensure users exist
ensure_users() {
  echo -e "${YELLOW}Ensuring admin and test users exist...${NC}"
  cd backend
  # Install required dependencies first
  npm install mongoose bcryptjs dotenv --no-audit --no-fund
  
  node << EOF
  require('dotenv').config();
  const mongoose = require('mongoose');
  const User = require('./src/models/User');
  const bcrypt = require('bcryptjs');

  async function setupUsers() {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/videoseller');
      
      console.log('Checking for admin user...');
      // Create admin user if doesn't exist
      const adminExists = await User.findOne({ username: 'admin' });
      if (!adminExists) {
        await User.create({
          username: 'admin',
          password: await bcrypt.hash('admin123', 10),
          isAdmin: true
        });
        console.log('Admin user created');
      } else {
        console.log('Admin user already exists');
      }
      
      console.log('Checking for test user...');
      // Create test user if doesn't exist
      const testExists = await User.findOne({ username: 'test' });
      if (!testExists) {
        await User.create({
          username: 'test',
          password: await bcrypt.hash('test123', 10),
          isAdmin: false
        });
        console.log('Test user created');
      } else {
        console.log('Test user already exists');
      }
      
      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Failed to create users:', error);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  setupUsers();
EOF
  cd ..
}

# Function to check if Node.js is installed and install if needed
setup_nodejs() {
  echo -e "${YELLOW}Checking Node.js installation...${NC}"
  if ! command_exists node; then
    echo -e "${RED}Node.js not found. Installing...${NC}"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
      curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
      sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
      brew install node@18
    fi
  fi
  echo -e "${GREEN}Node.js is installed${NC}"
}

# Function to install MongoDB if needed
install_mongodb() {
  echo -e "${YELLOW}Installing MongoDB...${NC}"
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew tap mongodb/brew
    brew install mongodb-community
  fi
}

# Function to setup FFmpeg
setup_ffmpeg() {
  echo -e "${YELLOW}Setting up FFmpeg...${NC}"
  if ! command_exists ffmpeg; then
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
      sudo apt-get update
      sudo apt-get install -y ffmpeg x264 x265 libvpx-dev libmp3lame-dev libfdk-aac-dev
    elif [[ "$OSTYPE" == "darwin"* ]]; then
      brew install ffmpeg --with-fdk-aac --with-x264 --with-x265
    fi
  fi
  # Verify FFmpeg installation
  ffmpeg -codecs | grep -E "libx264|aac" || {
    echo -e "${RED}FFmpeg codecs not properly installed${NC}"
    exit 1
  }
  echo -e "${GREEN}FFmpeg is installed${NC}"
}

# Main function
main() {
  # Parse arguments
  FORCE_INSTALL=false
  for arg in "$@"; do
    case $arg in
      --force)
        FORCE_INSTALL=true
        shift
        ;;
      clean)
        clean_everything
        exit 0
        ;;
    esac
  done

  # Create uploads directory if it doesn't exist
  mkdir -p backend/uploads

  # Only run setup if needed
  if [ ! -f "backend/.env" ] || [ "$FORCE_INSTALL" = true ]; then
    # Check and install required software
    setup_nodejs
    if ! command_exists mongosh; then
      install_mongodb
    fi
    setup_ffmpeg

    # Setup project structure
    setup_project_structure
    
    # Setup dependencies
    setup_dependencies --force
  fi
  
  # Check MongoDB
  if ! check_mongodb; then
    echo -e "${RED}Failed to start MongoDB. Exiting...${NC}"
    exit 1
  fi
  
  # Ensure users exist
  ensure_users
  
  # Start backend
  echo -e "${YELLOW}Starting backend server...${NC}"
  cd backend
  NODE_ENV=development ./node_modules/.bin/nodemon src/index.js &
  BACKEND_PID=$!
  cd ..

  # Start frontend
  echo -e "${YELLOW}Starting frontend server...${NC}"
  cd frontend
  npm start &
  FRONTEND_PID=$!
  cd ..

  # Wait for processes
  wait $BACKEND_PID $FRONTEND_PID

  # Kill the other process
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null

  echo -e "${RED}Development servers stopped${NC}"
}

# Run main function
main "$@" 