const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const babelConfig = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};

// Packages that need to be compiled (ship untranspiled ESM/JSX)
const NEEDS_COMPILE = [
  'react-native',
  'react-native-web',
  '@react-navigation',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-svg',
  'zustand',
  'i18next',
  'react-i18next',
  '@react-native',
];

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: [
      '.web.tsx', '.web.ts', '.web.js',
      '.tsx', '.ts', '.js', '.json',
    ],
    alias: {
      'react-native$': 'react-native-web',
      // Silence MMKV native on web (Metro handles .web.ts, webpack uses alias)
      'react-native-mmkv': path.resolve(__dirname, 'src/utils/mmkv.web.ts'),
      // Haptics no-op on web
      'react-native-haptic-feedback': path.resolve(__dirname, 'src/shims/react-native-haptic-feedback.ts'),
      // Reanimated web
      'react-native-reanimated': path.resolve(__dirname, 'node_modules/react-native-reanimated'),
    },
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: new RegExp(
          `node_modules/(?!(${NEEDS_COMPILE.join('|')})/)`,
        ),
        use: {
          loader: 'babel-loader',
          options: { ...babelConfig, cacheDirectory: true },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff2?|ttf|otf|eot)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    static: path.resolve(__dirname, 'public'),
  },
  devtool: 'eval-source-map',
};
