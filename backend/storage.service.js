import multer from 'multer';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// We no longer support local disk uploads. Use S3 by setting STORAGE_TYPE=s3

// This function acts as a unified middleware. If we later switch to S3,
// we can conditionally export an S3 upload middleware instead.
export const uploadVideo = () => {
  const customStorageType = process.env.STORAGE_TYPE || 's3';
  if (customStorageType !== 's3') {
    throw new Error(`Storage type ${customStorageType} is not implemented. Set STORAGE_TYPE=s3 in your environment.`);
  }

  // Use memory storage to capture the file buffer, then upload to S3
  const memoryStorage = multer.memoryStorage();
  const uploadMemory = multer({ storage: memoryStorage });

  // s3 path
  {
    // Use memory storage to capture the file buffer, then upload to S3
    return (req, res, next) => {
      const single = uploadMemory.single('video');
      single(req, res, async (err) => {
        if (err) return next(err);
        if (!req.file) return res.status(400).json({ error: 'Video file is required.' });

        const bucket = process.env.S3_BUCKET;
        const region = process.env.S3_REGION;
        const accessKeyId = process.env.S3_ACCESS_KEY_ID;
        const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
        const endpoint = process.env.S3_ENDPOINT || undefined;

        if (!bucket || !region || !accessKeyId || !secretAccessKey) {
          return next(new Error('S3 configuration is missing in environment variables.'));
        }

        try {
          const s3 = new S3Client({
            region,
            endpoint,
            credentials: {
              accessKeyId,
              secretAccessKey
            },
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
          });

          const ext = path.extname(req.file.originalname) || '.webm';
          const key = (process.env.S3_PREFIX || 'videos/') + `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

          const putParams = {
            Bucket: bucket,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
          };
          // if (process.env.S3_PUBLIC === 'true') {
          //   putParams.ACL = 'public-read';
          // }

          await s3.send(new PutObjectCommand(putParams));

          // Construct a public URL. Allow overriding base via S3_PUBLIC_URL env (e.g. CloudFront)
          let location;
          if (process.env.S3_PUBLIC_URL) {
            location = `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
          } else {
            // Default AWS S3 URL pattern
            location = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
          }

          // Set file info similar to multer.diskStorage so server.js can work with it
          req.file = Object.assign(req.file, {
            filename: path.basename(key),
            key,
            location
          });

          next();
        } catch (uploadErr) {
          next(uploadErr);
        }
      });
    };
  }
};
