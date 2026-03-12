import { prisma } from '@/lib/db';

type AuditInput = {
  action: string;
  userId?: string | null;
  tenantId?: string | null;
  details?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        tenantId: input.tenantId ?? null,
        details: input.details ? JSON.stringify(input.details) : null,
      },
    });
  } catch (error) {
    // Audit logging must not break user-facing flows.
    console.error('audit-log-error', error);
  }
}

