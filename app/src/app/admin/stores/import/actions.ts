'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import type { ActionState } from '@/lib/action-state';
import { parseCsv, validateStoreInput } from '@/lib/validation';
import { generateUniqueSlug } from '@/lib/qr';
import { resolvePlatformInput } from '@/lib/platform-links';

type CsvStoreRow = {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  googleUrl: string;
  yandexUrl: string;
  twogisUrl: string;
};

function normalizeRow(row: Record<string, string>): CsvStoreRow {
  const lat = row.lat ? parseFloat(row.lat) : undefined;
  const lng = row.lng ? parseFloat(row.lng) : undefined;

  return {
    name: (row.name || '').trim(),
    address: (row.address || '').trim(),
    lat: isNaN(lat || NaN) ? undefined : lat,
    lng: isNaN(lng || NaN) ? undefined : lng,
    googleUrl: (row.googleUrl || '').trim(),
    yandexUrl: (row.yandexUrl || '').trim(),
    twogisUrl: (row.twogisUrl || '').trim(),
  };
}

export async function importStores(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireOwner();
  const csvFile = formData.get('csvFile');
  const mode = (formData.get('mode') as string) || 'create-only'; // 'create-only' or 'create-and-update'

  if (!(csvFile instanceof File)) {
    return { error: 'Please upload a CSV file' };
  }

  const csvText = await csvFile.text();
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { error: 'CSV must include a header and at least one data row' };
  }

  const normalizedRows = rows.map(normalizeRow);
  for (let i = 0; i < normalizedRows.length; i += 1) {
    const rowError = validateStoreInput(normalizedRows[i]);
    if (rowError) {
      return { error: `Row ${i + 2}: ${rowError}` };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      let created = 0;
      let updated = 0;

      for (const row of normalizedRows) {
        // Try to find existing store by name (within same tenant)
        const existing = mode === 'create-and-update'
          ? await tx.store.findFirst({
              where: { name: row.name, tenantId: user.tenantId },
            })
          : null;

        if (existing) {
          // Update existing store's master profile
          await tx.storeMasterProfile.upsert({
            where: { storeId: existing.id },
            create: {
              storeId: existing.id,
              name: row.name,
              address: row.address,
              lat: row.lat,
              lng: row.lng,
            },
            update: {
              name: row.name,
              address: row.address,
              lat: row.lat,
              lng: row.lng,
            },
          });
          updated++;
        } else {
          // Create new store
          const slug = await generateUniqueSlug();
          const store = await tx.store.create({
            data: {
              name: row.name,
              address: row.address,
              tenantId: user.tenantId,
              qrCodes: {
                create: {
                  name: 'Default',
                  slug,
                },
              },
              masterProfile: {
                create: {
                  name: row.name,
                  address: row.address,
                  lat: row.lat,
                  lng: row.lng,
                },
              },
            },
          });

          const googleInput = resolvePlatformInput('GOOGLE', row.googleUrl, row.name, row.address);
          const yandexInput = resolvePlatformInput('YANDEX', row.yandexUrl, row.name, row.address);
          const twogisInput = resolvePlatformInput('TWOGIS', row.twogisUrl, row.name, row.address);

          if (googleInput && googleInput.url) {
            await tx.platformLocationLink.create({
              data: {
                storeId: store.id,
                platform: 'GOOGLE',
                url: googleInput.url,
                syncStatus: 'DISCONNECTED',
              },
            });
          }
          if (yandexInput && yandexInput.url) {
            await tx.platformLocationLink.create({
              data: {
                storeId: store.id,
                platform: 'YANDEX',
                url: yandexInput.url,
                syncStatus: 'DISCONNECTED',
              },
            });
          }
          if (twogisInput && twogisInput.url) {
            await tx.platformLocationLink.create({
              data: {
                storeId: store.id,
                platform: 'TWOGIS',
                url: twogisInput.url,
                syncStatus: 'DISCONNECTED',
              },
            });
          }

          created++;
        }
      }

      console.log(`Import complete: ${created} created, ${updated} updated`);
    });
  } catch (error) {
    console.error(error);
    return { error: 'Import failed. Please verify CSV data and try again.' };
  }

  await writeAuditLog({
    action: 'STORE_IMPORT_CSV',
    userId: user.id,
    tenantId: user.tenantId,
    details: { rows: normalizedRows.length, mode },
  });

  redirect('/admin/stores');
}