'use server';

import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { storeWhereForUser } from '@/lib/store-access';
import { runDiscoveryForStore } from '@/lib/discovery';
import { revalidatePath } from 'next/cache';

export async function runDiscoveryForAllStores() {
  const user = await requireCurrentUser();

  // Get all stores for this user with lat/lng
  const stores = await prisma.store.findMany({
    where: storeWhereForUser(user),
    include: { masterProfile: true },
  });

  // Filter stores that have lat/lng
  const storesWithCoordinates = stores.filter(
    (s) => s.masterProfile?.lat && s.masterProfile?.lng
  );

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  // Run discovery for each store
  for (const store of storesWithCoordinates) {
    try {
      await runDiscoveryForStore(store.id);
      processed++;
    } catch (error) {
      failed++;
      errors.push(
        `${store.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Revalidate the page
  revalidatePath('/admin/stores');

  return {
    processed,
    failed,
    total: storesWithCoordinates.length,
    errors: errors.slice(0, 5), // Return first 5 errors
  };
}
