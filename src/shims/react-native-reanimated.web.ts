/**
 * Web shim for react-native-reanimated.
 * Provides no-op / CSS-transition fallbacks so the app renders on web.
 * Animations won't be as smooth as on native but the UI is fully functional.
 */
import React from 'react';
import { Animated as RNAnimated, View, Text, Image, ScrollView } from 'react-native';

// Shared value — plain ref on web
export const useSharedValue = (init: any) => ({ value: init });

// Derived value
export const useDerivedValue = (fn: () => any) => ({ value: fn() });

// Animated style — just call the worklet synchronously on web
export const useAnimatedStyle = (fn: () => any) => fn();

// Animated props
export const useAnimatedProps = (fn: () => any) => fn();

// Timing / spring — instant on web (return the target)
export const withTiming = (val: any, _opts?: any, callback?: any) => {
  callback?.(true);
  return val;
};
export const withSpring = (val: any, _opts?: any, callback?: any) => {
  callback?.(true);
  return val;
};
export const withDelay = (_ms: number, animation: any) => animation;
export const withSequence = (...animations: any[]) => animations[animations.length - 1];
export const withRepeat = (animation: any) => animation;

// runOnJS — just call the function
export const runOnJS = (fn: any) => fn;
export const runOnUI = (fn: any) => fn;

// Animated components — use RNAnimated on web
export default {
  View: RNAnimated.View,
  Text: RNAnimated.Text,
  Image: RNAnimated.Image,
  ScrollView: RNAnimated.ScrollView,
  createAnimatedComponent: RNAnimated.createAnimatedComponent,
};

export const createAnimatedComponent = RNAnimated.createAnimatedComponent;

// Re-export Animated default
const Animated = {
  View: RNAnimated.View,
  Text: RNAnimated.Text,
  Image: RNAnimated.Image,
  ScrollView: RNAnimated.ScrollView,
  createAnimatedComponent: RNAnimated.createAnimatedComponent,
};
export { Animated };

// Easing
export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  bezier: () => (t: number) => t,
  in: (e: any) => e,
  out: (e: any) => e,
  inOut: (e: any) => e,
};

// Layout animations — no-op on web
export const FadeIn = { duration: () => FadeIn, delay: () => FadeIn };
export const FadeOut = { duration: () => FadeOut };
export const SlideInRight = { duration: () => SlideInRight };
export const SlideOutLeft = { duration: () => SlideOutLeft };
export const ZoomIn = { duration: () => ZoomIn };
export const ZoomOut = { duration: () => ZoomOut };
export const Layout = { duration: () => Layout, springify: () => Layout };

// useAnimatedScrollHandler
export const useAnimatedScrollHandler = () => ({});

// useAnimatedRef
export const useAnimatedRef = () => React.createRef();

// measure
export const measure = () => null;

// useAnimatedGestureHandler
export const useAnimatedGestureHandler = () => ({});
