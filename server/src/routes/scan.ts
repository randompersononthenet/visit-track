import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../lib/validation';
import { requireAuth } from '../middleware/auth';
import { Visitor } from '../models/Visitor';
import { Personnel } from '../models/Personnel';
import { VisitLog } from '../models/VisitLog';
import { Violation } from '../models/Violation';

const router = Router();

router.use(requireAuth);

const scanSchema = z.object({
  qrCode: z.string().min(1),
  action: z.enum(['checkin', 'checkout']),
});

router.post('/', validate(scanSchema), async (req, res) => {
  const { qrCode, action } = (req as any).parsed as { qrCode: string; action: 'checkin' | 'checkout' };

  // Try to match Visitor first, then Personnel
  const visitor = await Visitor.findOne({ where: { qrCode } });
  const personnel = visitor ? null : await Personnel.findOne({ where: { qrCode } });

  if (!visitor && !personnel) {
    return res.status(400).json({ error: 'Invalid QR code' });
  }

  const now = new Date();

  const subject = visitor
    ? { type: 'visitor' as const, id: visitor.id, fullName: visitor.fullName, firstName: visitor.firstName, middleName: visitor.middleName, lastName: visitor.lastName }
    : { type: 'personnel' as const, id: (personnel as any)!.id, fullName: (personnel as any)!.fullName, firstName: (personnel as any)!.firstName, middleName: (personnel as any)!.middleName, lastName: (personnel as any)!.lastName, roleTitle: (personnel as any)!.roleTitle };

  // Retrieve violation alerts (only for visitors)
  let alerts: Array<{ level: string; details?: string | null; recordedAt: Date }> = [];
  if (visitor) {
    const latestViolations = await Violation.findAll({ where: { visitorId: visitor.id }, order: [['recordedAt', 'DESC']], limit: 3 });
    alerts = latestViolations.map(v => ({ level: v.level, details: v.details ?? null, recordedAt: v.recordedAt }));
  }

  if (action === 'checkin') {
    const log = await VisitLog.create({
      visitorId: visitor ? visitor.id : null,
      personnelId: personnel ? personnel.id : null,
      handledByUserId: (req as any).user?.id ?? null,
      timeIn: now,
      purpose: undefined,
      notes: undefined,
    });
    return res.json({ status: 'ok', event: 'checkin', at: now, logId: log.id, subjectType: subject.type, subject, alerts });
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
  await openLog.update({ timeOut: now, handledByUserId: (req as any).user?.id ?? openLog.handledByUserId });
  return res.json({ status: 'ok', event: 'checkout', at: now, logId: openLog.id, subjectType: subject.type, subject, alerts });
});

export default router;
