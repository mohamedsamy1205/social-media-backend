// utils/fileUpload.js
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'instagram-clone',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi'],
    resource_type: 'auto', // Automatically detect if it's image or video
    transformation: [
      {
        width: 1080,
        height: 1080,
        crop: 'limit',
        quality: 'auto'
      }
    ]
  }
});

// Multer middleware
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Direct upload function for more control
const uploadToCloudinary = async (file, folder = 'posts') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `instagram-clone/${folder}`,
      resource_type: 'auto',
      transformation: file.mimetype.startsWith('image/') ? [
        { width: 1080, height: 1080, crop: 'limit', quality: 'auto' }
      ] : [
        { width: 1080, height: 1080, crop: 'limit', quality: 'auto' },
        { flags: 'attachment' }
      ]
    });

    // For videos, also generate a thumbnail
    if (file.mimetype.startsWith('video/')) {
      const thumbnailResult = await cloudinary.uploader.upload(file.path, {
        folder: `instagram-clone/${folder}/thumbnails`,
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 300, height: 300, crop: 'fill' }
        ]
      });
      result.thumbnail_url = thumbnailResult.secure_url;
    }

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('File upload failed');
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('File deletion failed');
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  cloudinary
};
