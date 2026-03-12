import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import EditStoreClient from './client';
import { requireCurrentUser } from '@/lib/auth';
import { storeByIdWhereForUser } from '@/lib/store-access';

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();

  const store = await prisma.store.findFirst({
    where: storeByIdWhereForUser(user, id),
    include: { 
      masterProfile: true,
      locationLinks: true,
    },
  });

  if (!store) notFound();

  // If master profile is missing (legacy stores), we might need to create it on fly or handle null in UI.
  // For MVP, assume seed created it or UI handles null.

  return <EditStoreClient store={store} />;
}