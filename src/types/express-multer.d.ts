import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      files?: Express.Multer.File[];
    }
  }
}

export {}; 