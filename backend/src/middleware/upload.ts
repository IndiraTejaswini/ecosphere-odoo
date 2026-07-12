import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * ============================================================================
 * Local "Evidence" Storage  (Boss Level Add-On #12)
 * ============================================================================
 * Saves CSR/Challenge proof uploads to a local /uploads directory instead of
 * S3 - zero cloud setup needed for a hackathon. Only the local path string
 * (e.g. "/uploads/172930-3821.jpg") is stored in MongoDB; server.ts serves
 * the /uploads directory statically so the frontend can render it directly
 * via <img src={`${API_URL}${proofUrl}`} />.
 *
 * UPGRADE PATH: to move to S3 later, you'd only need to change this file
 * (swap `multer.diskStorage` for `multer-s3`) - no route code changes needed,
 * since routes only ever read `req.file.path` / the resulting URL string.
 * ==========================================================================*/
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.mp4', '.webp'];

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap keeps the hackathon server's disk sane
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${ext}`));
  },
});

/** Converts a saved multer file into the path string we store in MongoDB. */
export function toPublicPath(filename: string): string {
  return `/uploads/${filename}`;
}
