import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { storeWhereForUser } from '@/lib/store-access';

export default async function AdminDashboard() {
  const user = await requireCurrentUser();
  const storeWhere = storeWhereForUser(user);

  const stores = await prisma.store.findMany({
    where: storeWhere,
    select: {
      id: true,
      name: true,
      locationLinks: {
        select: {
          platform: true,
          syncStatus: true,
          url: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const storeCount = stores.length;
  const feedbackCount = await prisma.feedback.count({
    where: {
      store: storeWhere,
    },
  });
  const totalScans = await prisma.qRCode.aggregate({
    where: { store: storeWhere },
    _sum: { scans: true },
  });

  const coverage = {
    GOOGLE: { total: 0, connected: 0 },
    YANDEX: { total: 0, connected: 0 },
    TWOGIS: { total: 0, connected: 0 },
  };
  const missingByPlatform: Record<'GOOGLE' | 'YANDEX' | 'TWOGIS', string[]> = {
    GOOGLE: [],
    YANDEX: [],
    TWOGIS: [],
  };

  for (const store of stores) {
    const checkPlatform = (platform: 'GOOGLE' | 'YANDEX' | 'TWOGIS') => {
      const link = store.locationLinks.find((l) => l.platform === platform);
      if (link && link.syncStatus !== 'DISCONNECTED') {
         coverage[platform].total += 1;
         coverage[platform].connected += 1;
      } else if (link && link.url) {
         // Has URL but disconnected status (maybe manual link)
         coverage[platform].total += 1;
      } else {
         missingByPlatform[platform].push(store.name);
      }
    };
    
    checkPlatform('GOOGLE');
    checkPlatform('YANDEX');
    checkPlatform('TWOGIS');
  }

  const percent = (value: number) =>
    storeCount === 0 ? 0 : Math.round((value / storeCount) * 100);

  const platformMeta: Array<{ key: 'GOOGLE' | 'YANDEX' | 'TWOGIS'; label: string }> = [
    { key: 'GOOGLE', label: 'Google Maps' },
    { key: 'YANDEX', label: 'Yandex Maps' },
    { key: 'TWOGIS', label: '2GIS' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-500 text-sm">Total Stores</h3>
          <p className="text-3xl font-bold">{storeCount}</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-500 text-sm">Total Scans</h3>
          <p className="text-3xl font-bold">{totalScans._sum.scans || 0}</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-500 text-sm">Feedback Received</h3>
          <p className="text-3xl font-bold">{feedbackCount}</p>
        </div>
      </div>

      <section className="mt-8">
        <h3 className="text-xl font-bold mb-4">Platform Coverage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platformMeta.map((platform) => (
            <div key={platform.key} className="bg-white p-6 rounded shadow">
              <h4 className="text-gray-500 text-sm">{platform.label}</h4>
              <p className="text-3xl font-bold mt-1">
                {coverage[platform.key].total}/{storeCount}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {percent(coverage[platform.key].total)}% linked
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-xl font-bold mb-4">Missing Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platformMeta.map((platform) => (
            <div key={platform.key} className="bg-white rounded shadow p-6">
              <h4 className="font-semibold mb-3">{platform.label}</h4>
              {missingByPlatform[platform.key].length === 0 ? (
                <p className="text-green-600 text-sm">All stores linked</p>
              ) : (
                <ul className="text-sm text-gray-700 space-y-1">
                  {missingByPlatform[platform.key].slice(0, 12).map((storeName) => (
                    <li key={`${platform.key}-${storeName}`}>- {storeName}</li>
                  ))}
                  {missingByPlatform[platform.key].length > 12 && (
                    <li className="text-gray-500">
                      +{missingByPlatform[platform.key].length - 12} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}