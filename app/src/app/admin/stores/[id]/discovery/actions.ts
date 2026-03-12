'use server';
import { runDiscoveryForStore } from '@/lib/discovery';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireCurrentUser } from '@/lib/auth';

export async function triggerDiscovery(storeId: string) {
    try {
        const user = await requireCurrentUser();
        // Verify ownership
        const store = await prisma.store.findFirst({
            where: { id: storeId, tenantId: user.tenantId }
        });
        if (!store) throw new Error('Unauthorized');

        await runDiscoveryForStore(storeId);
        revalidatePath(`/admin/stores/${storeId}/discovery`);
        return { success: true };
    } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
}

export async function acceptCandidate(storeId: string, candidateId: string) {
    const user = await requireCurrentUser();
    const store = await prisma.store.findFirst({
        where: { id: storeId, tenantId: user.tenantId }
    });
    if (!store) return { error: 'Unauthorized' };

    const candidate = await prisma.matchCandidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return { error: 'Candidate not found' };

    const matchData = candidate.matchData ? JSON.parse(candidate.matchData) : {};
    
    await prisma.platformLocationLink.upsert({
        where: { storeId_platform: { storeId, platform: candidate.platform } },
        create: {
            storeId,
            platform: candidate.platform,
            externalId: candidate.externalId,
            url: matchData.url,
            syncStatus: 'CONNECTED', 
            capabilityLevel: 'MANUAL' // Default to manual until we verify capabilities
        },
        update: {
            externalId: candidate.externalId,
            url: matchData.url,
            syncStatus: 'CONNECTED',
        }
    });

    await prisma.matchCandidate.update({
        where: { id: candidateId },
        data: { status: 'ACCEPTED' }
    });

    await prisma.matchCandidate.updateMany({
        where: { storeId, platform: candidate.platform, status: 'PENDING' },
        data: { status: 'REJECTED' }
    });
    
    revalidatePath(`/admin/stores/${storeId}/discovery`);
}