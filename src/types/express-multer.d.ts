import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      files?: any[];
    }
  }
}

export {}; 