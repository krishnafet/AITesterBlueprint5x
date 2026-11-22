import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchIssues, parseIssueKeys } from './jira.js';

test('validates and deduplicates Jira issue keys', () => {
  assert.deepEqual(parseIssueKeys('app-1, APP-1 APP-2'), ['APP-1', 'APP-2']);
  assert.throws(() => parseIssueKeys('APP'), /issue keys/);
  assert.throws(() => parseIssueKeys(Array.from({ length: 11 }, (_, i) => `APP-${i + 1}`).join(',')), /up to 10/);
});

test('retrieves issue details using read-only Jira API and maps traceability', async () => {
  let requested;
  const result = await fetchIssues('APP-1', {
    baseUrl: 'https://jira.example',
    email: 'qa@example.com',
    token: 'test-token',
  }, async (url, options) => {
    requested = { url: String(url), options };
    return {
      ok: true,
      json: async () => ({
        key: 'APP-1',
        fields: {
          summary: 'Sign in',
          description: { content: [{ content: [{ text: 'Users can sign in.' }] }] },
          issuetype: { name: 'Story' },
          status: { name: 'Open' },
          comment: { comments: [{ body: 'AC-1 is sign in.' }] },
        },
      }),
    };
  });
  assert.match(requested.url, /\/rest\/api\/2\/issue\/APP-1/);
  assert.equal(requested.options.method, undefined);
  assert.equal(result[0].key, 'APP-1');
  assert.equal(result[0].summary, 'Sign in');
  assert.match(result[0].url, /\/browse\/APP-1$/);
  assert.equal(result[0].comments[0], 'AC-1 is sign in.');
});
