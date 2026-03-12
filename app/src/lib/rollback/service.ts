import { prisma } from '@/lib/db';

export async function createSnapshot(
    storeId: string,
    platform: string,
    data: unknown,
    actionType: string
) {
    await prisma.changeSnapshot.create({
        data: {
            storeId,
            platform,
            snapshotData: JSON.stringify(data),
            actionType
        }
    });
}

export async function rollbackSnapshot(snapshotId: string) {
    const snapshot = await prisma.changeSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot) throw new Error('Snapshot not found');

    const data: unknown = JSON.parse(snapshot.snapshotData);
    
    // In real implementation, this would trigger a sync back to the platform using 'data'
    // For now, we mark as restored
    
    await prisma.changeSnapshot.update({
        where: { id: snapshotId },
        data: { restoredAt: new Date() }
    });
    
    return data;
}
