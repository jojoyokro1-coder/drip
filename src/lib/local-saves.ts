const SAVES_KEY = 'drip_saves';
const SAVES_DATA_KEY = 'drip_saves_data';

export function getLocalSaves(): string[] {
  try {
    const stored = localStorage.getItem(SAVES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isLocalSaved(lookId: string): boolean {
  return getLocalSaves().includes(lookId);
}

export function toggleLocalSave(lookId: string, lookData?: { image_url: string; description?: string }): boolean {
  const saves = getLocalSaves();
  const idx = saves.indexOf(lookId);
  if (idx >= 0) {
    saves.splice(idx, 1);
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
    const dataStore = getLocalSavesData();
    delete dataStore[lookId];
    localStorage.setItem(SAVES_DATA_KEY, JSON.stringify(dataStore));
    return false;
  } else {
    saves.push(lookId);
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
    if (lookData) {
      const dataStore = getLocalSavesData();
      dataStore[lookId] = lookData;
      localStorage.setItem(SAVES_DATA_KEY, JSON.stringify(dataStore));
    }
    return true;
  }
}

export function getLocalSavesData(): Record<string, { image_url: string; description?: string }> {
  try {
    const stored = localStorage.getItem(SAVES_DATA_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getLocalSavedLooks(): { id: string; image_url: string; description?: string }[] {
  const saves = getLocalSaves();
  const data = getLocalSavesData();
  return saves.map(id => ({ id, ...(data[id] || { image_url: '' }) }));
}

export function getLocalSavedCount(): number {
  return getLocalSaves().length;
}
