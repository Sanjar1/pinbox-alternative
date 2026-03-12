import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { logout } from './actions';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-600">Pinbox Alt</h1>
          <p className="text-xs text-gray-500">
            {user.email} ({user.role})
          </p>
        </div>
        <nav className="space-x-4 flex items-center">
          <Link href="/admin" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/admin/stores" className="hover:underline">
            Stores
          </Link>
          <form action={logout} className="inline">
            <button type="submit" className="text-gray-500 hover:text-red-500">
              Logout
            </button>
          </form>
        </nav>
      </header>
      <main className="flex-1 p-6 container mx-auto">{children}</main>
    </div>
  );
}
