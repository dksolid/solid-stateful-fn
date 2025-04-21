import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { fnAny } from '../src/index.js';

void describe('Sample test', async () => {
  await it('function does not throw errors', () => {
    assert.doesNotThrow(() => fnAny());
  });
});
