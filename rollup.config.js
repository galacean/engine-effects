import { getPlugins } from './scripts/rollup-config-helper';
import spineConfig from './rollup.spine.config';
import appxConfig from './rollup.appx.config';

const pkg = require('./package.json');
const banner = `/*!
 * Name: ${pkg.name}
 * Description: ${pkg.description}
 * Author: ${pkg.author}
 * Contributors: ${pkg.contributors.map(c => c.name).join(',')}
 * Version: v${pkg.version}
 */
`;

const globals = {
  '@galacean/engine': 'Galacean',
};
const external = Object.keys(globals);
const plugins = getPlugins(pkg);

export default (commandLineArgs) => {
  return [
    {
      input: 'src/index.ts',
      output: [{
        file: pkg.module,
        format: 'es',
        banner,
        globals,
        sourcemap: true,
      }, {
        file: pkg.main,
        format: 'cjs',
        banner,
        globals,
        sourcemap: true,
      }],
      external,
      plugins,
    }, {
      input: 'src/index.ts',
      output: {
        file: pkg.brower,
        format: 'umd',
        name: 'Galacean.effects',
        banner,
        globals,
        sourcemap: true,
      },
      external,
      plugins: getPlugins(pkg, { min: true }),
    },
    ...spineConfig,
    ...appxConfig.map(config => ({ ...config, plugins: plugins.concat(config.plugins) }))
  ];
};
