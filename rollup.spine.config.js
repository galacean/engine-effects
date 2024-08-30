import { getPlugins } from './scripts/rollup-config-helper';

const pkg = require('./package.json');
const globals = {
  '@galacean/engine-effects': 'Galacean.effects',
};
const external = ['@galacean/effects'];
const plugins = getPlugins(pkg);
const paths = { '@galacean/effects': '@galacean/engine-effects'};

export default [{
  input: 'src/plugin-spine.ts',
  output: [{
    file: './dist/plugin-spine.mjs',
    format: 'es',
    globals,
    sourcemap: true,
    paths,
  }, {
    file: './dist/plugin-spine.js',
    format: 'cjs',
    globals,
    sourcemap: true,
    paths,
  }],
  external,
  plugins,
}];
