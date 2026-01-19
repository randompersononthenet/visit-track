import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { fetchPending, markImported, markRejected, PreregRow } from '../lib/preregClient';
import fs from 'fs';
import path from 'path';
import { Visitor } from '../models/Visitor';
import { v4 as uuidv4 } from 'uuid';
import fsPromises from 'fs/promises';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'staff'));

function splitFullName(full: string): { firstName: string; middleName?: string; lastName: string } {
  const name = (full || '').trim().replace(/\s+/g, ' ');
  if (!name) return { firstName: '', lastName: '' };
  const parts = name.split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middle = parts.slice(1, -1).join(' ');
  return { firstName, middleName: middle, lastName };
}

async function ensurePendingPhotoCached(row: PreregRow): Promise<string | undefined> {
  if (!row.photo_url) return undefined;
  try {
    const resp = await fetch(row.photo_url);
    if (!resp.ok) return undefined;
    const ct = resp.headers.get('content-type') || '';
    const isPng = ct.startsWith('image/png');
    const isJpeg = ct.startsWith('image/jpeg') || ct.startsWith('image/jpg');
    if (!isPng && !isJpeg) return undefined;
    const ext = isPng ? 'png' : 'jpg';
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const pendingDir = path.join(uploadsDir, 'pending');
    await fsPromises.mkdir(pendingDir, { recursive: true });
    const filename = `${row.id}.${ext}`;
    const filePath = path.join(pendingDir, filename);
    try {
      await fsPromises.access(filePath);
      return `/uploads/pending/${filename}`;
    } catch {}
    const ab = await resp.arrayBuffer();
    const buffer = Buffer.from(ab);
    if (buffer.length > 5 * 1024 * 1024) return undefined;
    await fsPromises.writeFile(filePath, buffer);
    return `/uploads/pending/${filename}`;
  } catch {
    return undefined;
  }
}

function mapPrefill(row: PreregRow) {
  let firstName = (row.first_name || '').trim();
  let middleName = (row.middle_name || '').trim();
  let lastName = (row.last_name || '').trim();
  if (!firstName && !lastName && (row.full_name || '')) {
    const s = splitFullName(row.full_name || '');
    firstName = s.firstName;
    if (s.middleName) middleName = s.middleName;
    lastName = s.lastName;
  }
  return {
    source: 'prereg',
    sourceId: row.id,
    firstName,
    middleName: middleName || undefined,
    lastName,
    contact: row.contact_number || '',
    relation: (row.relation || row.purpose_of_visit || '') || '',
    idNumber: row.id_number || undefined,
  };
}

router.get('/pending', async (_req, res) => {
  try {
    const rows = await fetchPending(200);
    // Do not include sensitive mapping yet; show raw + derived preview
    const data = await Promise.all(rows.map(async (r) => ({
      id: r.id,
      full_name: r.full_name || [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' '),
      contact_number: r.contact_number || null,
      purpose_of_visit: r.purpose_of_visit || null,
      relation: r.relation || null,
      id_number: r.id_number || null,
      photo_url: r.photo_url || null,
      photo_preview_url: await ensurePendingPhotoCached(r) || null,
      created_at: r.created_at,
      prefillPreview: mapPrefill(r),
    })));
    res.json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to fetch pre-registrations' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  try {
    const rows = await fetchPending(500);
    const r = rows.find((x) => x.id === id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    const previewPath = await ensurePendingPhotoCached(r);
    const data = {
      id: r.id,
      first_name: r.first_name || null,
      middle_name: r.middle_name || null,
      last_name: r.last_name || null,
      full_name: r.full_name || [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' '),
      contact_number: r.contact_number || null,
      relation: r.relation || r.purpose_of_visit || null,
      id_number: r.id_number || null,
      photo_url: r.photo_url || null,
      photo_preview_url: previewPath || null,
      created_at: r.created_at,
      prefillPreview: mapPrefill(r),
    };
    res.json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to fetch pre-registration' });
  }
});

router.post('/:id/approve', async (req, res) => {
  const { id } = req.params as { id: string };
  try {
    const rows = await fetchPending(500);
    const row = rows.find((r) => r.id === id);
    if (!row) return res.status(404).json({ error: 'Pre-registration not found or not pending' });
    // Build visitor data
    const prefill: any = mapPrefill(row);
    let localPhotoUrl: string | undefined = undefined;
    // Prefer cached pending file if exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const pendingDir = path.join(uploadsDir, 'pending');
    let moved = false;
    for (const ext of ['png','jpg','jpeg']) {
      const pendingFile = path.join(pendingDir, `${row.id}.${ext === 'jpeg' ? 'jpg' : ext}`);
      try {
        await fsPromises.access(pendingFile);
        const finalName = `img_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext === 'jpeg' ? 'jpg' : ext}`;
        const finalPath = path.join(uploadsDir, finalName);
        await fsPromises.rename(pendingFile, finalPath);
        localPhotoUrl = `/uploads/${finalName}`;
        moved = true;
        break;
      } catch {}
    }
    if (!moved && row.photo_url && /^https?:\/\//i.test(row.photo_url)) {
      try {
        const resp = await fetch(row.photo_url);
        if (resp.ok) {
          const ct = resp.headers.get('content-type') || '';
          const isPng = ct.startsWith('image/png');
          const isJpeg = ct.startsWith('image/jpeg') || ct.startsWith('image/jpg');
          if (isPng || isJpeg) {
            const ab = await resp.arrayBuffer();
            const buffer = Buffer.from(ab);
            if (buffer.length <= 5 * 1024 * 1024) {
              await fsPromises.mkdir(uploadsDir, { recursive: true });
              const ext = isPng ? 'png' : 'jpg';
              const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
              const filePath = path.join(uploadsDir, filename);
              await fsPromises.writeFile(filePath, buffer);
              localPhotoUrl = `/uploads/${filename}`;
            }
          }
        }
      } catch {}
    }

    const fullName = [prefill.firstName, prefill.middleName, prefill.lastName].filter(Boolean).join(' ');
    const created = await Visitor.create({
      firstName: prefill.firstName,
      middleName: prefill.middleName,
      lastName: prefill.lastName,
      fullName,
      contact: prefill.contact || undefined,
      idNumber: prefill.idNumber || undefined,
      relation: prefill.relation || undefined,
      qrCode: uuidv4(),
      photoUrl: localPhotoUrl,
    });
    await markImported(id);
    res.status(201).json({ status: 'ok', visitor: created });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Approve failed' });
  }
});

router.post('/:id/reject', async (req, res) => {
  const { id } = req.params as { id: string };
  try {
    await markRejected(id);
    res.json({ status: 'ok' });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Reject failed' });
  }
});

export default router;
