import { StyleSheet } from 'react-native';

import { fontFamily } from '@/theme';

export const updateProfileStyles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  // ── Teal header ────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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

  // ── User row (inside header) ─────────────────────────────────────
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
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  upgradeLink: {
    fontSize: 12,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    lineHeight: 18,
  },

  // ── Scroll body ──────────────────────────────────────────────────
  scroll: { flexGrow: 1, paddingBottom: 40 },
  body: { padding: 16, gap: 12 },

  // ── Back row title ────────────────────────────────────────────────
  // Figma "Content" frame: row, gap 12px between the 16x16 arrow and the
  // title text, vertically centred.
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 4,
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backRowPressed: { opacity: 0.7 },
  // Match Payment History's proven "Update…" title implementation: an
  // explicit Lato-mapped font file (fontFamily) rather than a system
  // fontWeight synthesized bold, which is what let the OS's text-size
  // setting expand the glyph metrics and get the row truncated.
  backTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 24,
    color: '#000000',
  },

  // ── Form card ─────────────────────────────────────────────────────
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    paddingBottom: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fieldGroup: { gap: 4 },
  // Figma "Name" label layer: Lato Medium 500 / 14px, #000000.
  fieldLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  // Figma field border: 1.5px solid #151515, 6px radius, 12px padding.
  inputBorder: {
    borderWidth: 1.5,
    borderColor: '#151515',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#5F6D6B',
    lineHeight: 20,
    backgroundColor: '#FFFFFF',
  },

  // ── Save button ───────────────────────────────────────────────────
  // Figma "button": row, fill width, radius 100, padding 12/24, #134B4A.
  saveButton: {
    alignSelf: 'stretch',
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  // Figma "Save Change" text layer: Lato SemiBold 14px / 20px line height,
  // #FFFFFF. Uses fontFamily (not fontWeight) for the same reason as
  // backTitle above — keeps the label from getting clipped when the
  // device's text-size accessibility setting is turned up.
  saveLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
});
