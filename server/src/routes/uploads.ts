import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

router.use(requireAuth);

// POST /api/uploads/image { dataUrl: 'data:image/png;base64,...' }
router.post('/image', requirePermission('uploads:manage'), async (req, res) => {
  try {
    const { dataUrl } = req.body as { dataUrl?: string };
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }
    const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/i);
    if (!match) return res.status(400).json({ error: 'Unsupported image format' });
    const mime = match[1];
    const ext = mime === 'image/png' ? 'png' : 'jpg';
    const b64 = match[3];

    const buffer = Buffer.from(b64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) { // 5MB
      return res.status(413).json({ error: 'File too large (max 5MB)' });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const urlPath = `/uploads/${filename}`;
    res.status(201).json({ url: urlPath });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/uploads/import { url: 'https://...' }
router.post('/import', requirePermission('uploads:manage'), async (req, res) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    const resp = await fetch(url);
    if (!resp.ok) return res.status(400).json({ error: 'Failed to fetch image' });
    const contentType = resp.headers.get('content-type') || '';
    const isPng = contentType.startsWith('image/png');
    const isJpeg = contentType.startsWith('image/jpeg') || contentType.startsWith('image/jpg');
    if (!isPng && !isJpeg) return res.status(400).json({ error: 'Unsupported image format' });
    const ab = await resp.arrayBuffer();
    const buffer = Buffer.from(ab);
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'File too large (max 5MB)' });
    }
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const ext = isPng ? 'png' : 'jpg';
    const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);
    const urlPath = `/uploads/${filename}`;
    res.status(201).json({ url: urlPath });
  } catch (err: any) {
    res.status(500).json({ error: 'Import failed' });
  }
});

export default router;
