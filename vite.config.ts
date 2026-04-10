import { defineConfig, type Plugin, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin as EsbuildPlugin } from 'esbuild';

const root = path.resolve(__dirname);
const empty = path.resolve(root, 'src/shims/empty.ts');

// RN internal paths that don't exist in react-native-web
const RN_INTERNAL_SHIMS = [
  'react-native/Libraries/Utilities/codegenNativeComponent',
  'react-native/Libraries/Utilities/codegenNativeCommands',
  'react-native/Libraries/Pressability/PressabilityDebug',
  'react-native/Libraries/Renderer/shims/ReactNativeViewConfigRegistry',
  'react-native/Libraries/Renderer/shims/ReactFabric',
  'react-native/Libraries/Renderer/shims/ReactNative',
  'react-native/Libraries/ReactNative/AppContainer',
  'react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance',
  'react-native/Libraries/Image/ImageViewNativeComponent',
  'react-native/Libraries/Components/View/ViewNativeComponent',
  'react-native/Libraries/Components/TextInput/TextInputState',
  'react-native/Libraries/Components/Keyboard/KeyboardAvoidingView',
];

// esbuild plugin used during optimizeDeps pre-bundling
const esbuildRnShimPlugin: EsbuildPlugin = {
  name: 'rn-internals-shim',
  setup(build) {
    // Shim deep internal RN paths (not handled by Vite alias in pre-bundle)
    build.onResolve({ filter: /^react-native\/Libraries\// }, () => ({
      path: empty,
      namespace: 'file',
    }));
    // Map top-level packages to their web shims (mirrors Vite resolve.alias)
    const aliasMap: Record<string, string> = {
      'react-native-screens': empty,
      'react-native-gesture-handler': path.resolve(root, 'src/shims/gesture-handler.web.ts'),
      'react-native-reanimated': path.resolve(root, 'src/shims/react-native-reanimated.web.ts'),
      'react-native-worklets': empty,
      'react-native-svg': path.resolve(root, 'src/shims/react-native-svg.web.ts'),
      'react-native-haptic-feedback': path.resolve(root, 'src/shims/react-native-haptic-feedback.ts'),
      'react-native-mmkv': path.resolve(root, 'src/utils/mmkv.web.ts'),
    };
    build.onResolve(
      { filter: /^react-native-(screens|gesture-handler|reanimated|worklets|svg|haptic-feedback|mmkv)/ },
      args => ({ path: aliasMap[args.path] ?? empty, namespace: 'file' }),
    );
  },
};

/**
 * Rollup plugin: shim RN internal deep-path imports during build/dev server.
 */
function rnInternalsShimPlugin(): Plugin {
  return {
    name: 'rn-internals-shim',
    resolveId(id) {
      if (RN_INTERNAL_SHIMS.includes(id)) return empty;
      if (/^react-native\/Libraries\//.test(id)) return empty;
      return null;
    },
  };
}

/**
 * RN ecosystem packages (react-native-web, svg) ship JSX inside plain .js.
 * Vite won't parse JSX in .js by default — re-transform with enforce:'pre'.
 */
function rnJsxPlugin(): Plugin {
  return {
    name: 'rn-jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.includes('node_modules') || !id.endsWith('.js')) return null;
      if (
        !id.includes('react-native-web') &&
        !id.includes('react-native-safe-area-context') &&
        !id.includes('react-native-svg')
      ) return null;
      if (!/<[A-Z]|<[a-z][a-zA-Z]/.test(code)) return null;

      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
        target: 'es2020',
      });
    },
  };
}

export default defineConfig({
  plugins: [
    rnInternalsShimPlugin(),
    rnJsxPlugin(),
    react(),
  ],
  resolve: {
    extensions: [
      '.web.tsx', '.web.ts', '.web.jsx', '.web.js',
      '.tsx', '.ts', '.jsx', '.js',
    ],
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: 'react-native-mmkv', replacement: path.resolve(root, 'src/utils/mmkv.web.ts') },
      { find: 'react-native-haptic-feedback', replacement: path.resolve(root, 'src/shims/react-native-haptic-feedback.ts') },
      { find: 'react-native-screens', replacement: empty },
      { find: 'react-native-gesture-handler', replacement: path.resolve(root, 'src/shims/gesture-handler.web.ts') },
      { find: 'react-native-reanimated', replacement: path.resolve(root, 'src/shims/react-native-reanimated.web.ts') },
      { find: 'react-native-worklets', replacement: empty },
      { find: 'react-native-svg', replacement: path.resolve(root, 'src/shims/react-native-svg.web.ts') },
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-native-web', 'i18next', 'react-i18next', 'zustand'],
    exclude: [
      'react-native-screens',
      'react-native-gesture-handler',
      'react-native-haptic-feedback',
      'react-native-mmkv',
      'react-native-reanimated',
      'react-native-worklets',
      'react-native-svg',
    ],
    esbuildOptions: {
      jsx: 'automatic',
      loader: { '.js': 'jsx' },
      plugins: [esbuildRnShimPlugin],
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  define: {
    global: 'window',
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
});
