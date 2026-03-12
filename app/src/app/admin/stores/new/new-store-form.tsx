'use client';

import { createStore } from './actions';
import { useActionState } from 'react';
import type { ActionState } from '@/lib/action-state';

export function NewStoreForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createStore, {});

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow">
      <h2 className="text-xl font-bold mb-6">Add New Store</h2>
      <form action={formAction}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Store Name</label>
          <input name="name" required className="w-full border p-2 rounded" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Address</label>
          <input name="address" className="w-full border p-2 rounded" />
        </div>

        <h3 className="font-bold mt-6 mb-2">Review Links</h3>
        <div className="mb-2">
          <label className="block text-sm text-gray-600 mb-1">Google Maps URL</label>
          <input name="googleUrl" className="w-full border p-2 rounded" placeholder="https://g.page/..." />
        </div>
        <div className="mb-2">
          <label className="block text-sm text-gray-600 mb-1">Yandex Maps URL</label>
          <input name="yandexUrl" className="w-full border p-2 rounded" placeholder="https://yandex.ru/maps/..." />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">2GIS URL</label>
          <input name="twogisUrl" className="w-full border p-2 rounded" placeholder="https://2gis.ru/..." />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded mt-4">
          Create Store
        </button>
        {state.error && <p className="text-red-500 mt-2">{state.error}</p>}
      </form>
    </div>
  );
}

