import { StyleSheet } from 'react-native';

export const dataSourcesCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  refreshBadge: { borderRadius: 25, paddingHorizontal: 6, paddingVertical: 3 },
  refreshLabel: {
    fontSize: 7,
    lineHeight: 9,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#000',
  },

  stats: { flexDirection: 'row', gap: 6 },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 6,

    paddingHorizontal: 4,
  },

  statTextWrap: { flexShrink: 1, minWidth: 0, gap: 2 },

  statLabel: { fontSize: 7, lineHeight: 8, textTransform: 'none', letterSpacing: 0 },
  list: { gap: 8 },
  source: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, padding: 8, gap: 8 },
  sourceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourceBody: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceCopy: { flex: 1, gap: 2 },
  healthLabel: { fontSize: 8, lineHeight: 10, textTransform: 'none', letterSpacing: 0 },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  refreshMeta: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
