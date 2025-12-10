import { Request, Response } from 'express';
import catchAsync from '@/utils/catch-async';
import sendResponse from '@/utils/send-response';
import httpStatus from 'http-status';
import { UploadService } from './upload.service';

const uploadSingleFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const result = await UploadService.uploadSingleFile(req.file, {
    folder: req.body.folder || 'uploads',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File uploaded successfully',
    data: result,
  });
});

const uploadMultipleFiles = catchAsync(async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'No files uploaded',
    });
  }

  const result = await UploadService.uploadMultipleFiles(req.files, {
    folder: req.body.folder || 'uploads',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Files uploaded successfully',
    data: result,
  });
});

const deleteFile = catchAsync(async (req: Request, res: Response) => {
  const { key, url } = req.body;

  if (!key && !url) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'File key or URL is required',
    });
  }

  await UploadService.deleteFile(key || url);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File deleted successfully',
    data: null,
  });
});

const deleteMultipleFiles = catchAsync(async (req: Request, res: Response) => {
  const { keys, urls } = req.body;

  if ((!keys || keys.length === 0) && (!urls || urls.length === 0)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'File keys or URLs are required',
    });
  }

  await UploadService.deleteMultipleFiles(keys || urls);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Files deleted successfully',
    data: null,
  });
});

const getSignedUrl = catchAsync(async (req: Request, res: Response) => {
  const { key, url, expiresIn } = req.body;

  if (!key && !url) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'File key or URL is required',
    });
  }

  const result = await UploadService.getSignedUrl(
    key || url,
    expiresIn || 3600,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Signed URL generated successfully',
    data: { signedUrl: result },
  });
});

export const UploadController = {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  getSignedUrl,
};
