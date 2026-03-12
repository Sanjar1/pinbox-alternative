import { IConnector, CapabilityMatrix, Platform, ConnectorMode, SyncCapability, LocationCandidate, StoreSyncData } from './types';

export class GoogleConnector implements IConnector {
  getCapabilities(): CapabilityMatrix {
    return {
      platform: Platform.GOOGLE,
      mode: ConnectorMode.FULL_AUTO,
      fields: {
        name: [SyncCapability.READ, SyncCapability.UPDATE],
        address: [SyncCapability.READ, SyncCapability.UPDATE],
        phone: [SyncCapability.READ, SyncCapability.UPDATE],
        hours: [SyncCapability.READ, SyncCapability.UPDATE],
        website: [SyncCapability.READ, SyncCapability.UPDATE],
        lat: [SyncCapability.READ], // Can't move pin easily via API usually
        lng: [SyncCapability.READ],
      }
    };
  }

  async search(lat: number, lng: number, name: string, phone?: string): Promise<LocationCandidate[]> {
    // Simulation: Return a mock candidate if name is similar
    console.log(`[Google] Searching at ${lat},${lng} for ${name} (Phone: ${phone})`);
    return [
      {
        platform: Platform.GOOGLE,
        externalId: 'google-place-123',
        name: name + ' (Google)',
        address: '123 Main St',
        lat: lat + 0.0001,
        lng: lng + 0.0001,
        distanceMeters: 15,
        confidence: 0.95,
        url: 'https://google.com/maps/place/123',
        rawData: { placeId: 'google-place-123' }
      }
    ];
  }

  async getLocation(externalId: string): Promise<StoreSyncData | null> {
    if (!externalId) return null;
    return {
      name: 'Demo Store 1 (Google)',
      address: '123 Main St',
      phone: '+79991234567',
      website: 'https://demo.com'
    };
  }

  async createLocation(data: StoreSyncData): Promise<{ externalId: string; url: string; status: string }> {
    // Simulate "Unverified" creation
    console.log('Creating Google Location', data);
    return {
      externalId: 'google-new-456',
      url: 'https://business.google.com/edit/l/456',
      status: 'PENDING_VERIFICATION'
    };
  }

  async updateLocation(externalId: string, data: StoreSyncData): Promise<{ status: string; appliedChanges: string[] }> {
    console.log(`[Google] Updating ${externalId}`, data);
    return {
      status: 'SYNCED',
      appliedChanges: Object.keys(data)
    };
  }
}