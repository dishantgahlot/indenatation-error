// Utility to resolve consistent character artwork and emotional expressions across pages
// Based on the user's selected avatar / character archetype.
// Now uses DiceBear API for dynamic, consistent avatar generation from user ID.

import { getUserAvatars, generateAvatarPair } from './dicebearAvatar.js';

// Character archetype metadata (unchanged - for quotes, titles, etc.)
const CHARACTER_ARCHETYPES = {
  cosmic: {
    characterKey: 'stargazer',
    name: 'Aura',
    title: 'The Sunset Stargazer',
    unimprovedWarning: '⚠ Warning: The Fatigue Slump',
    improvedMilestone: '✦ Milestone: Circadian Alignment',
    unimprovedQuote: `"The danger isn't a sudden fall, but the slow habituation to mediocrity."`,
    improvedQuote: `"Every morning is a quiet victory before the rest of the world wakes up."`,
    identityUnimprovedQuote: `"The stars still shine, but late nights and fatigue kept me from seeing them."`,
    identityImprovedQuote: `"Quiet the mind, protect the dawn, and the path unfolds effortlessly."`,
    journey: '/assets/characters/stargazer_journey.jpg',
  },
  scholar: {
    characterKey: 'scholar',
    name: 'Ren',
    title: 'The Field Scholar',
    unimprovedWarning: '⚠ Warning: Intellectual Exhaustion',
    improvedMilestone: '✦ Milestone: Deep Focus & Clarity',
    unimprovedQuote: `"Knowledge left unapplied and drowning in screen glare turns into mental clutter."`,
    improvedQuote: `"Small, disciplined notes compound into a masterpiece of lifelong mastery."`,
    identityUnimprovedQuote: `"I bought countless books and courses, yet spent my nights scrolling into exhaustion."`,
    identityImprovedQuote: `"You are what you repeatedly study and build. Excellence is a daily rhythm."`,
    journey: '/assets/characters/scholar_journey.jpg',
  },
  tech: {
    characterKey: 'scholar',
    name: 'Neo',
    title: 'The Cyberpunk Architect',
    unimprovedWarning: '⚠ Warning: Intellectual Exhaustion',
    improvedMilestone: '✦ Milestone: Deep Focus & Clarity',
    unimprovedQuote: `"Knowledge left unapplied and drowning in screen glare turns into mental clutter."`,
    improvedQuote: `"Small, disciplined notes compound into a masterpiece of lifelong mastery."`,
    identityUnimprovedQuote: `"I bought countless books and courses, yet spent my nights scrolling into exhaustion."`,
    identityImprovedQuote: `"You are what you repeatedly study and build. Excellence is a daily rhythm."`,
    journey: '/assets/characters/scholar_journey.jpg',
  },
  athletic: {
    characterKey: 'athletic',
    name: 'Valerie',
    title: 'The Windblade Striker',
    unimprovedWarning: '⚠ Warning: Physical Breakdown & Fatigue',
    improvedMilestone: '✦ Milestone: Peak Vitality & Triumph',
    unimprovedQuote: `"Neglecting recovery and discipline is the fastest way to lose everything you've built."`,
    improvedQuote: `"Discipline is choosing between what you want right now and what you want most."`,
    identityUnimprovedQuote: `"The heaviest weight you will ever carry is the regret of wasted physical potential."`,
    identityImprovedQuote: `"Strength was never given; it was forged in the morning runs no one else saw."`,
    journey: '/assets/characters/athletic_journey.jpg',
  },
  explorer: {
    characterKey: 'explorer',
    name: 'Dishant',
    title: 'The Mountain Explorer',
    unimprovedWarning: '⚠ Warning: The Fatigue Slump',
    improvedMilestone: '✦ Milestone: Circadian Alignment',
    unimprovedQuote: `"The danger isn't a sudden fall, but the slow habituation to mediocrity."`,
    improvedQuote: `"Every morning is a quiet victory before the rest of the world wakes up."`,
    identityUnimprovedQuote: `"The heaviest weight you will ever carry is the regret of unused potential."`,
    identityImprovedQuote: `"The summit belongs to those who climb daily, one focused step at a time."`,
    journey: '/assets/characters/explorer_journey.jpg',
  },
};

