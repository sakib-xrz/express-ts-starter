import multer from 'multer';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request } from 'express';
import config from '../config/index';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

const spacesClient = new S3Client({
  forcePathStyle: false,
  endpoint: config.digitalOcean.spaces_endpoint,
  region: config.digitalOcean.spaces_region,
  credentials: {
    accessKeyId: config.digitalOcean.spaces_access_key!,
    secretAccessKey: config.digitalOcean.spaces_secret_key!,
  },
});

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

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 },
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
    throw new Error(`HEIC conversion failed: ${error}`);
  }
};

const uploadToSpaces = async (
  file: Express.Multer.File,
  options: { folder?: string; filename?: string } = {},
): Promise<{ url: string; key: string }> => {
  try {
    let fileBuffer = file.buffer;
    let contentType = file.mimetype;
    let fileExtension = path.extname(file.originalname);
    const isHeicFile =
      fileExtension.toLowerCase() === '.heic' ||
      fileExtension.toLowerCase() === '.heif' ||
      (file.mimetype === 'application/octet-stream' &&
        (fileExtension.toLowerCase() === '.heic' ||
          fileExtension.toLowerCase() === '.heif'));

    if (isHeicFile) {
      const converted = await convertHeicToJpeg(fileBuffer);
      fileBuffer = converted.buffer;
      contentType = converted.mimetype;
      fileExtension = '.jpg';
    }

    const fileName = options.filename || `${uuidv4()}${fileExtension}`;
    const folder = options.folder || 'uploads';
    const key = `${folder}/${fileName}`;

    const uploadParams = {
      Bucket: config.digitalOcean.spaces_bucket!,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read' as const,
    };

    const command = new PutObjectCommand(uploadParams);
    await spacesClient.send(command);

    const publicUrl = `${config.digitalOcean.spaces_endpoint}/${config.digitalOcean.spaces_bucket}/${key}`;

    return {
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    logger.error('Error uploading to DigitalOcean Spaces:', error);
    throw new Error(`DigitalOcean Spaces upload failed: ${error}`);
  }
};

const deleteFromSpaces = async (key: string): Promise<void> => {
  try {
    const deleteParams = {
      Bucket: config.digitalOcean.spaces_bucket!,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await spacesClient.send(command);
  } catch (error) {
    logger.error('Error deleting from DigitalOcean Spaces:', error);
    throw new Error(`Failed to delete from DigitalOcean Spaces: ${error}`);
  }
};

const deleteMultipleFromSpaces = async (keys: string[]): Promise<void> => {
  try {
    if (keys.length === 0) return;

    const deleteParams = {
      Bucket: config.digitalOcean.spaces_bucket!,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    };

    const command = new DeleteObjectsCommand(deleteParams);
    await spacesClient.send(command);
  } catch (error) {
    logger.error(
      'Error deleting multiple files from DigitalOcean Spaces:',
      error,
    );
    throw new Error(
      `Failed to delete multiple files from DigitalOcean Spaces: ${error}`,
    );
  }
};

const extractKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const bucketName = config.digitalOcean.spaces_bucket!;

    if (urlObj.hostname.startsWith(bucketName)) {
      return urlObj.pathname.slice(1);
    } else {
      const pathParts = urlObj.pathname.split('/');
      if (pathParts[1] === bucketName) {
        return pathParts.slice(2).join('/');
      }
    }

    return null;
  } catch (error) {
    logger.error('Error extracting key from URL:', error);
    return null;
  }
};

const generateSignedUrl = async (
  key: string,
  expiresIn: number = 3600,
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.digitalOcean.spaces_bucket!,
      Key: key,
    });

    const signedUrl = await getSignedUrl(spacesClient, command, {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    logger.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error}`);
  }
};

export {
  upload,
  uploadToSpaces,
  deleteFromSpaces,
  deleteMultipleFromSpaces,
  extractKeyFromUrl,
  generateSignedUrl,
  convertHeicToJpeg,
  spacesClient,
};
