import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'node:path';

import * as esbuild from 'esbuild';
import { BuildOptions } from 'esbuild';
import { pluginReplace } from '@espcom/esbuild-plugin-replace';
import { transformAsync } from '@babel/core';
// @ts-expect-error no types
import solid from 'babel-preset-solid';
// @ts-expect-error no types
import ts from '@babel/preset-typescript';

const pkg = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf8'));

const buildConfig: BuildOptions = {
  entryPoints: [path.resolve(process.cwd(), 'src')],
  bundle: true,
  metafile: true,
  sourcemap: false,
  target: 'es2022',
  packages: 'external',
  write: true,
  minify: false,
  treeShaking: true,
  external: Object.keys(pkg.peerDependencies || {}),
  plugins: [
    pluginReplace([
      {
        filter: /\.tsx?$/,
        replace: /.*/gs,
        replacer(onLoadArgs) {
          return async (source) => {
            // eslint-disable-next-line no-restricted-syntax
            const result = await transformAsync(source, {
              presets: [[solid], [ts]],
              filename: parse(onLoadArgs.path).base,
              sourceMaps: 'inline',
            });

            if (result?.code == null) {
              throw new Error('No result was provided from Babel');
            }

            return result.code;
          };
        },
      },
    ]),
  ],
};

// @ts-expect-error node only
await Promise.all([
  esbuild.build({
    ...buildConfig,
    format: 'esm',
    outfile: path.resolve(process.cwd(), pkg.exports.import),
  }),
  esbuild.build({
    ...buildConfig,
    format: 'cjs',
    outfile: path.resolve(process.cwd(), pkg.exports.require),
  }),
]);