/**
 * Determines the character archetype from user data
 */
function getArchetype(userOrAvatar) {
  let id = '';
  let category = '';
  let name = '';
  let title = '';
  let avatarUrl = '';

  if (typeof userOrAvatar === 'string') {
    id = userOrAvatar.toLowerCase();
  } else if (userOrAvatar && typeof userOrAvatar === 'object') {
    // Note: Do NOT treat a 24-character hex string as a character ID (that's a MongoDB user ID)
    const rawId = typeof userOrAvatar.id === 'string' && !/^[0-9a-fA-F]{24}$/.test(userOrAvatar.id)
      ? userOrAvatar.id
      : '';

    id = (
      userOrAvatar.characterId ||
      userOrAvatar.character_id ||
      userOrAvatar.avatarId ||
      userOrAvatar.avatar_id ||
      rawId ||
      ''
    ).toLowerCase();

    category = (userOrAvatar.category || '').toLowerCase();
    name = (userOrAvatar.name || '').toLowerCase();
    title = (userOrAvatar.title || '').toLowerCase();
    avatarUrl = (
      userOrAvatar.avatarFull ||
      userOrAvatar.avatarThumb ||
      userOrAvatar.avatar_full ||
      userOrAvatar.avatar_thumb ||
      userOrAvatar.customAvatarUrl ||
      userOrAvatar.custom_avatar_url ||
      ''
    ).toLowerCase();
  }

  // Combined search fingerprint for robust fuzzy matching across all 16 presets and user profiles
  const fingerprint = `${id} ${category} ${name} ${title} ${avatarUrl}`;

  // 1. Cosmic / Stargazer Archetype (Aura, Sora, Lyra, Selene, Seraphina)
  if (
    fingerprint.includes('stargazer') ||
    fingerprint.includes('aura') ||
    fingerprint.includes('zen') ||
    fingerprint.includes('sora') ||
    fingerprint.includes('solar') ||
    fingerprint.includes('lyra') ||
    fingerprint.includes('lunar') ||
    fingerprint.includes('selene') ||
    fingerprint.includes('oracle') ||
    fingerprint.includes('seraphina') ||
    category === 'cosmic' ||
    fingerprint.includes('cosmic')
  ) {
    return 'cosmic';
  }

  // 2. Scholar / Academic Archetype (Ren, Neo, Maya, Ezekiel)
  if (
    fingerprint.includes('scholar') ||
    fingerprint.includes('ren') ||
    fingerprint.includes('cyber') ||
    fingerprint.includes('neo') ||
    fingerprint.includes('quantum') ||
    fingerprint.includes('maya') ||
    fingerprint.includes('clockwork') ||
    fingerprint.includes('ezekiel') ||
    category === 'scholar' ||
    category === 'tech' ||
    fingerprint.includes('scholar') ||
    fingerprint.includes('tech')
  ) {
    // Differentiate between scholar and tech based on category
    if (category === 'tech' || fingerprint.includes('cyber') || fingerprint.includes('neo') || fingerprint.includes('quantum')) {
      return 'tech';
    }
    return 'scholar';
  }

  // 3. Athletic / Willpower Archetype (Valerie, Ares, Jin, Freya)
  if (
    fingerprint.includes('athletic') ||
    fingerprint.includes('valerie') ||
    fingerprint.includes('striker') ||
    fingerprint.includes('iron') ||
    fingerprint.includes('titan') ||
    fingerprint.includes('ares') ||
    fingerprint.includes('ronin') ||
    fingerprint.includes('jin') ||
    fingerprint.includes('dawn') ||
    fingerprint.includes('valkyrie') ||
    fingerprint.includes('freya') ||
    category === 'athletic' ||
    fingerprint.includes('athletic')
  ) {
    return 'athletic';
  }

  // 4. Default: Explorer Archetype (Dishant, Aria, Kaelen)
  return 'explorer';
}

