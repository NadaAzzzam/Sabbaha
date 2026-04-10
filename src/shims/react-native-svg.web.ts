/**
 * Web shim for react-native-svg — delegates to the package's own web entry.
 */
// react-native-svg ships src/ReactNativeSVG.web.ts for browser builds
export * from '../../node_modules/react-native-svg/src/ReactNativeSVG.web';
export { default } from '../../node_modules/react-native-svg/src/ReactNativeSVG.web';
