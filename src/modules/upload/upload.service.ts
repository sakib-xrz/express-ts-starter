import {
  uploadToR2,
  deleteFromR2,
  deleteMultipleFromR2,
  extractKeyFromUrl,
  generateSignedUrl,
} from '../../utils/handle-cloudflare-r2-file';

const uploadSingleFile = async (
  file: Express.Multer.File,
  options: { folder?: string; filename?: string } = {},
): Promise<{ url: string; key: string }> => {
  return await uploadToR2(file, options);
};

const uploadMultipleFiles = async (
  files: Express.Multer.File[],
  options: { folder?: string } = {},
): Promise<{ url: string; key: string }[]> => {
  const uploadPromises = files.map((file) => uploadToR2(file, options));
  return await Promise.all(uploadPromises);
};

const deleteFile = async (keyOrUrl: string): Promise<void> => {
  let key = keyOrUrl;

  // If it's a URL, extract the key
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    const extractedKey = extractKeyFromUrl(keyOrUrl);
    if (!extractedKey) {
      throw new Error('Invalid file URL');
    }
    key = extractedKey;
  }

  await deleteFromR2(key);
};

const deleteMultipleFiles = async (keysOrUrls: string[]): Promise<void> => {
  const keys = keysOrUrls.map((keyOrUrl) => {
    // If it's a URL, extract the key
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      const extractedKey = extractKeyFromUrl(keyOrUrl);
      if (!extractedKey) {
        throw new Error(`Invalid file URL: ${keyOrUrl}`);
      }
      return extractedKey;
    }
    return keyOrUrl;
  });

  await deleteMultipleFromR2(keys);
};

const getSignedUrl = async (
  keyOrUrl: string,
  expiresIn: number = 3600,
): Promise<string> => {
  let key = keyOrUrl;

  // If it's a URL, extract the key
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    const extractedKey = extractKeyFromUrl(keyOrUrl);
    if (!extractedKey) {
      throw new Error('Invalid file URL');
    }
    key = extractedKey;
  }

  return await generateSignedUrl(key, expiresIn);
};

export const UploadService = {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  getSignedUrl,
};
