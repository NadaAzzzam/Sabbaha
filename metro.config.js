const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
function webIndexHtml() {
  const qs =
    'platform=web&dev=true&hot=true&lazy=true&minify=false&inlineSourceMap=false';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <title>Sabbaha</title>
  <style>
    html, body, #root { height: 100%; margin: 0; }
    body { overflow: hidden; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="/index.bundle?${qs}"></script>
</body>
</html>`;
}

const config = {
  resolver: {
    platforms: ['ios', 'android', 'web'],
    resolveRequest: (context, moduleName, platform) => {
      if (platform === 'web' && moduleName === 'react-native') {
        return {
          type: 'sourceFile',
          filePath: require.resolve('react-native-web'),
        };
      }
      if (platform === 'web' && moduleName === 'react-native-sound') {
        return {
          type: 'sourceFile',
          filePath: require.resolve('./src/shims/react-native-sound.ts'),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  server: {
    enhanceMiddleware: middleware => {
      return (req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        if (pathname === '/' || pathname === '/index.html') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.end(webIndexHtml());
          return;
        }
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
