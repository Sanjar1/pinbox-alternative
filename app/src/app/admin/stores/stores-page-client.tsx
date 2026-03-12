'use client';

import { useState } from 'react';
import Link from 'next/link';
import { runDiscoveryForAllStores } from './actions';
import type { Store, StoreMasterProfile, QRCode } from '@prisma/client';

type StoreWithData = Store & {
  masterProfile: StoreMasterProfile | null;
  qrCodes: QRCode[];
};

interface Props {
  stores: StoreWithData[];
  isOwner: boolean;
  storesWithLatLng: number;
  storesWithoutLatLng: number;
}

export default function StoresPageClient({
  stores,
  isOwner,
  storesWithLatLng,
  storesWithoutLatLng,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleRunDiscoveryForAll() {
    if (storesWithoutLatLng > 0) {
      setMessage({
        type: 'error',
        text: `Cannot run discovery: ${storesWithoutLatLng} store(s) missing lat/lng. Please add coordinates first.`,
      });
      return;
    }

    setLoading(true);
    try {
      const result = await runDiscoveryForAllStores();
      setMessage({
        type: 'success',
        text: `Discovery complete: ${result.processed} stores processed, ${result.failed} failed.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Stores</h2>
        <div className="flex gap-2">
          {isOwner && (
            <>
              {storesWithLatLng > 0 && (
                <button
                  onClick={handleRunDiscoveryForAll}
                  disabled={loading || storesWithoutLatLng > 0}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Running...' : 'Run Discovery for All'}
                </button>
              )}
              <Link
                href="/admin/stores/import"
                className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50"
              >
                Import CSV
              </Link>
              <Link
                href="/admin/stores/new"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Store
              </Link>
            </>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200 text-sm text-blue-900">
        <strong>Lat/Lng Status:</strong> {storesWithLatLng} stores ready for discovery, {storesWithoutLatLng} pending{' '}
        {storesWithoutLatLng > 0 && (
          <>
            (<Link href="/admin/stores/import" className="text-blue-600 underline">
              import CSV
            </Link>
            )
          </>
        )}
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Address</th>
              <th className="p-4">Coordinates</th>
              <th className="p-4">QR Link</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium">{store.name}</td>
                <td className="p-4 text-gray-500 text-sm">{store.address || '-'}</td>
                <td className="p-4 text-sm">
                  {store.masterProfile?.lat && store.masterProfile?.lng ? (
                    <span className="text-green-600">
                      ✓ {store.masterProfile.lat.toFixed(4)}, {store.masterProfile.lng.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-red-600">No coordinates</span>
                  )}
                </td>
                <td className="p-4">
                  {store.qrCodes[0] ? (
                    <a
                      href={`/${store.qrCodes[0].slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      /{store.qrCodes[0].slug}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">No QR</span>
                  )}
                </td>
                <td className="p-4">
                  <Link href={`/admin/stores/${store.id}`} className="text-blue-600 hover:underline mr-4">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No stores found. Create one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
