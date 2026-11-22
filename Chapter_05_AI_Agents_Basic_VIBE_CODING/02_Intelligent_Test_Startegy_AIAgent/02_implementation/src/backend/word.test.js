import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategyDocx } from './word.js';

test('creates a Word document from strategy markdown', async () => {
  const document = await buildStrategyDocx(
    '# Proposed Test Strategy — Sample\n\n## Scope\n- **Proposed:** Review sign-in\n\n[APP-1](https://jira.example/browse/APP-1)',
  );
  assert.ok(Buffer.isBuffer(document));
  assert.equal(document.subarray(0, 2).toString(), 'PK');
  assert.ok(document.length > 1000);
});

test('rejects empty strategy content', async () => {
  await assert.rejects(() => buildStrategyDocx(' \n'), /generated Test Strategy is required/);
});
