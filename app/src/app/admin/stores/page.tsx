import { prisma } from '@/lib/db';
import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { storeWhereForUser } from '@/lib/store-access';
import StoresPageClient from './stores-page-client';

export default async function StoresPage() {
  const user = await requireCurrentUser();

  const stores = await prisma.store.findMany({
    where: storeWhereForUser(user),
    include: {
      qrCodes: true,
      masterProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const storesWithoutLatLng = stores.filter(s => !s.masterProfile?.lat || !s.masterProfile?.lng).length;
  const storesWithLatLng = stores.length - storesWithoutLatLng;

  return (
    <StoresPageClient
      stores={stores}
      isOwner={user.role === 'OWNER'}
      storesWithLatLng={storesWithLatLng}
      storesWithoutLatLng={storesWithoutLatLng}
    />
  );
}
