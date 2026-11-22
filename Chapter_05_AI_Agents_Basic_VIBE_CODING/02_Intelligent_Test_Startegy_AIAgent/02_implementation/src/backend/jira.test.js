import test from 'node:test';
import assert from 'node:assert/strict';
import { extractJiraText, fetchProjectContext, parseReferences } from './jira.js';

test('parses project keys and issue references safely', () => {
  assert.deepEqual(parseReferences('app, APP-12'), ['APP', 'APP-12']);
  assert.throws(() => parseReferences('APP-12/path'), /Enter a Jira project key/);
  assert.throws(() => parseReferences('A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U'), /Enter a Jira project key/);
});

test('extracts Atlassian rich text', () => {
  assert.equal(extractJiraText({ content: [{ content: [{ text: 'Need coverage' }] }] }), 'Need coverage');
});

test('loads a Jira project and bounded issue list with traceable links', async () => {
  const urls = [];
  const result = await fetchProjectContext('APP', {
    baseUrl: 'https://sample.atlassian.net',
    email: 'qa@example.test',
    token: 'test-token',
  }, async (url) => {
    urls.push(String(url));
    if (String(url).includes('/project/APP')) return Response.json({ key: 'APP', name: 'Application' });
    return Response.json({
      issues: [{
        key: 'APP-1',
        fields: {
          summary: 'Login',
          description: { content: [{ text: 'Documented login requirements' }] },
          issuetype: { name: 'Story' },
          comment: { comments: [{ body: 'Review acceptance criteria' }] },
          issuelinks: [],
        },
      }],
    });
  });
  assert.equal(result.projects[0].name, 'Application');
  assert.equal(result.issues[0].description, 'Documented login requirements');
  assert.equal(result.issues[0].comments[0], 'Review acceptance criteria');
  assert.deepEqual(result.sources, [{ key: 'APP-1', url: 'https://sample.atlassian.net/browse/APP-1' }]);
  assert.ok(urls.some((url) => url.includes('maxResults=50')));
});
