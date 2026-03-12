import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Pinbox Alternative</h1>
        <p className="text-slate-600 mb-6">
          Manage multi-location review links across Google, Yandex, and 2GIS with compliant QR
          feedback collection.
        </p>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Open Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
