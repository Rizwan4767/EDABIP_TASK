import { Platform, useWindowDimensions } from 'react-native';

import {
  CARD_ASSET_CONTENT_TOP,
  CARD_ASSET_CURVE_DEPTH,
  CARD_ASSET_WHITE_W,
} from '@/screens/auth/components/cardCurveSheetMetrics';

/** Figma mobile canvas + Component83 (hero carousel) frame. */
const BASE_WIDTH = 390;
const FIGMA_CAROUSEL_WIDTH = 358;
const FIGMA_CAROUSEL_HEIGHT = 154;
const FIGMA_LEFT = 16;
/** Figma signup / forgot-password card frame (labelled 334 × 496 on the 390 canvas). */
const FIGMA_CARD_WIDTH = 334;
/** Figma OTP / forgot-password card frame (labelled 358 × 551 on the 390 canvas). */
const FIGMA_OTP_CARD_WIDTH = 358;
const FIGMA_OTP_CARD_HEIGHT = 551;
/** Figma forgot-password inner content frame (labelled 334 × 290 Hug). */
const FIGMA_FORGOT_CONTENT_WIDTH = 334;
const FIGMA_FORGOT_CONTENT_HEIGHT = 290;

const HAND_ASPECT = 175 / 83;
const FIGMA_HAND_LEFT = 225;
const FIGMA_HAND_TOP_OFFSET = 11;
/**
 * Single, consistent copy-box width for every carousel slide.
 *
 * NOTE: these are intentionally NOT per-slide. Figma reports a different
 * "Hug" frame width per slide (209 / 321 / 209 for titles, 250 / 254 / 219
 * for descriptions) because Hug just auto-sizes to whatever that slide's
 * text happened to wrap to — it's an output of each sentence's line breaks,
 * not a per-slide design token. Feeding those Hug widths back in as a
 * `maxWidth` per `activeIndex` makes each slide re-wrap into a differently
 * sized box as the carousel rotates, which is what produced the alignment
 * jump between slides. Use one width (sized to the widest slide's natural
 * content, "Meet your new business intelligence") so wrapping — and the
 * left edge — stays identical across slides.
 */
const FIGMA_TITLE_MAX_WIDTH = 321;
const FIGMA_DESCRIPTION_MAX_WIDTH = 254;
const FIGMA_LOGO_WIDTH = 134;
const FIGMA_LOGO_HEIGHT = 51;
export interface AuthSignupLayout {
  width: number;
  height: number;
  scale: number;
  isSmall: boolean;
  isTall: boolean;
  isWeb: boolean;
  hPad: number;
  sheetInset: number;
  sheetWidth: number;
  /** Fixed-height curve cap clipped from `card-curve-sheet.png`. */
  sheetCapHeight: number;
  /** Horizontal padding inside the card body. */
  sheetContentPadH: number;
  sheetBottomRadius: number;
  /** How far the sheet pulls up into the teal hero. */
  sheetOverlap: number;
  /** Figma OTP frame — wider than the signup card. */
  otpSheetWidth: number;
  otpSheetCapHeight: number;
  otpSheetOverlap: number;
  otpSheetContentPadH: number;
  /** Minimum white body height so the OTP card fills the lower screen. */
  otpBodyMinHeight: number;
  /** Figma forgot-password frame — 358 × 551 card, 334 × 290 content. */
  forgotBodyMinHeight: number;
  forgotContentWidth: number;
  forgotContentMinHeight: number;
  forgotSectionGap: number;
  /** Figma Component83 fixed frame for forgot-password hero: 358 × 154. */
  forgotCarouselHeight: number;
  forgotCarouselCopyHeight: number;
  logoWidth: number;
  logoHeight: number;
  /** Figma Component83: 358 × 154 */
  carouselWidth: number;
  carouselHeight: number;
  /** Fixed copy block height — prevents the card from jumping between slides. */
  carouselCopyHeight: number;
  carouselTitleMinHeight: number;
  carouselDescriptionMinHeight: number;
  carouselDotsHeight: number;
  /** Extra top offset applied to auth curved sheets. */
  authCardOffset: number;
  /** Additional downward offset for the forgot-password card only. */
  forgotCardOffset: number;
  /** Space below logo before carousel (Figma top 90 − logo area). */
  carouselMarginTop: number;
  copyMaxWidth: number;
  descriptionMaxWidth: number;
  titleSize: number;
  titleLineHeight: number;
  descriptionSize: number;
  descriptionLineHeight: number;
  handWidth: number;
  handHeight: number;
  /** Flush to the screen’s right edge. */
  handRight: number;
  handTop: number;
  fieldHeight: number;
  controlGap: number;
  fontSize: number;
  tabHeight: number;
}

/**
 * Responsive metrics for the mobile signup screen.
 * Recalculates on rotation / split-screen via `useWindowDimensions`.
 */
