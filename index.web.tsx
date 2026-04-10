import { AppRegistry } from 'react-native';
import App from './App';
import { WebRootErrorBoundary } from './src/web/WebRootErrorBoundary';

function WebRoot() {
  return (
    <WebRootErrorBoundary>
      <App />
    </WebRootErrorBoundary>
  );
}

AppRegistry.registerComponent('Sabbaha', () => WebRoot);

const rootTag = document.getElementById('root');
if (rootTag) {
  AppRegistry.runApplication('Sabbaha', {
    initialProps: {},
    rootTag,
  });
} else {
  console.error('[web] Missing #root — check index.html');
}