/**
 * Gets the base archetype data (quotes, titles, etc.)
 */
function getArchetypeData(archetype) {
  return CHARACTER_ARCHETYPES[archetype] || CHARACTER_ARCHETYPES.explorer;
}

/**
 * Main export: getCharacterMedia
 * Returns character media including DiceBear-generated avatar URLs for current/improved variants
 * @param {Object|string} userOrAvatar - User object or character ID string
 * @returns {Object} Character media object with avatar URLs and metadata
 */
export function getCharacterMedia(userOrAvatar) {
  const archetype = getArchetype(userOrAvatar);
  const archetypeData = getArchetypeData(archetype);

  // Get user ID for consistent avatar generation
  let userId = 'default';
  let category = archetype;
  let isCustom = false;
  let customAvatarUrl = '';

  if (typeof userOrAvatar === 'object' && userOrAvatar) {
    userId = userOrAvatar.id || userOrAvatar.characterId || userOrAvatar.userId || 'default';
    category = userOrAvatar.category || archetype;
    isCustom = Boolean(userOrAvatar.isCustom);
    customAvatarUrl = userOrAvatar.customAvatarUrl || userOrAvatar.custom_avatar_url || '';
  } else if (typeof userOrAvatar === 'string') {
    userId = userOrAvatar;
  }

  // Get avatar URLs from DiceBear (or custom if set)
  let avatarUrls;
  if (isCustom && customAvatarUrl) {
    avatarUrls = {
      current: customAvatarUrl,
      improved: customAvatarUrl,
      currentThumb: customAvatarUrl,
      improvedThumb: customAvatarUrl,
      isCustom: true,
    };
  } else {
    avatarUrls = generateAvatarPair({ userId, category });
    avatarUrls.isCustom = false;
  }

  // Resolve default scenic storytelling artwork for the two paths
  const unimprovedScenic = `/assets/characters/${archetypeData.characterKey}_burnout.jpg`;
  const improvedScenic = `/assets/characters/${archetypeData.characterKey}_radiant.jpg`;

  // Return combined object with archetype metadata and dynamic avatar URLs
  return {
    // Archetype metadata
    characterKey: archetypeData.characterKey,
    name: (typeof userOrAvatar === 'object' && userOrAvatar?.name) ? userOrAvatar.name : archetypeData.name,
    title: (typeof userOrAvatar === 'object' && userOrAvatar?.title) ? userOrAvatar.title : archetypeData.title,
    journey: archetypeData.journey,

    // High-impact scenic storytelling illustrations for choices & milestones
    unimproved: (isCustom && customAvatarUrl) ? customAvatarUrl : (archetypeData.unimproved || unimprovedScenic),
    improved: (isCustom && customAvatarUrl) ? customAvatarUrl : (archetypeData.improved || improvedScenic),

    // Dynamic DiceBear-generated avatar URLs (character portraits)
    unimprovedAvatar: avatarUrls.current,
    improvedAvatar: avatarUrls.improved,
    unimprovedThumb: avatarUrls.currentThumb,
    improvedThumb: avatarUrls.improvedThumb,
    currentAlt: avatarUrls.currentAlt,
    improvedAlt: avatarUrls.improvedAlt,

    // Static asset fallbacks (guaranteed valid local assets)
    unimprovedStatic: unimprovedScenic,
    improvedStatic: improvedScenic,
    journeyStatic: archetypeData.journey,

    // Quotes and labels
    unimprovedWarning: archetypeData.unimprovedWarning,
    improvedMilestone: archetypeData.improvedMilestone,
    unimprovedQuote: archetypeData.unimprovedQuote,
    improvedQuote: archetypeData.improvedQuote,
    identityUnimprovedQuote: archetypeData.identityUnimprovedQuote,
    identityImprovedQuote: archetypeData.identityImprovedQuote,

    // Meta
    isCustom: avatarUrls.isCustom,
    category,
    userId,
  };
}

export default getCharacterMedia;