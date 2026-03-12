import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import DiscoveryClient from './client';

export default async function DiscoveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
    include: { 
        matchCandidates: { where: { status: 'PENDING' } },
        locationLinks: true
    }
  });

  if (!store) notFound();

  return <DiscoveryClient store={store} />;
}
