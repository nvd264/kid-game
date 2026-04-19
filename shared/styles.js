import { StyleSheet } from 'react-native';
import { FARM, SHADOWS } from '../theme';

const sharedStyles = StyleSheet.create({
  // ── App home screen ──
  container: {
    flex: 1,
    paddingTop: 50,
    overflow: 'hidden',
  },
  bgBubbleOne: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(250,204,21,0.42)', top: -80, right: -80,
  },
  bgBubbleTwo: {
    position: 'absolute', width: 190, height: 190, borderRadius: 95,
    backgroundColor: 'rgba(250,204,21,0.32)', bottom: 60, left: -70,
  },
  bgBubbleThree: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(56,189,248,0.45)', top: 220, left: 30,
  },
  title: {
    fontSize: 42, fontWeight: '900', color: FARM.titleColor, textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  subtitle: { fontSize: 19, color: FARM.subtitleColor, marginTop: 6, textAlign: 'center' },
  audioLoadingText: { marginTop: 10, color: FARM.titleColor, fontSize: 18, fontWeight: '800' },

  // ── Music toggle ──
  musicToggleHome: { position: 'absolute', top: 58, right: 16, zIndex: 200, elevation: 24 },
  musicToggleGame: { position: 'absolute', top: 10, right: 16, zIndex: 200, elevation: 24 },
  musicToggleDimmed: { opacity: 0.68 },

  // ── Farm shared header/footer ──
  farmCloseButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: FARM.closeButtonBg, borderWidth: 2, borderColor: FARM.closeButtonBorder,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.header,
  },
  farmGearButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: FARM.settingsButtonBg, borderWidth: 2, borderColor: FARM.settingsBorderColor,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.header,
  },
  farmHeaderSpacer: { width: 44, height: 44 },
  farmHeaderTitle: {
    fontSize: 22, fontWeight: '900', color: FARM.headerTitleColor,
    textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  farmPlayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 0, marginBottom: FARM.headerContentGap, zIndex: 2,
  },
  farmLevelBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 24, borderWidth: 2, borderColor: FARM.cardBackBorder,
    ...SHADOWS.header,
  },
  farmLevelText: { fontSize: 18, fontWeight: '900', color: FARM.headerTitleColor },
  farmIntroCard: {
    marginHorizontal: 20, marginTop: 0, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 20,
    paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center',
    borderWidth: 2, borderColor: FARM.cardFrontBorder, ...SHADOWS.header,
  },
  farmIntroTitle: { fontSize: 22, fontWeight: '900', color: FARM.titleColor },
  farmIntroSub: { fontSize: 15, fontWeight: '700', color: FARM.subtitleColor, marginTop: 4 },
  farmThemeCard: {
    borderRadius: 20, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20, gap: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', ...SHADOWS.button,
  },
  farmHomeGameTextWrap: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  farmHomeGameTitle: { width: '100%', textAlign: 'left' },
  farmThemeEmojiWrap: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  farmThemeName: {
    fontSize: 22, fontWeight: '900', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  farmThemeSub: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.9)', marginTop: 2, letterSpacing: 0.5 },
  farmGrassBar: {
    marginTop: FARM.contentGapAboveGrass, height: 40, backgroundColor: FARM.grassMid,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 3, borderColor: FARM.grassDark,
  },

  // ── Reward popup ──
  popupOverlay: {
    flex: 1, backgroundColor: 'rgba(27, 79, 139, 0.42)',
    justifyContent: 'center', alignItems: 'center', overflow: 'visible',
  },
  popupCardShell: { width: '84%', maxWidth: 400, position: 'relative', alignItems: 'stretch', overflow: 'visible', zIndex: 1 },
  popupCard: {
    backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 28, padding: 28,
    width: '100%', alignItems: 'center', borderWidth: 2, borderColor: FARM.cardFrontBorder,
    ...SHADOWS.button, zIndex: 0, elevation: 8,
  },
  popupCloseWrap: { position: 'absolute', top: -16, right: -10, zIndex: 100, elevation: 24 },
  popupPraiseText: {
    fontSize: 26, fontWeight: '900', color: FARM.titleColor,
    marginTop: 8, textAlign: 'center', paddingHorizontal: 8,
  },
  popupLevelBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 22, borderWidth: 2, borderColor: FARM.cardBackBorder, ...SHADOWS.header,
  },
  popupLevelText: { fontSize: 18, color: FARM.headerTitleColor, fontWeight: '900', letterSpacing: 0.3 },

  // ── Win button (used inside RewardPopup) ──
  winButton: {
    borderRadius: 28, minHeight: 56, width: '100%',
    paddingHorizontal: 22, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  winButtonText: {
    color: FARM.playButtonText, fontSize: 18, fontWeight: '900',
    letterSpacing: 0.5, textAlign: 'center', width: '100%',
  },

  // ── General game header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 16, paddingVertical: 10, marginBottom: FARM.headerContentGap, zIndex: 2,
  },
  backButton: {
    backgroundColor: '#FFFFFF', width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: '#D6DCFF', alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#4B3B89', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  statsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.98)', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, elevation: 3, borderWidth: 1, borderColor: '#FBBF24',
  },
  statPillText: { fontSize: 14, fontWeight: '800', color: '#C2410C' },
  headerTitle: {
    color: '#FFFFFF', fontSize: 23, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.28)', textShadowRadius: 4,
  },

  // ── Theme / level select ──
  kidSelectScrollContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  farmThemeSelectScrollContent: { flexGrow: 1, justifyContent: 'center' },
  kidSelectIntroCard: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.82)',
    elevation: 4, shadowColor: '#3E3C89', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 7,
  },
  kidSelectIntroTitle: { color: '#1E3A8A', fontSize: 22, fontWeight: '900' },
  kidSelectIntroSub: { marginTop: 4, color: '#1D4ED8', fontSize: 18, fontWeight: '800' },
  kidThemeEmoji: { fontSize: 44 },
  kidThemeTextWrap: { flex: 1 },
  kidLevelCard: {
    borderRadius: 24, padding: 16, minHeight: 116, justifyContent: 'space-between',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22, shadowRadius: 10,
  },
  kidLevelTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kidLevelEmoji: { fontSize: 34 },
  kidLevelName: {
    color: 'white', fontSize: 33, fontWeight: '900', lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.32)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  kidLevelSubtitle: { marginTop: 1, color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: '800' },
  kidLevelArrow: { color: 'white', fontSize: 16, fontWeight: '900' },
  kidLevelDesc: { color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '700' },
  levelVisualRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelMiniBadge: {
    backgroundColor: 'rgba(255,255,255,0.36)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)',
  },
  levelMiniBadgeText: { color: 'white', fontSize: 13, fontWeight: '900' },
  levelDotsRow: { marginLeft: 'auto', flexDirection: 'row', gap: 6 },
  levelDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.35)' },
  levelDotActive: { backgroundColor: 'white' },

  // ── Hint hand ──
  hintHandWrap: { position: 'absolute', zIndex: 20, elevation: 20 },

  // ── Big action button ──
  bigButton: {
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, width: '100%', alignItems: 'center',
    backgroundColor: '#EA580C', elevation: 5,
    shadowColor: '#9A3412', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 7,
  },
  bigButtonText: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 0.4 },
});

export default sharedStyles;
