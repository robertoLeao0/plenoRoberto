import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadsService {
  constructor() {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    if (!process.env.CLOUDINARY_URL) {
      throw new InternalServerErrorException('CLOUDINARY_URL não configurada');
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'descomplicadamente' }, (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      });
      stream.end(file.buffer);
    });
  }
}
