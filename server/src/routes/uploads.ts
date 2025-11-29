import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.use(requireAuth);

// POST /api/uploads/image { dataUrl: 'data:image/png;base64,...' }
router.post('/image', requireRole('admin', 'staff'), async (req, res) => {
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
    if (buffer.length > 2 * 1024 * 1024) { // 2MB
      return res.status(413).json({ error: 'File too large' });
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

export default router;
