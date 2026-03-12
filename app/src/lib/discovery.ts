import { prisma } from '@/lib/db';
import { GoogleConnectorReal } from '@/lib/connectors/impl/google-real';
import { YandexConnector } from '@/lib/connectors/yandex';
import { TwoGisConnector } from '@/lib/connectors/twogis';
import { Platform } from '@/lib/connectors/types';

const connectors = {
  [Platform.GOOGLE]: new GoogleConnectorReal(),
  [Platform.YANDEX]: new YandexConnector(),
  [Platform.TWOGIS]: new TwoGisConnector(),
};

export async function runDiscoveryForStore(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { masterProfile: true },
  });

  if (!store || !store.masterProfile) {
    throw new Error('Store or Master Profile not found');
  }

  const { lat, lng, name, phone } = store.masterProfile;

  if (!lat || !lng) {
    throw new Error('Master profile missing lat/lng. Please update Master Profile first.');
  }

  const platforms = [Platform.GOOGLE, Platform.YANDEX, Platform.TWOGIS];
  
  for (const platform of platforms) {
    const connector = connectors[platform];
    try {
      const candidates = await connector.search(lat, lng, name || store.name, phone || undefined);
      
      // Clear old pending candidates for this platform
      await prisma.matchCandidate.deleteMany({
          where: { storeId, platform, status: 'PENDING' }
      });

      for (const cand of candidates) {
          await prisma.matchCandidate.create({
              data: {
                  storeId,
                  platform,
                  externalId: cand.externalId,
                  name: cand.name,
                  address: cand.address,
                  lat: cand.lat,
                  lng: cand.lng,
                  distanceMeters: cand.distanceMeters,
                  score: cand.confidence,
                  // url: cand.url, // Model doesn't have URL field in MatchCandidate in my previous schema? Let me check.
                  matchData: JSON.stringify({ url: cand.url, ...(cand.rawData as object) }),
                  status: 'PENDING'
              }
          });
      }
    } catch (e) {
      console.error(`Discovery failed for ${platform}`, e);
      // Log error but continue
    }
  }
}
