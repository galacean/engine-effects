import { resolve } from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import legacy from '@vitejs/plugin-legacy';
import { getSWCPlugin } from './scripts/rollup-config-helper';

export default defineConfig(({ mode }) => {
  return {
    base: './',
    build: {
      rollupOptions: {
        input: {
          'index': resolve(__dirname, 'demo/index.html'),
          'compose': resolve(__dirname, 'demo/html/compose.html'),
          'dynamic-image': resolve(__dirname, 'demo/html/dynamic-image.html'),
          'engine-config': resolve(__dirname, 'demo/html/engine-config.html'),
          'interactive': resolve(__dirname, 'demo/html/interactive.html'),
          'large-scene': resolve(__dirname, 'demo/html/large-scene.html'),
          'memory': resolve(__dirname, 'demo/html/memory.html'),
          'multiple-components': resolve(__dirname, 'demo/html/multiple-components.html'),
          'multiple-compositions': resolve(__dirname, 'demo/html/multiple-compositions.html'),
          'multiple-engine': resolve(__dirname, 'demo/html/multiple-engine.html'),
          'single': resolve(__dirname, 'demo/html/single.html'),
          'spine': resolve(__dirname, 'demo/html/spine.html'),
          'text': resolve(__dirname, 'demo/html/text.html'),
          'use-effects-camera': resolve(__dirname, 'demo/html/use-effects-camera.html'),
          'inspire-index': resolve(__dirname, 'demo/html/inspire/index.html'),
          'inspire-engine-effects': resolve(__dirname, 'demo/html/inspire/engine-effects.html'),
          'inspire-engine-use-effects-camera': resolve(__dirname, 'demo/html/inspire/engine-use-effects-camera.html'),
          'inspire-pre-effects-player': resolve(__dirname, 'demo/html/inspire/pre-effects-player.html'),
        }
      },
      minify: false, // iOS 9 等低版本加载压缩代码报脚本异常
    },
    server: {
      host: '0.0.0.0',
      port: 8080,
    },
    preview: {
      host: '0.0.0.0',
      port: 8080,
    },
    resolve: {
      alias: [{
        find: '@galacean/effects',
        replacement: '@galacean/effects-core',
      }],
    },
    plugins: [
      legacy({
        targets: ['iOS >= 9'],
      }),
      getSWCPlugin({
        target: 'ES6',
      }),
      tsconfigPaths(),
    ],
  };
});
