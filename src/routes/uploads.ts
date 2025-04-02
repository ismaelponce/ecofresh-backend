import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { URL } from 'url';

// Extend the Express Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('Created uploads directory:', UPLOADS_DIR);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create a user-specific directory
    const userDir = path.join(UPLOADS_DIR, req.user?.uid || 'anonymous');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    const uniqueName = `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Max 5 files
  },
});

// Helper function to get base URL
const getBaseUrl = (req: express.Request) => {
  return `${req.protocol}://${req.get('host')}`;
};

// Upload route
router.post(
  '/',
  authenticateToken,
  upload.array('images', 5), // 'images' is the field name, max 5 files
  async (req, res) => {
    try {
      console.log('Upload request received with files:', req.files?.length);
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const baseUrl = getBaseUrl(req);
      const fileUrls = (req.files as Express.Multer.File[]).map(file => {
        // Get user directory path
        const userDir = req.user?.uid || 'anonymous';
        // Format URL with /api/uploads/USER_ID/FILENAME
        const fileUrl = `${baseUrl}/api/uploads/${userDir}/${file.filename}`;
        console.log(`File uploaded: ${file.originalname} -> ${fileUrl}`);
        return fileUrl;
      });

      console.log('All files uploaded successfully. Total URLs:', fileUrls.length);
      
      // Return the URLs of the uploaded files
      res.status(200).json({ 
        message: 'Files uploaded successfully',
        urls: fileUrls
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ message: 'Failed to upload files' });
    }
  }
);

// Serve uploaded files
router.get('/:userId/:filename', (req, res) => {
  const { userId, filename } = req.params;
  const filePath = path.join(UPLOADS_DIR, userId, filename);
  
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Add Cross-Origin Resource Policy headers
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'credentialless');
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

export default router; 