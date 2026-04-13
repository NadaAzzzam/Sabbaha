import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/** Design baseline: iPhone 14 (390×844) */
const BASE_W = 390;
const BASE_H = 844;

/** Scale a value proportionally to screen width */
export const sw = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_W / BASE_W) * size));

/** Scale a value proportionally to screen height */
export const sh = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_H / BASE_H) * size));

/** Moderate scale — blend of width scaling and 1:1 to avoid extremes on tablets */
export const ms = (size: number, factor = 0.5): number =>
  Math.round(
    PixelRatio.roundToNearestPixel(size + (sw(size) - size) * factor),
  );

/** Is the device a tablet (shortest side ≥ 600dp)? */
export const isTablet = Math.min(SCREEN_W, SCREEN_H) >= 600;

/** Screen dimensions */
export const screenW = SCREEN_W;
export const screenH = SCREEN_H;

/** Max content width on tablets to prevent stretched layouts */
export const contentMaxWidth = isTablet ? 600 : SCREEN_W;

/** Horizontal padding that grows on tablets */
export const responsivePadH = isTablet ? 40 : SCREEN_W < 360 ? 16 : 24;
