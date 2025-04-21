import path from 'node:path';

import { getEslintConfig } from '@dksolid/eslint-config';

const eslintConfig = getEslintConfig({
  tsConfigPath: path.resolve('./tsconfig.json'),
});

// eslint-disable-next-line import/no-default-export
export default eslintConfig;
