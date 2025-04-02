import { Multer } from 'multer';

declare global {
  namespace Express {
    export interface Multer extends Multer {}
    interface Request {
      files?: Express.Multer.File[];
    }
  }
}

export {}; 