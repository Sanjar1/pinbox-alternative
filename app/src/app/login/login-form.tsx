'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/action-state';
import { login } from './actions';

export default function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(login, {});

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form action={formAction} className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Sign In
        </button>
        {state?.error && <p className="text-red-500 mt-2">{state.error}</p>}
      </form>
    </div>
  );
}