export function useAuthSignupLayout(): AuthSignupLayout {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.82), 1.2);
  const isSmall = width < 360;
  const isTall = height >= 780;

  const hPad = Math.round(FIGMA_LEFT * scale);
  const sheetInset = Math.round(((BASE_WIDTH - FIGMA_CARD_WIDTH) / 2) * scale);
  const sheetWidth = width - sheetInset * 2;
  const assetScale = sheetWidth / CARD_ASSET_WHITE_W;
  const sheetCapHeight = Math.round(CARD_ASSET_CONTENT_TOP * assetScale);
  const sheetContentPadH = Math.round(12 * scale);
  const sheetBottomRadius = Math.round(24 * scale);
  const sheetOverlap = Math.round(CARD_ASSET_CURVE_DEPTH * assetScale * 0.48);

  const otpSheetInset = Math.round(((BASE_WIDTH - FIGMA_OTP_CARD_WIDTH) / 2) * scale);
  const otpSheetWidth = width - otpSheetInset * 2;
  const otpAssetScale = otpSheetWidth / CARD_ASSET_WHITE_W;
  const otpSheetCapHeight = Math.round(CARD_ASSET_CONTENT_TOP * otpAssetScale);
  const otpSheetOverlap = Math.round(CARD_ASSET_CURVE_DEPTH * otpAssetScale * 0.48);
  const otpSheetContentPadH = Math.round(20 * scale);
  const otpSheetMinHeight = Math.round(FIGMA_OTP_CARD_HEIGHT * scale);
  const otpBodyMinHeight = Math.max(
    otpSheetMinHeight - otpSheetCapHeight,
    Math.round(height * 0.42),
  );

  const forgotSheetMinHeight = Math.round(FIGMA_OTP_CARD_HEIGHT * scale);
  const forgotBodyMinHeight = forgotSheetMinHeight - otpSheetCapHeight;
  const forgotContentWidth = Math.round(FIGMA_FORGOT_CONTENT_WIDTH * scale);
  const forgotContentMinHeight = Math.round(FIGMA_FORGOT_CONTENT_HEIGHT * scale);
  const forgotSectionGap = Math.round(16 * scale);

  const carouselWidth = Math.min(Math.round(FIGMA_CAROUSEL_WIDTH * scale), width - hPad * 2);

  const titleSize = Math.round(isSmall ? 18 : 20 * Math.min(scale, 1.05));
  const titleLineHeight = Math.round(isSmall ? 24 : 28 * Math.min(scale, 1.05));
  const descriptionSize = Math.round(isSmall ? 11 : 12);
  const descriptionLineHeight = Math.round(isSmall ? 18 : 22);
  const carouselTitleMinHeight = titleLineHeight * 2 + 8;
  const carouselDescriptionMinHeight = descriptionLineHeight * 4 + 8;
  const carouselDotsHeight = Math.round(20 * scale);
  const carouselCopyHeight = Math.max(
    carouselTitleMinHeight + carouselDescriptionMinHeight,
    Math.round(FIGMA_CAROUSEL_HEIGHT * scale) - carouselDotsHeight,
  );
  const carouselHeight = carouselCopyHeight + carouselDotsHeight;
  const forgotCarouselCopyHeight = Math.max(
    carouselTitleMinHeight + carouselDescriptionMinHeight,
    Math.round(FIGMA_CAROUSEL_HEIGHT * scale) - carouselDotsHeight,
  );
  const forgotCarouselHeight = forgotCarouselCopyHeight + carouselDotsHeight;
  const authCardOffset = Math.round(22 * scale);
  const forgotCardOffset = Math.round(14 * scale);

  const handWidth = Math.round(175 * scale);
  const handHeight = Math.round(handWidth / HAND_ASPECT);
  const handLeft = Math.round(FIGMA_HAND_LEFT * scale);
  const handRight = width - handLeft - handWidth;

  return {
    width,
    height,
    scale,
    isSmall,
    isTall,
    isWeb,
    hPad,
    sheetInset,
    sheetWidth,
    sheetCapHeight,
    sheetContentPadH,
    sheetBottomRadius,
    sheetOverlap,
    otpSheetWidth,
    otpSheetCapHeight,
    otpSheetOverlap,
    otpSheetContentPadH,
    otpBodyMinHeight,
    forgotBodyMinHeight,
    forgotContentWidth,
    forgotContentMinHeight,
    forgotSectionGap,
    forgotCarouselHeight,
    forgotCarouselCopyHeight,
    logoWidth: Math.round(FIGMA_LOGO_WIDTH * scale),
    logoHeight: Math.round(FIGMA_LOGO_HEIGHT * scale),
    carouselWidth,
    carouselHeight,
    carouselCopyHeight,
    carouselTitleMinHeight,
    carouselDescriptionMinHeight,
    carouselDotsHeight,
    authCardOffset,
    forgotCardOffset,
    carouselMarginTop: Math.round(12 * scale),
    copyMaxWidth: Math.round(FIGMA_TITLE_MAX_WIDTH * scale),
    descriptionMaxWidth: Math.round(FIGMA_DESCRIPTION_MAX_WIDTH * scale),
    titleSize,
    titleLineHeight,
    descriptionSize,
    descriptionLineHeight,
    handWidth,
    handHeight,
    handRight,
    handTop: Math.round(FIGMA_HAND_TOP_OFFSET * scale),
    fieldHeight: Math.round(Math.max(38, Math.min(48, 40 * scale))),
    controlGap: Math.round(Math.max(10, Math.min(14, 12 * scale))),
    fontSize: Math.round(isSmall ? 15 : 16),
    tabHeight: Math.round(Math.max(36, Math.min(44, 40 * scale))),
  };
}
