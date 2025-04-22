/* eslint-disable @typescript-eslint/no-require-imports */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const exportContent = require('../dist/cjs/index');

void describe('Test import cjs', async () => {
  await it('success', () => {
    assert.deepEqual(Object.keys(exportContent), ['addState']);
    assert.deepEqual(typeof exportContent.addState, 'function');
  });
});
