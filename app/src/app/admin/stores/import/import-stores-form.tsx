'use client';

import { useActionState } from 'react';
import { importStores } from './actions';
import type { ActionState } from '@/lib/action-state';

export function ImportStoresForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(importStores, {});

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Import Stores from CSV</h2>
      <p className="text-sm text-gray-600 mb-4">
        CSV columns: <code>name,address,lat,lng,googleUrl,yandexUrl,twogisUrl</code>
      </p>
      <p className="text-xs text-gray-500 mb-4">
        <strong>Required:</strong> <code>name</code> <br />
        <strong>Optional:</strong> <code>address, lat, lng</code> (decimal format, e.g., 41.2995, 69.2401) <br />
        <strong>Auto-generated:</strong> Missing platform links are generated from store name/address.
      </p>
      <a href="/stores-template.csv" className="text-sm text-blue-600 underline">
        Download template CSV
      </a>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">CSV File</label>
          <input
            type="file"
            name="csvFile"
            accept=".csv,text/csv"
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Import Mode</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="create-only"
                defaultChecked
                className="mr-2"
              />
              <span className="text-sm">Create new stores only (skip existing)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="create-and-update"
                className="mr-2"
              />
              <span className="text-sm">Create new &amp; update existing stores (by name match)</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use "Create &amp; Update" to add lat/lng to existing stores.
          </p>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Import Stores
        </button>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
