/* eslint-disable no-undef */
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import config from '../config/index';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

// Cloudinary configuration
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// Allowed file types
const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif|pdf|doc|docx/;

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const extname = allowedTypes.test(fileExtension);

  const heicMimeTypes = [
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
  ];
  const isHeicFile = heicMimeTypes.includes(file.mimetype.toLowerCase());

  const isHeicExtensionWithGenericMime =
    (fileExtension === '.heic' || fileExtension === '.heif') &&
    file.mimetype === 'application/octet-stream';

  const mimetype =
    allowedTypes.test(file.mimetype) ||
    isHeicFile ||
    isHeicExtensionWithGenericMime;

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only images (jpeg, jpg, png, gif, webp, heic, heif), PDFs, and DOC/DOCX files are allowed',
      ),
    );
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB limit
});

const convertHeicToJpeg = async (
  buffer: Buffer,
): Promise<{ buffer: Buffer; mimetype: string }> => {
  try {
    const convert = await import('heic-convert');

    const convertedBuffer = await convert.default({
      buffer: buffer,
      format: 'JPEG',
      quality: 1,
    });

    const finalBuffer = Buffer.isBuffer(convertedBuffer)
      ? convertedBuffer
      : Buffer.from(convertedBuffer);

    return {
      buffer: finalBuffer,
      mimetype: 'image/jpeg',
    };
  } catch (error) {
    logger.error('Error converting HEIC to JPEG:', error);
    throw new Error(`HEIC conversion failed: ${error}`);
  }
};

const uploadToCloudinary = async (
  file: Express.Multer.File,
  options: { folder?: string; filename?: string } = {},
): Promise<{ url: string; publicId: string; secureUrl: string }> => {
  return new Promise(async (resolve, reject) => {
    try {
      let fileBuffer = file.buffer;
      let fileExtension = path.extname(file.originalname);

      // Check if file is HEIC and convert to JPEG
      const isHeicFile =
        fileExtension.toLowerCase() === '.heic' ||
        fileExtension.toLowerCase() === '.heif' ||
        (file.mimetype === 'application/octet-stream' &&
          (fileExtension.toLowerCase() === '.heic' ||
            fileExtension.toLowerCase() === '.heif'));

      if (isHeicFile) {
        logger.info('Converting HEIC file to JPEG...');
        const converted = await convertHeicToJpeg(fileBuffer);
        fileBuffer = converted.buffer;
        fileExtension = '.jpg'; // Change extension to jpg
      }

      const fileName = options.filename || uuidv4();
      const folder = options.folder || 'uploads';

      // Upload to Cloudinary using upload_stream
      cloudinary.uploader
        .upload_stream(
          {
            folder: folder,
            public_id: fileName,
            use_filename: true,
            overwrite: true,
            invalidate: true,
          },
          (error, result) => {
            if (error) {
              logger.error('Error uploading to Cloudinary:', error);
              return reject(
                new Error(`Cloudinary upload failed: ${error.message}`),
              );
            }
            resolve({
              url: result!.url,
              secureUrl: result!.secure_url,
              publicId: result!.public_id,
            });
          },
        )
        .end(fileBuffer); // Send file buffer directly
    } catch (error) {
      logger.error('Error in uploadToCloudinary:', error);
      reject(new Error(`Cloudinary upload failed: ${error}`));
    }
  });
};

// Delete single file from Cloudinary
const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Error deleting from Cloudinary:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error}`);
  }
};

// Delete multiple files from Cloudinary
const deleteMultipleFromCloudinary = async (
  publicIds: string[],
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (publicIds.length === 0) {
      return resolve();
    }

    cloudinary.api.delete_resources(publicIds, (error, result) => {
      if (error) {
        logger.error('Error deleting multiple files from Cloudinary:', error);
        return reject(
          new Error(`Failed to delete from Cloudinary: ${error.message}`),
        );
      }
      resolve(result);
    });
  });
};

const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Find the 'upload' segment
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Get everything after 'upload' (skip version if present)
    let publicIdParts = pathParts.slice(uploadIndex + 1);

    // Remove version if present (starts with 'v' followed by numbers)
    if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }

    // Join and remove file extension
    const fullPath = publicIdParts.join('/');
    const publicId = fullPath.replace(/\.[^/.]+$/, '');

    return publicId || null;
  } catch (error) {
    logger.error('Error extracting public ID from URL:', error);
    return null;
  }
};

const generateSignedUrl = async (
  publicId: string,
  expiresIn: number = 3600,
): Promise<string> => {
  try {
    const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

    const signedUrl = cloudinary.url(publicId, {
      sign_url: true,
      secure: true,
      type: 'authenticated',
      expires_at: timestamp,
    });

    return signedUrl;
  } catch (error) {
    logger.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error}`);
  }
};

// Export functions
export {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  extractPublicIdFromUrl,
  generateSignedUrl,
  convertHeicToJpeg,
  cloudinary,
};
