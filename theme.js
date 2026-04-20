// Shared visual theme — Farm Flip style
// Apply tokens from this file across all mini-games for consistency.

export const FARM = {
  // ── Backgrounds ──
  skyGradient: ['#6DCFF6', '#A8DEFB'],
  skyGradientDeep: ['#4BBDE8', '#87D8F5'],

  // ── Card colours ──
  cardBack: '#FBBF24',          // golden yellow
  cardBackBorder: '#F59E0B',
  cardFront: '#FEF9E7',         // cream white — content pops
  cardFrontBorder: '#FDE68A',
  cardMatched: '#DCFCE7',
  cardMatchedBorder: '#86EFAC',
  cardHintBorder: '#FDE047',
  cardShadow: '#B45309',

  // ── Header / UI ──
  closeButtonBg: '#EF4444',
  closeButtonBorder: '#DC2626',
  settingsButtonBg: '#FBBF24',
  settingsBorderColor: '#F59E0B',

  headerTitleColor: '#1B4F8B',
  headerTitleSize: 20,
  /** Space below the top bar (close / title / music) before main content. */
  headerContentGap: 12,

  // ── Buttons ──
  playButtonGradient: ['#FBBF24', '#F59E0B'],
  playButtonText: '#7C2D12',
  playButtonShadow: '#B45309',

  // ── Text ──
  titleColor: '#7C2D12',
  subtitleColor: '#92400E',
  bodyText: '#374151',

  // ── Grass / landscape ──
  grassLight: '#86EFAC',
  grassMid: '#4ADE80',
  grassDark: '#22C55E',
  hillColor: '#6EE7B7',
  /** Locked garden tile “stone” overlay (gray pebble). */
  gardenStoneLight: '#B8B5B2',
  gardenStoneDark: '#6B6A68',
  /** Space between main content and the grass bar (farm screens). */
  contentGapAboveGrass: 10,

  // ── Card back symbol ──
  cardBackIcon: 'a_horse',

  // ── Misc ──
  white: '#FFFFFF',
  shadow: 'rgba(0,0,0,0.18)',
};

// Reusable shadow presets
export const SHADOWS = {
  card: {
    shadowColor: FARM.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 6,
    elevation: 6,
  },
  cardMatched: {
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    shadowColor: FARM.playButtonShadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
};
