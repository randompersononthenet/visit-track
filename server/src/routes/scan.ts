// Scan routes: handle QR scans for visitors/personnel.
// Includes preview (no log) and create visit logs for check-in/out.
import { Router } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { validate } from '../lib/validation';
import { requireAuth } from '../middleware/auth';
import { Visitor } from '../models/Visitor';
import { Personnel } from '../models/Personnel';
import { VisitLog } from '../models/VisitLog';
import { Violation } from '../models/Violation';
import { requireRole } from '../middleware/roles';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'staff', 'officer'));

/**
 * GET /api/scan/preview?qrCode=...
 * Look up subject and recent alerts without creating a VisitLog.
 */
router.get('/preview', async (req, res) => {
  const qrCode = String(req.query.qrCode || '').trim();
  if (!qrCode) return res.status(400).json({ error: 'qrCode is required' });
  const visitor = await Visitor.findOne({ where: { qrCode } });
  const personnel = visitor ? null : await Personnel.findOne({ where: { qrCode } });
  if (!visitor && !personnel) return res.status(404).json({ error: 'Not found' });
  const subject = visitor
    ? { type: 'visitor' as const, id: visitor.id, fullName: visitor.fullName, firstName: visitor.firstName, middleName: visitor.middleName, lastName: visitor.lastName, photoUrl: (visitor as any).photoUrl, riskLevel: (visitor as any).riskLevel, flagReason: (visitor as any).flagReason, blacklistStatus: (visitor as any).blacklistStatus }
    : { type: 'personnel' as const, id: (personnel as any)!.id, fullName: (personnel as any)!.fullName, firstName: (personnel as any)!.firstName, middleName: (personnel as any)!.middleName, lastName: (personnel as any)!.lastName, roleTitle: (personnel as any)!.roleTitle, photoUrl: (personnel as any)!.photoUrl };
  let alerts: Array<{ level: string; details?: string | null; recordedAt: Date }> = [];
  if (visitor) {
    const latestViolations = await Violation.findAll({ where: { visitorId: visitor.id }, order: [['recordedAt', 'DESC']], limit: 3 });
    alerts = latestViolations.map(v => ({ level: v.level, details: v.details ?? null, recordedAt: v.recordedAt }));
  }
  return res.json({ status: 'ok', subjectType: subject.type, subject, alerts });
});

const scanSchema = z.object({
  qrCode: z.string().min(1),
  action: z.enum(['checkin', 'checkout']),
});

router.post('/', validate(scanSchema), async (req, res) => {
  const { action } = (req as any).parsed as { qrCode: string; action: 'checkin' | 'checkout' };
  const qrCode = String((req as any).parsed.qrCode).trim();

  // Try to match Visitor first, then Personnel
  const visitor = await Visitor.findOne({ where: { qrCode } });
  const personnel = visitor ? null : await Personnel.findOne({ where: { qrCode } });

  if (!visitor && !personnel) {
    return res.status(400).json({ error: 'Invalid QR code' });
  }

  const now = new Date();
  // Compute today's window [start, end)
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const subject = visitor
    ? { type: 'visitor' as const, id: visitor.id, fullName: visitor.fullName, firstName: visitor.firstName, middleName: visitor.middleName, lastName: visitor.lastName, photoUrl: (visitor as any).photoUrl, riskLevel: (visitor as any).riskLevel, flagReason: (visitor as any).flagReason, blacklistStatus: (visitor as any).blacklistStatus }
    : { type: 'personnel' as const, id: (personnel as any)!.id, fullName: (personnel as any)!.fullName, firstName: (personnel as any)!.firstName, middleName: (personnel as any)!.middleName, lastName: (personnel as any)!.lastName, roleTitle: (personnel as any)!.roleTitle, photoUrl: (personnel as any)!.photoUrl };

  // Retrieve violation alerts (only for visitors)
  let alerts: Array<{ level: string; details?: string | null; recordedAt: Date }> = [];
  if (visitor) {
    const latestViolations = await Violation.findAll({ where: { visitorId: visitor.id }, order: [['recordedAt', 'DESC']], limit: 3 });
    alerts = latestViolations.map(v => ({ level: v.level, details: v.details ?? null, recordedAt: v.recordedAt }));
  }

  if (action === 'checkin') {
    // Prevent more than one check-in per subject per day
    const whereCheckedInToday: any = {
      timeIn: { [Op.gte]: dayStart, [Op.lt]: dayEnd },
    };
    if (visitor) whereCheckedInToday.visitorId = visitor.id; else whereCheckedInToday.personnelId = (personnel as any)!.id;
    const existingIn = await VisitLog.findOne({ where: whereCheckedInToday });
    if (existingIn) {
      return res.status(400).json({ error: 'Already checked in today' });
    }
    const log = await VisitLog.create({
      visitorId: visitor ? visitor.id : null,
      personnelId: personnel ? personnel.id : null,
      handledByUserId: (req as any).user?.id ?? null,
      timeIn: now,
      purpose: undefined,
      notes: undefined,
    });
    return res.json({ status: 'ok', event: 'checkin', at: now, logId: log.id, subjectType: subject.type, subject, alerts, elapsedSeconds: 0 });
  }

  // checkout
  const whereOpen: any = {
    timeOut: null,
  };
  if (visitor) whereOpen.visitorId = visitor.id;
  if (personnel) whereOpen.personnelId = personnel.id;

  const openLog = await VisitLog.findOne({ where: whereOpen, order: [['timeIn', 'DESC']] });
  if (!openLog) {
    return res.status(400).json({ error: 'No open check-in found for this QR code' });
  }
  // Prevent more than one check-out per subject per day
  const whereCheckedOutToday: any = {
    timeOut: { [Op.gte]: dayStart, [Op.lt]: dayEnd },
  };
  if (visitor) whereCheckedOutToday.visitorId = visitor.id; else whereCheckedOutToday.personnelId = (personnel as any)!.id;
  const existingOut = await VisitLog.findOne({ where: whereCheckedOutToday });
  if (existingOut) {
    return res.status(400).json({ error: 'Already checked out today' });
  }
  const elapsedSeconds = Math.max(0, Math.round((now.getTime() - new Date(openLog.timeIn).getTime()) / 1000));
  await openLog.update({ timeOut: now, durationSeconds: elapsedSeconds, handledByUserId: (req as any).user?.id ?? openLog.handledByUserId });
  return res.json({ status: 'ok', event: 'checkout', at: now, logId: openLog.id, subjectType: subject.type, subject, alerts, elapsedSeconds });
});

export default router;
