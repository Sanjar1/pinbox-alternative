export enum Platform {
  GOOGLE = 'GOOGLE',
  YANDEX = 'YANDEX',
  TWOGIS = 'TWOGIS'
}

export enum SyncCapability {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export enum ConnectorMode {
  FULL_AUTO = 'FULL_AUTO',
  SEMI_AUTO = 'SEMI_AUTO', // Read supported, write returns instructions
  MANUAL = 'MANUAL' // No API, manual links only
}

export interface CapabilityMatrix {
  platform: Platform;
  mode: ConnectorMode;
  fields: {
    [key: string]: SyncCapability[]; // e.g. 'name': [READ, UPDATE]
  };
}

export interface LocationCandidate {
  platform: Platform;
  externalId: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  distanceMeters?: number;
  url?: string;
  confidence: number;
  rawData?: unknown;
}

export interface StoreSyncData {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  hours?: string;
  description?: string;
  website?: string;
  photos?: { url: string; type: string }[];
}

export interface IConnector {
  getCapabilities(): CapabilityMatrix;
  
  search(lat: number, lng: number, name: string, phone?: string): Promise<LocationCandidate[]>;
  
  getLocation(externalId: string): Promise<StoreSyncData | null>;
  
  createLocation(data: StoreSyncData): Promise<{ externalId: string; url: string; status: string }>;
  
  updateLocation(externalId: string, data: StoreSyncData): Promise<{ status: string; appliedChanges: string[] }>;
}