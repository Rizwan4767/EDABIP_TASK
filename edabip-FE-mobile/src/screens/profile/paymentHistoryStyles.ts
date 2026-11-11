import { StyleSheet } from 'react-native';

import { fontFamily } from '@/theme';

/**
 * Figma reference: EDABIP Project → "Payment history" frame (390 x 885).
 * Every size/colour below was read off the Figma properties panel rather than
 * eyeballed, so the comments name the layer where a value came from.
 *
 * Figma types in Lato; the app standardises on Inter, so weights map through
 * `fontFamily` (Lato Regular 400 → Inter_400Regular, Medium 500 →
 * Inter_500Medium, Bold 700 → Inter_700Bold). `fontWeight` is deliberately
 * never set next to a named family — on Android the pair makes RN miss the
 * face and fall back to the system regular.
 */
export const paymentHistoryStyles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 100 },

  // ── Teal header ─────────────────────────────────────────────────
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 73, height: 29, overflow: 'hidden' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: { width: 30, height: 30, borderRadius: 15 },

  // ── User row ────────────────────────────────────────────────────
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { position: 'relative', width: 70, height: 70 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#D9D9D9',
  },
  penBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A0F01',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  userInfo: { flex: 1, gap: 2 },
  userName: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  userEmail: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  upgradeLink: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    lineHeight: 18,
  },

  // ── Body ─────────────────────────────────────────────────────────
  // Figma "Frame 2147237907": left 16, width 358, vertical gap 16.
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  // ── Back row + title ─────────────────────────────────────────────
  // Figma: back Vector 16x16 #000000; title Lato Bold 20 / 100% #000000.
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backRowPressed: { opacity: 0.7 },
  backTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 24,
    color: '#000000',
  },

  // ── Filter chips row ─────────────────────────────────────────────
  // Figma "Frame 2147237318": fill x 28, gap 12. Chips are radius 60 with
  // 16px horizontal padding; "All" 68x28 filled #134B4A, "Recently" 84x28
  // white with a 0.5px #535353 border.
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chipActive: {
    height: 28,
    paddingHorizontal: 16,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActiveLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#FFFFFF',
  },
  chipInactive: {
    height: 28,
    paddingHorizontal: 16,
    borderRadius: 60,
    borderWidth: 0.5,
    borderColor: '#535353',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInactiveLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#000000',
  },
  /** Pushes the filter glyph to the far right of the chips row. */
  filterSpacer: { flex: 1 },

  // ── List panel ───────────────────────────────────────────────────
  // Figma "Card": 358 wide, radius 3.96, padding 12, gap 10, #FFFFFF,
  // 0.5px #F3F4F6 border, soft drop shadow.
  listPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#F3F4F6',
    padding: 12,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },

  // ── Transaction card ─────────────────────────────────────────────
  // Figma "Component 11": 333 wide, radius 1.98, 0.5px #CFC9C9 border,
  // inner content 308 wide (≈12px padding) with an 8px gap.
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: '#CFC9C9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  /** Name + download glyph. Figma "Frame 2147237769": fill x 19, gap 5.94. */
  txNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  // Figma: Lato Regular 400 / 16 / 100%, #134B4A.
  txName: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 19,
    color: '#134B4A',
    flexShrink: 1,
  },
  /** Status pair + amount. Figma "Frame 2147237783": fill x 19, gap 12. */
  txStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  txStatusPair: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // Figma: Lato Medium 500 / 12 / 100%, #535353.
  txStatusLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#535353',
  },
  // Figma: "Completed" is the brand teal #134B4A — not a green.
  txStatusCompleted: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#134B4A',
  },
  // Figma: "Failed" #C93648.
  txStatusFailed: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#C93648',
  },
  // Figma: 16px semibold black, right-aligned on the status row.
  txAmount: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 19,
    color: '#000000',
    textAlign: 'right',
  },
  // Figma: Lato Medium 500 / 12 / 100%, #535353.
  txDate: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#535353',
  },
  // Figma "View more": Lato Regular 400 / 12 / 100%, #535353, centred.
  txViewMore: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 14,
    color: '#535353',
    textAlign: 'center',
  },
  txViewMoreHit: { paddingTop: 2, paddingBottom: 2 },

  // ── Expanded detail rows ─────────────────────────────────────────
  // Figma overlay: no dividers. Label Lato Medium 500 / 16 #000000,
  // value Lato Medium 500 / 12 #535353 right-aligned, rows ~2px apart.
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 19,
    color: '#000000',
    flexShrink: 1,
  },
  detailValue: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#535353',
    textAlign: 'right',
  },
  detailValueCompleted: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#134B4A',
    textAlign: 'right',
  },
  detailValueFailed: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#C93648',
    textAlign: 'right',
  },
});
