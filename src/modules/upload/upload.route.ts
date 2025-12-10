import express from 'express';
import { UploadController } from './upload.controller';
import { upload } from '../../utils/handle-cloudflare-r2-file';

const router = express.Router();

// Upload single file
router.post(
  '/single',
  upload.single('file'),
  UploadController.uploadSingleFile,
);

// Upload multiple files (max 10)
router.post(
  '/multiple',
  upload.array('files', 10),
  UploadController.uploadMultipleFiles,
);

// Delete single file
router.delete('/delete', UploadController.deleteFile);

// Delete multiple files
router.delete('/delete-multiple', UploadController.deleteMultipleFiles);

// Get signed URL for private file access
router.post('/signed-url', UploadController.getSignedUrl);

export const UploadRoutes = router;
