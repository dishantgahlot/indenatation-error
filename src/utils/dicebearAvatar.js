// DiceBear Anime Avatar System - Generates consistent avatars from user ID
// No paid dependencies - uses free DiceBear API

/**
 * Available DiceBear styles suitable for anime/character avatars
 * Each style produces a distinct visual aesthetic
 */
export const DICEBEAR_STYLES = {
  // Anime-style avatars
  anime: 'avataaars',      // Clean, customizable anime-style (closest to anime)
  lorelei: 'lorelei',      // Beautiful hand-drawn style with anime vibes
  adventurer: 'adventurer', // RPG character style

  // Other distinct styles for variety
  bottts: 'bottts',        // Robot/tech style
  personas: 'personas',    // Minimal geometric style
  initials: 'initials',    // Text-based fallback
};

/**
 * Style configurations for each archetype category
 * Maps character categories to DiceBear styles and customization options
 */
export const CATEGORY_STYLE_MAP = {
  explorer: {
    primaryStyle: 'avataaars',
    secondaryStyle: 'lorelei',
    backgroundColors: ['ffd5dc', 'ffdfbf', 'b6e3f4', 'c0aede'],
    accessories: ['round', 'wayfarers', 'prescription01', 'prescription02'],
    hairColors: ['2C1B18', '4A3728', '6B4423', '8B5A2B', '1A1A1A'],
    skinTones: ['F8D5C2', 'E8C4A0', 'D4A57A', 'C68E5E', '8D6B4A'],
  },
  scholar: {
    primaryStyle: 'avataaars',
    secondaryStyle: 'bottts',
    backgroundColors: ['d1d4f9', 'c0aede', 'e0e7ff', 'f3f4f6'],
    accessories: ['prescription01', 'prescription02', 'round', 'wayfarers'],
    hairColors: ['1A1A1A', '2C1B18', '4A3728', '3D2B1F', '5C4A3A'],
    skinTones: ['F8D5C2', 'E8C4A0', 'D4A57A', 'FFF5E6', 'F0E6D6'],
  },
  tech: {
    primaryStyle: 'bottts',
    secondaryStyle: 'avataaars',
    backgroundColors: ['d1d4f9', 'e0e7ff', 'c0aede', 'f3f4f6'],
    accessories: ['prescription01', 'prescription02'],
    hairColors: ['0D1117', '1F2937', '374151', '4B5563'],
    skinTones: ['F8D5C2', 'E8C4A0', 'D4A57A', 'A8927E'],
  },
  cosmic: {
    primaryStyle: 'lorelei',
    secondaryStyle: 'avataaars',
    backgroundColors: ['ffdfbf', 'b6e3f4', 'c0aede', 'd1d4f9', 'fce7f3'],
    accessories: ['flower', 'prescription01', 'round'],
    hairColors: ['8B5CF6', 'A855F7', 'D946EF', 'EC4899', 'F472B6', '1A1A1A'],
    skinTones: ['F8D5C2', 'FFF5E6', 'FCE7F3', 'F3E8FF', 'E8D5F2'],
  },
  athletic: {
    primaryStyle: 'adventurer',
    secondaryStyle: 'avataaars',
    backgroundColors: ['ffb8b8', 'ffd5dc', 'ffdfbf', 'fef3c7', 'd1fae5'],
    accessories: ['prescription01', 'prescription02'],
    hairColors: ['1A1A1A', '2C1B18', '4A3728', '7C2D12', '9A3412'],
    skinTones: ['F8D5C2', 'E8C4A0', 'D4A57A', 'C68E5E', 'A8927E'],
  },
  default: {
    primaryStyle: 'avataaars',
    secondaryStyle: 'lorelei',
    backgroundColors: ['ffd5dc', 'ffdfbf', 'b6e3f4', 'c0aede'],
    accessories: ['round', 'prescription01'],
    hairColors: ['2C1B18', '4A3728', '6B4423'],
    skinTones: ['F8D5C2', 'E8C4A0', 'D4A57A'],
  },
};

/**
 * Generates a consistent seed from user ID
 * Ensures the same user always gets the same avatar
 */
