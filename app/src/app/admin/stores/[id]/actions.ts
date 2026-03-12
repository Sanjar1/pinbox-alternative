'use server';

import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { ActionState } from '@/lib/action-state';
import { Platform, ConnectorMode } from '@/lib/connectors/types';
import { GoogleConnectorReal } from '@/lib/connectors/impl/google-real';
import { YandexConnector } from '@/lib/connectors/yandex';
import { TwoGisConnector } from '@/lib/connectors/twogis';

const connectors = {
  [Platform.GOOGLE]: new GoogleConnectorReal(),
  [Platform.YANDEX]: new YandexConnector(),
  [Platform.TWOGIS]: new TwoGisConnector(),
};

export async function updateStoreMasterProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const storeId = formData.get('storeId') as string;
  
  // Validate ownership
  const store = await prisma.store.findFirst({
    where: { id: storeId, tenantId: user.tenantId },
  });
  
  if (!store) return { error: 'Unauthorized or store not found' };

  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null;
  const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null;
  const phone = formData.get('phone') as string;
  const website = formData.get('website') as string;
  const description = formData.get('description') as string;
  const hours = formData.get('hours') as string;

  try {
    await prisma.storeMasterProfile.upsert({
      where: { storeId },
      create: {
        storeId,
        name,
        address,
        lat,
        lng,
        phone,
        website,
        description,
        hours,
      },
      update: {
        name,
        address,
        lat,
        lng,
        phone,
        website,
        description,
        hours,
      },
    });

    // Also update the store's main name/address for display if changed
    if (name !== store.name || address !== store.address) {
       await prisma.store.update({
         where: { id: storeId },
         data: { name, address },
       });
    }

    revalidatePath(`/admin/stores/${storeId}`);
    return { success: 'Master profile updated successfully' };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to update master profile' };
  }
}

export async function syncStoreToPlatforms(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await requireCurrentUser();
    const storeId = formData.get('id') as string;

    const store = await prisma.store.findFirst({
      where: { id: storeId, tenantId: user.tenantId },
      include: { masterProfile: true, locationLinks: true },
    });

    if (!store || !store.masterProfile) {
        return { error: 'Store or Master Profile not found' };
    }

    const { masterProfile } = store;
    const syncData = {
        name: masterProfile.name || undefined,
        address: masterProfile.address || undefined,
        lat: masterProfile.lat || undefined,
        lng: masterProfile.lng || undefined,
        phone: masterProfile.phone || undefined,
        hours: masterProfile.hours || undefined,
        website: masterProfile.website || undefined,
        description: masterProfile.description || undefined,
    };

    const results: string[] = [];
    const errors: string[] = [];

    for (const link of store.locationLinks) {
        if (!link.externalId || link.syncStatus === 'DISCONNECTED') continue;

        const platform = link.platform as Platform;
        const connector = connectors[platform];
        
        if (!connector) continue;
        
        const caps = connector.getCapabilities();
        if (caps.mode === ConnectorMode.MANUAL) {
            results.push(`${platform}: Manual update required (Link: ${link.url})`);
            continue;
        }

        try {
            const result = await connector.updateLocation(link.externalId, syncData);
            results.push(`${platform}: ${result.status}`);
            
            await prisma.platformLocationLink.update({
                where: { id: link.id },
                data: { syncStatus: result.status === 'SYNCED' ? 'SYNCED' : 'PENDING_VERIFICATION' }
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            errors.push(`${platform}: ${msg}`);
            await prisma.platformLocationLink.update({
                where: { id: link.id },
                data: { syncStatus: 'FAILED' }
            });
        }
    }

    if (errors.length > 0) {
        return { error: `Partial sync: ${results.join(', ')}. Errors: ${errors.join(', ')}` };
    }

    revalidatePath(`/admin/stores/${storeId}`);
    return { success: `Sync initiated: ${results.join(', ')}` };
}
