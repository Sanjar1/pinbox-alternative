// Real implementation using Google Business Profile API
import { IConnector, CapabilityMatrix, Platform, ConnectorMode, SyncCapability, LocationCandidate, StoreSyncData } from '../types';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GBPLocation {
  name: string;
  title?: string;
  phoneNumbers?: string[];
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  latlng?: {
    latitude: number;
    longitude: number;
  };
  websiteUri?: string;
  regularHours?: {
    openingHours?: {
      day?: string;
      openTime?: { hours: number; minutes: number };
      closeTime?: { hours: number; minutes: number };
    }[];
  };
}

export class GoogleConnectorReal implements IConnector {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private accountName: string | null = null;

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
        lat: [SyncCapability.READ],
        lng: [SyncCapability.READ],
      }
    };
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5-minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.accessToken;
    }

    const clientId = process.env.GOOGLE_BP_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_BP_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_BP_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing Google Business Profile credentials in environment');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json() as TokenResponse & { error?: string };

    if (!tokenRes.ok || !tokenData.access_token) {
      // Check for quota error
      if (tokenRes.status === 429 || (tokenData as any)?.error?.includes?.('quota')) {
        throw new Error('GBP_QUOTA_PENDING');
      }
      throw new Error(`Failed to get access token: ${tokenData.error || 'Unknown error'}`);
    }

    this.accessToken = tokenData.access_token;
    this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);

    return this.accessToken;
  }

  private async getAccountName(): Promise<string> {
    if (this.accountName) return this.accountName;

    const accessToken = await this.getAccessToken();
    const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const accountsData = await accountsRes.json() as { accounts?: { name: string }[] };

    if (!accountsRes.ok || !accountsData.accounts?.length) {
      throw new Error('Failed to fetch accounts from Google Business Profile');
    }

    this.accountName = accountsData.accounts[0].name;
    return this.accountName;
  }

  private degreesToKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async search(lat: number, lng: number, name: string, _phone?: string): Promise<LocationCandidate[]> {
    try {
      const accessToken = await this.getAccessToken();
      const accountName = await this.getAccountName();

      const locRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,latlng,phoneNumbers`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const locData = await locRes.json() as { locations?: GBPLocation[] };

      if (!locRes.ok || !locData.locations) {
        return [];
      }

      // Filter and score candidates
      const candidates: LocationCandidate[] = locData.locations
        .map(loc => {
          const locLat = loc.latlng?.latitude || 0;
          const locLng = loc.latlng?.longitude || 0;
          const distanceKm = this.degreesToKm(lat, lng, locLat, locLng);

          // Name similarity: check if location name includes search name (case-insensitive)
          const locNameNorm = (loc.title || '').toLowerCase();
          const searchNameNorm = name.toLowerCase();
          const nameMatch = locNameNorm.includes(searchNameNorm) || searchNameNorm.includes(locNameNorm) ? 1 : 0;

          // Distance score: 1 at 0km, 0 at 5km
          const distanceScore = Math.max(0, 1 - distanceKm / 5);

          // Combined score: 50% name, 50% distance
          const confidence = nameMatch * 0.5 + distanceScore * 0.5;

          return {
            platform: Platform.GOOGLE,
            externalId: loc.name,
            name: loc.title || loc.name,
            address: loc.storefrontAddress?.addressLines?.[0] || '',
            lat: locLat,
            lng: locLng,
            phone: loc.phoneNumbers?.[0] || '',
            distanceMeters: Math.round(distanceKm * 1000),
            url: `https://business.google.com/u/0/manage/search?q=${encodeURIComponent(name)}`,
            confidence,
            rawData: loc,
          };
        })
        .filter(c => c.confidence > 0.3) // Only return candidates above 30% confidence
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Return top 5

      return candidates;
    } catch (error) {
      if ((error as Error).message === 'GBP_QUOTA_PENDING') {
        console.warn('[Google] Quota pending - returning empty results');
        return [];
      }
      console.error('[Google] Search error:', error);
      return [];
    }
  }

  async getLocation(externalId: string): Promise<StoreSyncData | null> {
    try {
      const accessToken = await this.getAccessToken();

      const locRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${externalId}?readMask=name,title,phoneNumbers,storefrontAddress,websiteUri,regularHours,latlng`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!locRes.ok) {
        return null;
      }

      const loc = await locRes.json() as GBPLocation;

      // Build hours string from regularHours
      let hours = '';
      if (loc.regularHours?.openingHours) {
        hours = loc.regularHours.openingHours
          .map(h => {
            const day = h.day || 'Unknown';
            const open = `${h.openTime?.hours || 0}:${String(h.openTime?.minutes || 0).padStart(2, '0')}`;
            const close = `${h.closeTime?.hours || 0}:${String(h.closeTime?.minutes || 0).padStart(2, '0')}`;
            return `${day} ${open}-${close}`;
          })
          .join('; ');
      }

      return {
        name: loc.title || '',
        address: loc.storefrontAddress?.addressLines?.[0] || '',
        phone: loc.phoneNumbers?.[0] || '',
        hours: hours || undefined,
        website: loc.websiteUri || undefined,
        lat: loc.latlng?.latitude || undefined,
        lng: loc.latlng?.longitude || undefined,
      };
    } catch (error) {
      if ((error as Error).message === 'GBP_QUOTA_PENDING') {
        console.warn('[Google] Quota pending');
        return null;
      }
      console.error('[Google] getLocation error:', error);
      return null;
    }
  }

  async createLocation(_data: StoreSyncData): Promise<{ externalId: string; url: string; status: string }> {
    // GBP API does not support creating locations via API - must be done via Google My Business
    return { externalId: '', url: '', status: 'FAILED: Creation not supported via API' };
  }

  async updateLocation(externalId: string, data: StoreSyncData): Promise<{ status: string; appliedChanges: string[] }> {
    try {
      const accessToken = await this.getAccessToken();

      // Build updateMask from provided fields
      const updateMask: string[] = [];
      const requestBody: Record<string, unknown> = {};

      if (data.name !== undefined) {
        updateMask.push('title');
        requestBody['title'] = data.name;
      }
      if (data.address !== undefined) {
        updateMask.push('storefrontAddress.addressLines');
        if (!requestBody['storefrontAddress']) requestBody['storefrontAddress'] = {};
        (requestBody['storefrontAddress'] as any).addressLines = [data.address];
      }
      if (data.phone !== undefined) {
        updateMask.push('phoneNumbers');
        requestBody['phoneNumbers'] = [data.phone];
      }
      if (data.website !== undefined) {
        updateMask.push('websiteUri');
        requestBody['websiteUri'] = data.website;
      }

      if (updateMask.length === 0) {
        return { status: 'SYNCED', appliedChanges: [] };
      }

      const patchRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${externalId}?updateMask=${updateMask.join(',')}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!patchRes.ok) {
        const error = await patchRes.json();
        console.error('[Google] Update error:', error);
        return { status: 'FAILED', appliedChanges: [] };
      }

      return { status: 'SYNCED', appliedChanges: updateMask };
    } catch (error) {
      if ((error as Error).message === 'GBP_QUOTA_PENDING') {
        return { status: 'QUOTA_PENDING', appliedChanges: [] };
      }
      console.error('[Google] updateLocation error:', error);
      return { status: 'FAILED', appliedChanges: [] };
    }
  }
}
