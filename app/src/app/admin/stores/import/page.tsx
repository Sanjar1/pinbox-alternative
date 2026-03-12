import { requireOwner } from '@/lib/auth';
import { ImportStoresForm } from './import-stores-form';

export default async function ImportStoresPage() {
  await requireOwner();
  return <ImportStoresForm />;
}

