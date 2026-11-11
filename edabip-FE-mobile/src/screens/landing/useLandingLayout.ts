import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 390;
const TABLET_BREAKPOINT = 768;
const CONTENT_MAX_WIDTH = 560;

export interface LandingLayout {
  width: number;
  scale: number;
  canvasScale: number;
  isSmall: boolean;
  gutter: number;
  sidePad: number;
  artSize: number;
  artTop: number;
  artRight: number;
  titleMaxWidth: number;
  titleSize: number;
  titleLineHeight: number;
  bodySize: number;
  bodyLineHeight: number;
  headingSize: number;
  headingLineHeight: number;
  chipSize: number;
  tileIcon: number;
  sovereigntyWidth: number;
  sovereigntyHeight: number;
  controlHeight: number;
  sectionGap: number;
  logoWidth: number;
  logoHeight: number;
  socialWidth: number;
  socialHeight: number;
}

export function useLandingLayout(): LandingLayout {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const isSmall = width < 360;
    const scale = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.12);
    const gutter = isSmall ? 12 : 16;
    const maxWidth = width >= TABLET_BREAKPOINT ? CONTENT_MAX_WIDTH : width;
    const sidePad = Math.max(gutter, Math.round((width - maxWidth) / 2));
    const innerWidth = width - sidePad * 2;
    const canvasScale = maxWidth / BASE_WIDTH;
    const artSize = Math.round(245 * canvasScale);
    const titleSize = Math.round(isSmall ? 20 : 24);
    const headingSize = Math.round(isSmall ? 18 : 20);
    const bodySize = 12;
    const chipSize = 8;

    return {
      width,
      scale,
      canvasScale,
      isSmall,
      gutter,
      sidePad,
      artSize,
      artTop: 0,
      artRight: Math.round(-57 * canvasScale),
      titleMaxWidth: Math.round(Math.max(290, innerWidth * 0.82)),
      titleSize,
      titleLineHeight: 32,
      bodySize,
      bodyLineHeight: 16,
      headingSize,
      headingLineHeight: Math.round(headingSize * 1.2),
      chipSize,
      tileIcon: Math.round(25 * scale),
      sovereigntyWidth: Math.round(Math.min(132 * scale, innerWidth * 0.36)),
      sovereigntyHeight: Math.round(Math.min(81 * scale, innerWidth * 0.22)),
      controlHeight: Math.round(Math.max(36, Math.min(44, 40 * scale))),
      sectionGap: Math.round(isSmall ? 16 : 24),
      logoWidth: Math.round(20 * scale),
      logoHeight: Math.round(29 * scale),
      socialWidth: Math.round(40 * scale),
      socialHeight: Math.round(12 * scale),
    };
  }, [width]);
}
