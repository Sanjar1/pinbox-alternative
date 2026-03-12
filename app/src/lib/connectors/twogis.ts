import { IConnector, CapabilityMatrix, Platform, ConnectorMode, SyncCapability, LocationCandidate, StoreSyncData } from './types';

export class TwoGisConnector implements IConnector {
  getCapabilities(): CapabilityMatrix {
    return {
      platform: Platform.TWOGIS,
      mode: ConnectorMode.MANUAL,
      fields: {
        name: [SyncCapability.READ], // Even read might be scraping or limited API
      }
    };
  }

  async search(lat: number, lng: number, name: string, phone?: string): Promise<LocationCandidate[]> {
    console.log(`[2GIS] Searching at ${lat},${lng} for ${name} (Phone: ${phone})`);
    return []; // Simulate no match found
  }

  async getLocation(externalId: string): Promise<StoreSyncData | null> {
    if (!externalId) return null;
    return null;
  }

  async createLocation(data: StoreSyncData): Promise<{ externalId: string; url: string; status: string }> {
     console.log('2GIS Create requested', data);
    throw new Error('2GIS requires manual creation.');
  }

  async updateLocation(externalId: string, data: StoreSyncData): Promise<{ status: string; appliedChanges: string[] }> {
    console.log(`[2GIS] Update requested for ${externalId}`, data);
    throw new Error('2GIS requires manual update.');
  }
}