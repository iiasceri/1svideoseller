const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/)) {
      return cb(new Error('Only video files are allowed!'));
    }
    cb(null, true);
  }
});

module.exports = upload; 