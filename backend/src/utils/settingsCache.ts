import mongoose from 'mongoose';
import { SETTINGS_SINGLETON_ID, ISettings } from '../models/Settings';

/**
 * In-memory Settings cache - same rationale as leaderboardCache.ts: Settings
 * gets read on nearly every CSR/Challenge approval, every Employee save
 * (badge engine), and every carbon transaction - we don't want a DB
 * round-trip on every single one of those. Refreshed whenever an Admin
 * updates settings via PUT /api/settings.
 *
 * Uses `mongoose.model('Settings')` dynamically to avoid a circular import
 * with models/Settings.ts (which doesn't need to import this file back, but
 * keeping the same dynamic-lookup convention as the rest of the codebase for
 * consistency).
 */
let cache: ISettings | null = null;

export async function getSettings(): Promise<ISettings> {
  if (cache) return cache;

  const Settings = mongoose.model('Settings');
  let doc = await Settings.findById(SETTINGS_SINGLETON_ID);

  if (!doc) {
    // First boot - lazily create the singleton with schema defaults.
    doc = await Settings.create({ _id: SETTINGS_SINGLETON_ID });
  }

  cache = doc as unknown as ISettings;
  return cache;
}

export function refreshSettingsCache(updated: ISettings): void {
  cache = updated;
}

export function clearSettingsCache(): void {
  cache = null;
}
