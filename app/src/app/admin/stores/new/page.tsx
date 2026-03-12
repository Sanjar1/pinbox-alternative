import { requireOwner } from '@/lib/auth';
import { NewStoreForm } from './new-store-form';

export default async function NewStorePage() {
  await requireOwner();
  return <NewStoreForm />;
}

