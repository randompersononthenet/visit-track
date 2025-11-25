import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { Visitor } from '../models/Visitor';
import { Personnel } from '../models/Personnel';

function toCsvRow(fields: (string | number | null | undefined)[]) {
  return fields
    .map((v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
        // escape double quotes by doubling them per RFC 4180
        const escaped = s.replace(/"/g, '""');
        return '"' + escaped + '"';
      }
      return s;
    })
    .join(',');
}

const router = Router();

// All reports require auth + role (admin or staff)
router.use(requireAuth);
router.use(requireRole('admin', 'staff'));

router.get('/visitors.csv', async (_req, res) => {
  const rows = await Visitor.findAll({ order: [['id', 'ASC']] });
  const header = ['ID', 'Full Name', 'First Name', 'Middle Name', 'Last Name', 'Contact', 'ID Number', 'Relation', 'QR Code', 'Blacklisted', 'Created At'];
  const lines = [toCsvRow(header)];
  for (const r of rows) {
    lines.push(
      toCsvRow([
        r.id,
        r.fullName,
        r.firstName || '',
        r.middleName || '',
        r.lastName || '',
        r.contact || '',
        r.idNumber || '',
        r.relation || '',
        r.qrCode || '',
        r.blacklistStatus ? 'Yes' : 'No',
        r.get('createdAt') as any,
      ])
    );
  }
  const csv = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="visitors.csv"');
  res.send(csv);
});

router.get('/personnel.csv', async (_req, res) => {
  const rows = await Personnel.findAll({ order: [['id', 'ASC']] });
  const header = ['ID', 'Full Name', 'First Name', 'Middle Name', 'Last Name', 'Role Title', 'QR Code', 'Created At'];
  const lines = [toCsvRow(header)];
  for (const r of rows) {
    lines.push(
      toCsvRow([
        r.id,
        r.fullName,
        (r as any).firstName || '',
        (r as any).middleName || '',
        (r as any).lastName || '',
        (r as any).roleTitle || '',
        (r as any).qrCode || '',
        r.get('createdAt') as any,
      ])
    );
  }
  const csv = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="personnel.csv"');
  res.send(csv);
});

// PDF endpoints (stubs for now, Phase 5 will wire PDFKit)
router.get('/visitors.pdf', (_req, res) => {
  res.status(501).json({ error: 'PDF export not implemented yet' });
});
router.get('/personnel.pdf', (_req, res) => {
  res.status(501).json({ error: 'PDF export not implemented yet' });
});

export default router;
