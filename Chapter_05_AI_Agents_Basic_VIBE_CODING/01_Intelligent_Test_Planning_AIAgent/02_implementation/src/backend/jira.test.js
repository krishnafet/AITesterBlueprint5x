import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDescription, fetchJiraIssue, isValidIssueKey } from './jira.js';

test('validates Jira issue keys without accepting arbitrary input', () => {
  assert.equal(isValidIssueKey('QA-123'), true);
  assert.equal(isValidIssueKey('TEAM_1-9'), true);
  assert.equal(isValidIssueKey('QA-1/path'), false);
  assert.equal(isValidIssueKey('https://example.com'), false);
});

test('extracts readable text from Jira rich-text descriptions', () => {
  assert.equal(
    extractDescription({ content: [{ content: [{ text: 'As a user' }] }, { text: 'I can sign in' }] }),
    'As a user I can sign in',
  );
});

test('maps Jira response fields and preserves the source link', async () => {
  const issue = await fetchJiraIssue({
    baseUrl: 'https://sample.atlassian.net',
    email: 'qa@example.test',
    token: 'test-token',
    issueKey: 'QA-12',
    fetchImpl: async (url, options) => {
      assert.match(String(url), /\/rest\/api\/3\/issue\/QA-12\?/);
      assert.equal(options.headers.Accept, 'application/json');
      return Response.json({
        key: 'QA-12',
        fields: {
          summary: 'Login flow',
          description: { content: [{ text: 'Validate sign in' }] },
          labels: ['auth'],
          components: [{ name: 'Web' }],
          issuetype: { name: 'Story' },
          priority: { name: 'High' },
          status: { name: 'Open' },
        },
      });
    },
  });
  assert.equal(issue.title, 'Login flow');
  assert.equal(issue.description, 'Validate sign in');
  assert.equal(issue.url, 'https://sample.atlassian.net/browse/QA-12');
  assert.deepEqual(issue.labels, ['auth']);
});

test('preserves a Jira deployment context path in API and source URLs', async () => {
  const issue = await fetchJiraIssue({
    baseUrl: 'https://jira.example.test/jira/',
    email: 'qa@example.test',
    token: 'test-token',
    issueKey: 'QA-12',
    fetchImpl: async (url) => {
      assert.match(String(url), /\/jira\/rest\/api\/2\/issue\/QA-12\?/);
      return Response.json({ key: 'QA-12', fields: { summary: 'Login' } });
    },
  });
  assert.equal(issue.url, 'https://jira.example.test/jira/browse/QA-12');
});
