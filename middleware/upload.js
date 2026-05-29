// middleware/upload.js
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary Credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME.includes('your-cloud')) {
  console.warn("⚠️ Cloudinary credentials missing or set to placeholder in environment variables!");
}

function createCloudStorage(folder) {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const isRaw = ['.pdf', '.zip', '.doc', '.docx'].includes(ext);
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e6);
      return {
        folder: `tamil-literature/${folder}`,
        resource_type: isRaw ? 'raw' : 'auto',
        public_id: isRaw ? `${uniqueName}${ext}` : uniqueName
      };
    }
  });
}

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files are allowed'), false);
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const journalFileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.zip', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) cb(null, true);
  else cb(new Error('Only PDF, DOCX, DOC, and ZIP files are allowed'), false);
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;

const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith('http')) return;
  try {
    const parts = fileUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return;
    
    // Extract public ID and extension
    const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
    const ext = path.extname(publicIdWithExt);
    const publicId = publicIdWithExt.replace(ext, '');
    
    const isRaw = ['.pdf', '.zip', '.doc', '.docx'].includes(ext.toLowerCase());
    
    await cloudinary.uploader.destroy(publicId, {
      resource_type: isRaw ? 'raw' : 'image'
    });
    console.log(`🗑️ Automatically deleted asset from Cloudinary: ${publicId}`);
  } catch (err) {
    console.error("❌ Failed to delete asset from Cloudinary:", err);
  }
};

module.exports = {
  deleteFromCloudinary,
  bookUpload: multer({
    storage: createCloudStorage('books'),
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'pdf_file') pdfFilter(req, file, cb);
      else imageFilter(req, file, cb);
    }
  }),
  journalUpload: multer({
    storage: createCloudStorage('journals'),
    limits: { fileSize: maxSize },
    fileFilter: journalFileFilter
  }),
  editorialUpload: multer({
    storage: createCloudStorage('editorial'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFilter
  }),
  submissionUpload: multer({
    storage: createCloudStorage('submissions'),
    limits: { fileSize: maxSize },
    fileFilter: pdfFilter
  })
};
