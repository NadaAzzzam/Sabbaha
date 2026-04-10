// Web shim for react-native-gesture-handler
// GestureHandlerRootView renders children as a plain View on web
export { View as GestureHandlerRootView } from 'react-native-web';

export const State = {};
export const Directions = {};
export const gestureHandlerRootHOC = (Comp: any) => Comp;
export const TapGestureHandler = ({ children }: any) => children;
export const PanGestureHandler = ({ children }: any) => children;
export const PinchGestureHandler = ({ children }: any) => children;
export default {};
