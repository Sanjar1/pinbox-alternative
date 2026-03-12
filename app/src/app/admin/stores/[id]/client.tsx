'use client';

import { updateStoreMasterProfile, syncStoreToPlatforms } from './actions';
import { useActionState } from 'react';
import type { ActionState } from '@/lib/action-state';
import type { Store, StoreMasterProfile, PlatformLocationLink } from '@prisma/client';

type StoreWithDetails = Store & {
  masterProfile: StoreMasterProfile | null;
  locationLinks: PlatformLocationLink[];
};

export default function EditStoreClient({ store }: { store: StoreWithDetails }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateStoreMasterProfile, {});

  const profile = store.masterProfile || {} as Partial<StoreMasterProfile>;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded shadow">
        <h2 className="text-xl font-bold mb-6">Master Store Profile</h2>
        <p className="text-sm text-gray-500 mb-4">This is the single source of truth for all platforms.</p>
        
        <form action={formAction}>
          <input type="hidden" name="storeId" value={store.id} />
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Store Name</label>
              <input name="name" defaultValue={profile.name || store.name} required className="w-full border p-2 rounded" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input name="address" defaultValue={profile.address || store.address || ''} className="w-full border p-2 rounded" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Lat</label>
                <input name="lat" type="number" step="any" defaultValue={profile.lat?.toString() || ''} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lng</label>
                <input name="lng" type="number" step="any" defaultValue={profile.lng?.toString() || ''} className="w-full border p-2 rounded" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input name="phone" defaultValue={profile.phone || ''} className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input name="website" defaultValue={profile.website || ''} className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" defaultValue={profile.description || ''} className="w-full border p-2 rounded" rows={3} />
            </div>

             <div>
              <label className="block text-sm font-medium mb-1">Hours (Text)</label>
              <input name="hours" defaultValue={profile.hours || ''} className="w-full border p-2 rounded" placeholder="Mon-Fri 9-18" />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded mt-6 hover:bg-blue-700">
            Save Master Profile
          </button>
          
          {state?.error && <p className="text-red-500 mt-2">{state.error}</p>}
          {state?.success && <p className="text-green-600 mt-2">{state.success}</p>}
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded shadow">
           <h2 className="text-xl font-bold mb-4">Platform Links</h2>
           <div className="space-y-4">
             {['GOOGLE', 'YANDEX', 'TWOGIS'].map(platform => {
                const link = store.locationLinks.find(l => l.platform === platform);
                return (
                  <div key={platform} className="border p-4 rounded flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{platform}</h3>
                      <p className="text-xs text-gray-500">Status: {link?.syncStatus || 'DISCONNECTED'}</p>
                      {link?.url && <a href={link.url} target="_blank" className="text-blue-500 text-xs hover:underline">View Link</a>}
                    </div>
                    <div className="text-right">
                       <a href={`/admin/stores/${store.id}/discovery`} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 inline-block">
                         {link ? 'Manage' : 'Connect'}
                       </a>
                    </div>
                  </div>
                );
             })}
           </div>
        </div>
        
        <div className="bg-white p-8 rounded shadow">
           <h2 className="text-xl font-bold mb-4">Sync Actions</h2>
           <div className="space-y-4">
              <a 
                href={`/admin/stores/${store.id}/discovery`}
                className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                  Open Discovery & Linking
              </a>
              
              <SyncForm storeId={store.id} />
           </div>
        </div>
      </div>
    </div>
  );
}

function SyncForm({ storeId }: { storeId: string }) {
    const [state, formAction] = useActionState(syncStoreToPlatforms, {});

    return (
        <form action={formAction} className="border-t pt-4">
            <input type="hidden" name="id" value={storeId} />
            <h3 className="font-bold text-sm mb-2">Manual Sync Trigger</h3>
            <p className="text-xs text-gray-500 mb-3">
                Push master profile data to all connected platforms.
            </p>
            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">
                Sync Now
            </button>
            {state?.success && <p className="text-green-600 text-xs mt-2">{state.success}</p>}
            {state?.error && <p className="text-red-500 text-xs mt-2">{state.error}</p>}
        </form>
    );
}