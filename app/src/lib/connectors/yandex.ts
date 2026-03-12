import { IConnector, CapabilityMatrix, Platform, ConnectorMode, SyncCapability, LocationCandidate, StoreSyncData } from './types';

export class YandexConnector implements IConnector {
  getCapabilities(): CapabilityMatrix {
    return {
      platform: Platform.YANDEX,
      mode: ConnectorMode.SEMI_AUTO, // Write via support/partner API usually restricted
      fields: {
        name: [SyncCapability.READ],
        address: [SyncCapability.READ],
        phone: [SyncCapability.READ],
        hours: [SyncCapability.READ],
        website: [SyncCapability.READ],
      }
    };
  }

  async search(lat: number, lng: number, name: string, phone?: string): Promise<LocationCandidate[]> {
    console.log(`[Yandex] Searching at ${lat},${lng} for ${name} (Phone: ${phone})`);

    // Mock candidates with realistic Cyrillic store names from Сырная Лавка network
    const mockStores = [
      {
        name: 'Сырная Лавка - Фархадский',
        address: 'ул. Фархадская, 1, Ташкент',
        lat: 41.2997,
        lng: 69.2395,
      },
      {
        name: 'Сырная Лавка - Авиасозлар',
        address: 'Авиасозлар кучаси, Ташкент',
        lat: 41.3156,
        lng: 69.2437,
      },
      {
        name: 'Сырная Лавка - Алайский базар',
        address: 'Алайский базар, Ташкент',
        lat: 41.3245,
        lng: 69.2482,
      },
    ];

    // Return candidates near the search location
    return mockStores.map((store, idx) => ({
      platform: Platform.YANDEX,
      externalId: `yandex-org-${2605231525 + idx}`,
      name: store.name,
      address: store.address,
      lat: store.lat,
      lng: store.lng,
      distanceMeters: Math.abs(store.lat - lat) * 111000, // Approximate meters per degree
      confidence: 0.85 - idx * 0.05,
      url: `https://yandex.ru/maps/org/${2605231525 + idx}`,
      rawData: { id: `${2605231525 + idx}` }
    }));
  }

  async getLocation(externalId: string): Promise<StoreSyncData | null> {
    if (!externalId) return null;
    return {
      name: 'Demo Store 1 (Yandex)',
      address: '123 Main St',
      phone: '+79991234567',
    };
  }

  async createLocation(data: StoreSyncData): Promise<{ externalId: string; url: string; status: string }> {
    // Semi-auto: return instructions
    console.log('Requesting creation for', data);
    throw new Error('Yandex creation requires manual step. Please use the Manual Link tool.');
  }

  async updateLocation(externalId: string, data: StoreSyncData): Promise<{ status: string; appliedChanges: string[] }> {
    // Semi-auto: we might submit a "suggestion" but can't guarantee sync
    console.log(`[Yandex] Submitting suggestion for ${externalId}`, data);
    return {
      status: 'PENDING_MODERATION',
      appliedChanges: []
    };
  }
}