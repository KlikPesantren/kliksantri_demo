import { Dimensions } from 'react-native';
import { spacing } from '../../constants/theme';

export const CAROUSEL_AUTO_MS = 4000;

/** Fixed banner card — premium carousel height */
export const BANNER_HEIGHT = 220;
export const BANNER_RADIUS = 20;

const screenWidth = Dimensions.get('window').width;

export const CAROUSEL_SLIDE_WIDTH = screenWidth - spacing.lg * 2;

export function getCarouselSlideHeight() {
  return BANNER_HEIGHT;
}

/** @deprecated use BANNER_HEIGHT */
export const CAROUSEL_ASPECT = CAROUSEL_SLIDE_WIDTH / BANNER_HEIGHT;
