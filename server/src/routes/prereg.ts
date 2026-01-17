import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { fetchPending, markImported, markRejected, PreregRow } from '../lib/preregClient';

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

function mapPrefill(row: PreregRow) {
  const { firstName, middleName, lastName } = splitFullName(row.full_name || '');
  return {
    source: 'prereg',
    sourceId: row.id,
    firstName,
    middleName,
    lastName,
    contact: row.contact_number || '',
    relation: row.purpose_of_visit || '',
    intendedVisitDate: row.intended_visit_date || null,
  };
}

router.get('/pending', async (_req, res) => {
  try {
    const rows = await fetchPending(200);
    // Do not include sensitive mapping yet; show raw + derived preview
    const data = rows.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      contact_number: r.contact_number || null,
      purpose_of_visit: r.purpose_of_visit || null,
      intended_visit_date: r.intended_visit_date || null,
      created_at: r.created_at,
      prefillPreview: mapPrefill(r),
    }));
    res.json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to fetch pre-registrations' });
  }
});

router.post('/:id/approve', async (req, res) => {
  const { id } = req.params as { id: string };
  try {
    const rows = await fetchPending(500);
    const row = rows.find((r) => r.id === id);
    if (!row) return res.status(404).json({ error: 'Pre-registration not found or not pending' });
    await markImported(id);
    const prefill = mapPrefill(row);
    res.json({ status: 'ok', prefill });
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
