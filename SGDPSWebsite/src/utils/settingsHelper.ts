export const DEFAULT_SPONSORSHIP_CATEGORIES = [
  'Sponsorship - Pratima',
  'Sponsorship - Decoration & Flowers',
  'Sponsorship - Bhog & Prasad',
  'Sponsorship - Bisarjan & Procession',
  'Sponsorship - Banners & Lighting',
  'Sponsorship - Rice & Groceries',
  'Stall / Food Court Collection',
  'Cultural & Stage Sponsor',
  'Mata Ki Chowki Donation',
  'Anandomela Stall',
  'Interest Earned',
  'Other Donation',
];

export const DEFAULT_BLOCKS = ['A-Block', 'B-Block', 'C-Block', 'D-Block'];

/**
 * Normalizes input block strings.
 * Examples:
 *  'h' -> 'H-Block'
 *  'H' -> 'H-Block'
 *  'h-block' -> 'H-Block'
 *  'block h' -> 'H-Block'
 *  'Tower-5' -> 'Tower-5'
 */
export const formatBlockName = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Single letter (e.g. 'e' -> 'E-Block')
  if (/^[a-zA-Z]$/.test(trimmed)) {
    return `${trimmed.toUpperCase()}-Block`;
  }

  // 'e-block' / 'E-block' / 'e block' -> 'E-Block'
  if (/^[a-zA-Z][-\s]?block$/i.test(trimmed)) {
    return `${trimmed.charAt(0).toUpperCase()}-Block`;
  }

  // 'block e' / 'Block E' -> 'E-Block'
  const blockLetterMatch = trimmed.match(/^block[-\s]?([a-zA-Z])$/i);
  if (blockLetterMatch) {
    return `${blockLetterMatch[1].toUpperCase()}-Block`;
  }

  return trimmed;
};

export const getActiveBlocks = (activeFlatsBlocks: string[] = []): string[] => {
  if (activeFlatsBlocks && activeFlatsBlocks.length > 0) {
    return Array.from(new Set(activeFlatsBlocks));
  }
  try {
    const saved = localStorage.getItem('sgdps_active_blocks');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_BLOCKS;
};

export const saveActiveBlocks = (blocks: string[]): void => {
  localStorage.setItem('sgdps_active_blocks', JSON.stringify(blocks));
  window.dispatchEvent(new Event('sgdps_settings_updated'));
};

export const getSponsorshipCategories = (): string[] => {
  try {
    const saved = localStorage.getItem('sgdps_sponsorship_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_SPONSORSHIP_CATEGORIES;
};

export const saveSponsorshipCategories = (categories: string[]): void => {
  localStorage.setItem('sgdps_sponsorship_categories', JSON.stringify(categories));
  window.dispatchEvent(new Event('sgdps_settings_updated'));
};

export const getDeletePin = (): string => {
  return localStorage.getItem('sgdps_delete_pin') || '2026';
};

export const saveDeletePin = (pin: string): void => {
  localStorage.setItem('sgdps_delete_pin', pin.trim() || '2026');
  window.dispatchEvent(new Event('sgdps_settings_updated'));
};

export const getGlobalFloorsPerBlock = (): number => {
  const val = parseInt(localStorage.getItem('sgdps_floors_per_block') || '9');
  return isNaN(val) || val <= 0 ? 9 : val;
};

export const saveGlobalFloorsPerBlock = (floors: number): void => {
  localStorage.setItem('sgdps_floors_per_block', String(floors > 0 ? floors : 9));
  window.dispatchEvent(new Event('sgdps_settings_updated'));
};

export const getGlobalFlatsPerFloor = (): number => {
  const val = parseInt(localStorage.getItem('sgdps_flats_per_floor') || '7');
  return isNaN(val) || val <= 0 ? 7 : val;
};

export const saveGlobalFlatsPerFloor = (flats: number): void => {
  localStorage.setItem('sgdps_flats_per_floor', String(flats > 0 ? flats : 7));
  window.dispatchEvent(new Event('sgdps_settings_updated'));
};
