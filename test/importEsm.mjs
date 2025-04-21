import { describe, it } from 'node:test';
import assert from 'node:assert';

// eslint-disable-next-line import/no-unresolved
import * as exportContent from '../dist/esm/index.js';

void describe('Test import esm', async () => {
  await it('success', () => {
    assert.deepEqual(Object.keys(exportContent), ['fnAny']);
    assert.deepEqual(typeof exportContent.fnAny, 'function');
  });
});
