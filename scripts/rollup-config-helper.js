import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { swc, defineRollupSwcOption, minify } from 'rollup-plugin-swc3';

export function getPlugins(pkg, options = {}) {
  const { min = false, target } = options;
  const plugins = [
    getSWCPlugin({ target }),
    resolve(),
    commonjs(),
  ];

  if (min) {
    plugins.push(minify({ sourceMap: true }));
  }

  return plugins;
}

export function getSWCPlugin(
  jscOptions = {},
) {
  const jsc = {
    loose: true,
    externalHelpers: true,
    target: 'ES5',
    ...jscOptions,
  }
  const options = {
    exclude: [],
    jsc,
    sourceMaps: true,
  };

  return swc(
    defineRollupSwcOption(options),
  );
}

