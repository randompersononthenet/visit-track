import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';

export async function audit(req: Request, action: string, entityType: string, entityId: number | null, details?: object) {
  try {
    const user = (req as any).user as { id: number; username: string } | undefined;
    await AuditLog.create({
      actorId: user?.id ?? null,
      actorUsername: user?.username ?? null,
      action,
      entityType,
      entityId,
      details: details || null,
    } as any);
  } catch (e) {
    // Swallow audit errors to avoid blocking main flow
    // console.error('Audit error', e);
  }
}
