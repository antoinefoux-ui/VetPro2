import { promises as fs } from 'fs';
import path from 'path';
import logger from './logger';

/**
 * Upload file to storage (local filesystem for now, can be extended to S3)
 */
export async function uploadToS3(
  filePathOrBuffer: string | Buffer,
  destinationPath: string
): Promise<string> {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    const fullPath = path.join(uploadsDir, destinationPath);
    const directory = path.dirname(fullPath);

    // Ensure destination directory exists
    await fs.mkdir(directory, { recursive: true });

    // Handle buffer or file path
    if (Buffer.isBuffer(filePathOrBuffer)) {
      await fs.writeFile(fullPath, filePathOrBuffer);
    } else {
      await fs.copyFile(filePathOrBuffer, fullPath);
    }

    // Return URL-accessible path
    const url = `/uploads/${destinationPath}`;
    logger.info(`File uploaded successfully: ${url}`);

    return url;
  } catch (error) {
    logger.error('Error uploading file:', error);
    throw new Error('File upload failed');
  }
}

/**
 * Delete file from storage
 */
export async function deleteFromS3(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    await fs.unlink(fullPath);
    logger.info(`File deleted successfully: ${filePath}`);
  } catch (error) {
    logger.error('Error deleting file:', error);
    throw new Error('File deletion failed');
  }
}

/**
 * Get file from storage
 */
export async function getFromS3(filePath: string): Promise<Buffer> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return await fs.readFile(fullPath);
  } catch (error) {
    logger.error('Error reading file:', error);
    throw new Error('File read failed');
  }
}
