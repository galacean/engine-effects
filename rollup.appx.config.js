/**
 * 小程序产物编译配置
 */
import inject from '@rollup/plugin-inject';

const module = '@galacean/engine-miniprogram-adapter';
const commonAdapterList = [
  'window',
  'navigator',
  'HTMLElement',
  'HTMLImageElement',
  'HTMLCanvasElement',
  'HTMLVideoElement',
  'document',
  'WebGLRenderingContext',
  'Image',
  'URL',
  'location',
  'XMLHttpRequest',
  'Blob',
  'performance',
  'requestAnimationFrame',
  'cancelAnimationFrame',
];
const adapterList = {
  alipay: [...commonAdapterList],
}
const globals = {
  '@galacean/engine': 'Galacean',
};

export default [
  'alipay',
].map(platform => {
  const adapterVars = {};

  adapterList[platform].forEach(name => {
    adapterVars[name] = [`${module}`, name];
  });

  return {
    input: `src/index.ts`,
    external: ['@galacean/engine'],
    output: [{
      globals,
      file: `./dist/${platform}-miniprogram.mjs`,
      format: 'es',
      sourcemap: true,
    }, {
      globals,
      file: `./dist/${platform}-miniprogram.js`,
      format: 'cjs',
      sourcemap: true,
    }],
    plugins: [
      inject(adapterVars),
    ],
  };
});
