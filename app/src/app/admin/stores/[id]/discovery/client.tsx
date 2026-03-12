'use client';

import { triggerDiscovery, acceptCandidate } from './actions';
import { useState } from 'react';
import type { Store, MatchCandidate, PlatformLocationLink } from '@prisma/client';

type StoreWithData = Store & {
  matchCandidates: MatchCandidate[];
  locationLinks: PlatformLocationLink[];
};

export default function DiscoveryClient({ store }: { store: StoreWithData }) {
  const [loading, setLoading] = useState(false);
  
  async function handleRunDiscovery() {
    setLoading(true);
    await triggerDiscovery(store.id);
    setLoading(false);
  }

  async function handleAccept(candidateId: string) {
    setLoading(true);
    await acceptCandidate(store.id, candidateId);
    setLoading(false);
  }

  const platforms = ['GOOGLE', 'YANDEX', 'TWOGIS'];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Discovery & Linking: {store.name}</h2>
        <button 
            onClick={handleRunDiscovery}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
            {loading ? 'Running...' : 'Run Discovery Now'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {platforms.map(platform => {
            const link = store.locationLinks.find(l => l.platform === platform);
            const candidates = store.matchCandidates.filter(c => c.platform === platform);
            
            return (
                <div key={platform} className="bg-white rounded shadow p-4 border-t-4 border-gray-200">
                    <h3 className="font-bold text-lg mb-2">{platform}</h3>
                    
                    {link ? (
                        <div className="bg-green-50 p-3 rounded mb-4 border border-green-200">
                            <p className="text-green-800 font-bold text-sm">✅ Linked</p>
                            <p className="text-xs break-all mt-1">{link.url}</p>
                            <p className="text-xs text-gray-500 mt-1">ID: {link.externalId}</p>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-3 rounded mb-4 text-sm text-gray-500">
                            Not linked yet.
                        </div>
                    )}

                    <h4 className="font-semibold text-sm mb-2 text-gray-600">Candidates Found: {candidates.length}</h4>
                    <div className="space-y-3">
                        {candidates.map(cand => (
                            <div key={cand.id} className="border rounded p-3 text-sm hover:shadow-md transition">
                                <p className="font-bold">{cand.name}</p>
                                <p className="text-gray-500 text-xs">{cand.address}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${cand.score > 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        Conf: {Math.round(cand.score * 100)}%
                                    </span>
                                    {!link && (
                                        <button 
                                            onClick={() => handleAccept(cand.id)}
                                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 text-xs"
                                        >
                                            Link This
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {candidates.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No pending candidates.</p>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
