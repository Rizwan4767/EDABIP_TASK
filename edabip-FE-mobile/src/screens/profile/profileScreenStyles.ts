import { StyleSheet } from 'react-native';

import { fontFamily } from '@/theme';

/**
 * Figma reference: EDABIP Project → "Profile" frame (390 x 885).
 *
 * Three things the previous build had that Figma does not:
 *   1. hairline dividers between the menu rows — the Figma card is unbroken;
 *   2. a red "Log Out" row — Figma keeps it the same dark text as the others;
 *   3. a 36px gap under the teal header — Figma sits the card ~14px below it.
 */
export const profileScreenStyles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  // ── Teal header section ─────────────────────────────────────────────
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

  // ── Profile user card (inside teal header) ──────────────────────────
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

  // ── Scroll body ─────────────────────────────────────────────────────
  scroll: { flexGrow: 1, paddingBottom: 100 },
  // Figma: the card starts ~14px under the teal header, inset 16 each side.
  body: { paddingHorizontal: 16, paddingTop: 14 },

  // ── Menu card ───────────────────────────────────────────────────────
  // Figma: radius ~16, white, soft shadow, no internal dividers.
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  /**
   * Figma shows this tint on the hovered row of the menu component, so it is
   * applied on press rather than baked into one fixed row.
   */
  menuItemPressed: { backgroundColor: '#F7F8FA' },
  menuIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  allowLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#535353',
  },
});
