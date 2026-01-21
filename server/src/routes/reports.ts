import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { Visitor } from '../models/Visitor';
import { Personnel } from '../models/Personnel';
import { VisitLog } from '../models/VisitLog';
import { User } from '../models/User';

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

router.get('/visitors.csv', async (req, res) => {
  const { dateFrom, dateTo } = req.query as Record<string, string>;
  const where: any = {};
  if (dateFrom || dateTo) {
    where.createdAt = {} as any;
    if (dateFrom) {
      const d = new Date(dateFrom);
      d.setHours(0, 0, 0, 0);
      (where.createdAt as any)[Op.gte] = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      (where.createdAt as any)[Op.lte] = d;
    }
  }
  const rows = await Visitor.findAll({ where, order: [['id', 'ASC']] });
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

// Visit logs CSV: supports subject filters and date range (timeIn)
router.get('/visit-logs.csv', async (req, res) => {
  const { subjectType, subjectId, dateFrom, dateTo, page, pageSize } = req.query as Record<string, string>;
  // optional paging to avoid huge memory (defaults similar to API)
  const p = Math.max(parseInt(page || '1') || 1, 1);
  const ps = Math.min(Math.max(parseInt(pageSize || '1000') || 1000, 1), 5000); // up to 5k rows per request

  const where: any = {};
  if (subjectType === 'visitor') {
    where.visitorId = subjectId ? Number(subjectId) : { [Op.ne]: null };
  } else if (subjectType === 'personnel') {
    where.personnelId = subjectId ? Number(subjectId) : { [Op.ne]: null };
  } else if (subjectId) {
    where[Op.or] = [{ visitorId: Number(subjectId) }, { personnelId: Number(subjectId) }];
  }
  if (dateFrom || dateTo) {
    where.timeIn = {} as any;
    if (dateFrom) {
      const d = new Date(dateFrom);
      d.setHours(0, 0, 0, 0);
      (where.timeIn as any)[Op.gte] = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      (where.timeIn as any)[Op.lte] = d;
    }
  }

  const { rows } = await VisitLog.findAndCountAll({
    where,
    order: [['timeIn', 'DESC']],
    offset: (p - 1) * ps,
    limit: ps,
    include: [
      { model: Visitor, as: 'visitor', attributes: ['id', 'fullName'] },
      { model: Personnel, as: 'personnel', attributes: ['id', 'fullName', 'roleTitle'] },
      { model: User, as: 'handledBy', attributes: ['id', 'username'] },
    ],
  });

  const header = ['Log ID', 'Subject Type', 'Subject ID', 'Subject Name', 'Role', 'Time In', 'Time Out', 'Handled By'];
  const lines = [toCsvRow(header)];
  for (const r of rows) {
    const type = (r as any).visitorId ? 'visitor' : ((r as any).personnelId ? 'personnel' : '');
    const subjectId = (r as any).visitorId || (r as any).personnelId || '';
    const subjectName = (r as any).visitor?.fullName || (r as any).personnel?.fullName || '';
    const roleTitle = (r as any).personnel?.roleTitle || '';
    const handled = (r as any).handledBy?.username || '';
    lines.push(
      toCsvRow([
        r.id,
        type,
        subjectId,
        subjectName,
        roleTitle,
        r.timeIn?.toISOString?.() || r.timeIn,
        r.timeOut ? (r.timeOut as any).toISOString?.() || r.timeOut : '',
        handled,
      ])
    );
  }
  const csv = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="visit-logs.csv"');
  res.send(csv);
});

router.get('/personnel.csv', async (req, res) => {
  const { dateFrom, dateTo } = req.query as Record<string, string>;
  const where: any = {};
  if (dateFrom || dateTo) {
    where.createdAt = {} as any;
    if (dateFrom) {
      const d = new Date(dateFrom);
      d.setHours(0, 0, 0, 0);
      (where.createdAt as any)[Op.gte] = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      (where.createdAt as any)[Op.lte] = d;
    }
  }
  const rows = await Personnel.findAll({ where, order: [['id', 'ASC']] });
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
