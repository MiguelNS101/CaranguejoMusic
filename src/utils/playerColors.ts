/**
 * Player color management for Discord Chat Reader
 */

export const DEFAULT_PLAYER_PALETTE = [
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#F97316'  // Orange
];

/**
 * Validates whether a given string is a valid 3, 6, or 8-digit hexadecimal color code.
 */
export function isValidHexColor(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex.trim());
}

/**
 * Returns a consistent hash-based color from the default palette given an author username or ID.
 */
export function getDeterministicPlayerColor(authorIdentifier: string): string {
  if (!authorIdentifier) return DEFAULT_PLAYER_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < authorIdentifier.length; i++) {
    hash = (hash << 5) - hash + authorIdentifier.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DEFAULT_PLAYER_PALETTE.length;
  return DEFAULT_PLAYER_PALETTE[index];
}

/**
 * Resolves player color from user-customized map, or falls back to deterministic palette.
 */
export function resolvePlayerColor(
  authorIdentifier: string,
  customColorMap: Record<string, string>
): string {
  if (customColorMap && customColorMap[authorIdentifier] && isValidHexColor(customColorMap[authorIdentifier])) {
    return customColorMap[authorIdentifier];
  }
  return getDeterministicPlayerColor(authorIdentifier);
}
