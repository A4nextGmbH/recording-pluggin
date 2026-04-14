import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Set up Multer for local storage
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const uploadLocal = multer({ storage: localStorage });

// This function acts as a unified middleware. If we later switch to S3,
// we can conditionally export an S3 upload middleware instead.
export const uploadVideo = () => {
  const customStorageType = process.env.STORAGE_TYPE || 'local';
  
  if (customStorageType === 'local') {
    return uploadLocal.single('video');
  }
  
  // Future implementation for S3 or others can go here
  throw new Error(`Storage type ${customStorageType} is not implemented.`);
};
