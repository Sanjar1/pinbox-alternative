'use server';

import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { requireCurrentUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { toCleanString, validateStoreInput } from '@/lib/validation';
import { generateUniqueSlug } from '@/lib/qr';
import { resolvePlatformInput } from '@/lib/platform-links';

export async function createStore(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  if (user.role !== 'OWNER') {
    return { error: 'Only owners can create stores' };
  }

  const name = toCleanString(formData.get('name'));
  const address = toCleanString(formData.get('address'));
  const googleUrl = toCleanString(formData.get('googleUrl'));
  const yandexUrl = toCleanString(formData.get('yandexUrl'));
  const twogisUrl = toCleanString(formData.get('twogisUrl'));

  const validationError = validateStoreInput({
    name,
    address,
    googleUrl,
    yandexUrl,
    twogisUrl,
  });
  if (validationError) {
    return { error: validationError };
  }

  try {
    const slug = await generateUniqueSlug();

    const store = await prisma.store.create({
      data: {
        name,
        address,
        tenantId: user.tenantId,
        qrCodes: {
          create: {
            name: 'Default',
            slug,
          },
        },
        // Create empty master profile
        masterProfile: {
          create: {
             name,
             address,
          }
        }
      },
    });

    const googleInput = resolvePlatformInput('GOOGLE', googleUrl, name, address);
    const yandexInput = resolvePlatformInput('YANDEX', yandexUrl, name, address);
    const twogisInput = resolvePlatformInput('TWOGIS', twogisUrl, name, address);

    if (googleInput && googleInput.url) {
      await prisma.platformLocationLink.create({
        data: {
          storeId: store.id,
          platform: 'GOOGLE',
          url: googleInput.url,
          syncStatus: 'DISCONNECTED',
        },
      });
    }
    if (yandexInput && yandexInput.url) {
      await prisma.platformLocationLink.create({
        data: {
          storeId: store.id,
          platform: 'YANDEX',
          url: yandexInput.url,
          syncStatus: 'DISCONNECTED',
        },
      });
    }
    if (twogisInput && twogisInput.url) {
      await prisma.platformLocationLink.create({
        data: {
          storeId: store.id,
          platform: 'TWOGIS',
          url: twogisInput.url,
          syncStatus: 'DISCONNECTED',
        },
      });
    }

    await writeAuditLog({
      action: 'STORE_CREATED',
      userId: user.id,
      tenantId: user.tenantId,
      details: { storeId: store.id, storeName: store.name },
    });
  } catch (e) {
    console.error(e);
    return { error: 'Failed to create store' };
  }

  redirect('/admin/stores');
}