export function generateSeed(userId, suffix = '') {
  if (!userId) return 'default-user';
  // Create a deterministic seed from user ID
  const str = `${userId}${suffix}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `user_${Math.abs(hash).toString(36)}${suffix}`;
}

/**
 * Gets style configuration for a category
 */
export function getStyleConfig(category) {
  return CATEGORY_STYLE_MAP[category] || CATEGORY_STYLE_MAP.default;
}

/**
 * Generates DiceBear avatar URL with consistent parameters
 * @param {Object} options - Avatar generation options
 * @param {string} options.userId - User ID for consistent seeding
 * @param {string} options.category - Character category (explorer, scholar, tech, cosmic, athletic)
 * @param {string} options.variant - 'current' (unchanged/Future A) or 'improved' (Future B)
 * @param {string} options.style - Override style (optional)
 * @param {number} options.size - Avatar size in pixels (default: 512)
 * @param {string} options.format - 'svg' or 'png' (default: 'svg')
 * @returns {string} DiceBear API URL
 */
export function generateAvatarUrl({
  userId,
  category = 'explorer',
  variant = 'current',
  style,
  size = 512,
  format = 'svg'
}) {
  const config = getStyleConfig(category);
  const selectedStyle = style || config.primaryStyle;

  // Use distinct deterministic seeds for current vs improved variants
  const seedSuffix = variant === 'improved' ? '_radiant_future' : '_current_habits';
  const seed = generateSeed(userId, seedSuffix);

  // Build clean URL parameters strictly valid across all DiceBear 7.x styles
  const params = new URLSearchParams();
  params.set('seed', seed);
  params.set('size', size.toString());

  // Safe background color selection
  if (config.backgroundColors && config.backgroundColors.length > 0) {
    const bgIndex = variant === 'improved' ? 1 : 0;
    const bg = config.backgroundColors[bgIndex % config.backgroundColors.length];
    if (bg) {
      params.set('backgroundColor', bg);
    }
  }

  const baseUrl = `https://api.dicebear.com/7.x/${selectedStyle}/${format}`;
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates both current (unchanged/Future A) and improved (Future B) avatar URLs
 * @param {Object} options - Options with userId and category
 * @returns {Object} { current: url, improved: url, currentThumb: url, improvedThumb: url }
 */
export function generateAvatarPair({ userId, category = 'explorer', size = 512, thumbSize = 128 }) {
  const primaryStyle = getStyleConfig(category).primaryStyle;
  const secondaryStyle = getStyleConfig(category).secondaryStyle;

  // Use primary style for current, secondary for improved (or same style with different params)
  return {
    current: generateAvatarUrl({ userId, category, variant: 'current', style: primaryStyle, size }),
    improved: generateAvatarUrl({ userId, category, variant: 'improved', style: primaryStyle, size }),
    currentThumb: generateAvatarUrl({ userId, category, variant: 'current', style: primaryStyle, size: thumbSize }),
    improvedThumb: generateAvatarUrl({ userId, category, variant: 'improved', style: primaryStyle, size: thumbSize }),
    // Also provide secondary style variants for variety
    currentAlt: generateAvatarUrl({ userId, category, variant: 'current', style: secondaryStyle, size }),
    improvedAlt: generateAvatarUrl({ userId, category, variant: 'improved', style: secondaryStyle, size }),
  };
}

/**
 * Gets avatar URLs for a user object (from UserContext)
 * Falls back to static assets if no userId available
 */
export function getUserAvatars(user) {
  if (!user) {
    return getDefaultAvatars();
  }

  const userId = user.id || user.characterId || user.userId || 'default';
  const category = user.category || 'explorer';

  // If user has custom avatar, use it
  if (user.isCustom && user.customAvatarUrl) {
    return {
      current: user.customAvatarUrl,
      improved: user.customAvatarUrl,
      currentThumb: user.avatarThumb || user.customAvatarUrl,
      improvedThumb: user.avatarThumb || user.customAvatarUrl,
      isCustom: true,
    };
  }

  // If user has a specific characterId from presets, try to use preset static images first
  // But we'll generate DiceBear avatars as the primary source now
  const avatars = generateAvatarPair({ userId, category });

  return {
    ...avatars,
    isCustom: false,
    characterKey: category,
  };
}

/**
 * Default fallback avatars (static assets)
 */
function getDefaultAvatars() {
  return {
    current: '/assets/characters/explorer_burnout.jpg',
    improved: '/assets/characters/explorer_radiant.jpg',
    currentThumb: '/assets/avatar_explorer_thumb.jpg',
    improvedThumb: '/assets/avatar_explorer_thumb.jpg',
    isCustom: false,
    characterKey: 'explorer',
  };
}

/**
 * Preloads avatar images for smoother transitions
 * Call this when user selects a character or on app initialization
 */
export function preloadAvatars(user) {
  const avatars = getUserAvatars(user);
  const urls = [
    avatars.current,
    avatars.improved,
    avatars.currentThumb,
    avatars.improvedThumb,
    avatars.currentAlt,
    avatars.improvedAlt,
  ].filter(Boolean);

  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

/**
 * Creates a smooth transition effect between avatar variants
 * Returns CSS classes for transition animations
 */
export function getAvatarTransitionClasses(isImproved, isTransitioning) {
  const base = 'transition-all duration-500 ease-in-out';
  if (isTransitioning) {
    return `${base} ${isImproved ? 'animate-fade-in-scale' : 'animate-fade-out-scale'}`;
  }
  return base;
}

export default {
  DICEBEAR_STYLES,
  CATEGORY_STYLE_MAP,
  generateSeed,
  getStyleConfig,
  generateAvatarUrl,
  generateAvatarPair,
  getUserAvatars,
  preloadAvatars,
  getAvatarTransitionClasses,
};