/**
 * Metrics for `card-curve-sheet.png` (Figma export 1504 × 2480 of the 334 × 496 card).
 * Used as 9-slice cap insets so the top curve and bottom corners never stretch.
 */
const CARD_ASSET_WIDTH = 1504;
const CARD_DESIGN_WIDTH = 334;
const CARD_TOP_CURVE = 65;
const CARD_CORNER_RADIUS = 24;

const assetScale = CARD_ASSET_WIDTH / CARD_DESIGN_WIDTH;

export const CARD_SHEET_CAP_INSETS = {
  top: Math.round(CARD_TOP_CURVE * assetScale),
  bottom: Math.round(CARD_CORNER_RADIUS * assetScale),
  left: Math.round(CARD_CORNER_RADIUS * assetScale),
  right: Math.round(CARD_CORNER_RADIUS * assetScale),
} as const;

/** Runtime curve depth on the current screen (design px scaled to card width). */
export const CARD_TOP_CURVE_RATIO = CARD_TOP_CURVE / CARD_DESIGN_WIDTH;
