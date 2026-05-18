import { BRANDS_DATA, getBrandIdByStoreName, getStoreDisplayName as getRuntimeStoreDisplayName, getVotingTitle as getRuntimeVotingTitle } from './brands.runtime.mjs';

export type BrandConfig = {
  id: string;
  primary: string;
  votingPrimary?: string;
  dark: string;
  light: string;
  votingLight?: string;
  votingBorder?: string;
  title: string;
  sub: string;
};

export const BRANDS: Record<string, BrandConfig> = BRANDS_DATA;

export function getBrandByStoreName(name: string): BrandConfig {
  return BRANDS[getBrandIdByStoreName(name)];
}

export function getStoreDisplayName(name: string, brandId: string): string {
  return getRuntimeStoreDisplayName(name, brandId);
}

export function getVotingTitle(brand: BrandConfig, storeName: string): string {
  return getRuntimeVotingTitle(brand, storeName);
}
