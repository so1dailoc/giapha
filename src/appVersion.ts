/**
 * Build identity used for stale-browser recovery.
 * Bump this value whenever a production bundle changes. It intentionally does
 * not live in localStorage so an old bundle can detect a newer deployment.
 */
export const APP_VERSION = '1.0.0-v20';

export const LEGACY_STORAGE_PREFIXES = [
  'gia-pha-tree-positions-v13:',
  'gia-pha-tree-positions-v14:',
  'gia-pha-tree-positions-v15:',
  'gia-pha-tree-positions-v16:',
  'gia-pha-tree-positions-v17:',
  'gia-pha-tree-positions-v18:',
  'gia-pha-tree-positions-v19:',
];
