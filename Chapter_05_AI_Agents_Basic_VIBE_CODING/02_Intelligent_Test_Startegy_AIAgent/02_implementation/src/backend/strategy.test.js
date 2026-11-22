import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategyPrompt, renderStrategy, validateStrategy } from './strategy.js';

const data = Object.fromEntries([
  'projectUnderstanding', 'scopeIn', 'scopeOut', 'testingApproach', 'testLevels',
  'testTypes', 'riskStrategy', 'automationStrategy', 'environmentStrategy',
  'testDataStrategy', 'defectManagement', 'entryCriteria', 'exitCriteria',
  'qualityMetrics', 'roles', 'assumptions', 'dependencies', 'openQuestions',
  'sourcesAndTraceability',
].map((key) => [key, '']));

test('proposed template remains clearly labeled and covers required sections', () => {
  const markdown = renderStrategy('Sample', {
    ...data,
    projectUnderstanding: 'The supplied context describes a web application.',
    scopeIn: ['Review documented login requirements'],
  }, {
    projects: [],
    issues: [{ key: 'APP-1', summary: 'Login', description: 'Users can sign in', comments: [] }],
    sources: [{ key: 'APP-1', url: 'https://jira.example/browse/APP-1' }],
  }, 'Web application with sign-in');
  assert.match(markdown, /^# Proposed Test Strategy — Sample/m);
  assert.match(markdown, /Template status:\*\* Proposed structure/);
  assert.match(markdown, /Document Status:\*\* DRAFT — Pending Human Review/);
  assert.match(markdown, /## 11\. Quality Metrics and Reporting/);
  assert.match(markdown, /\[APP-1\]\(https:\/\/jira\.example\/browse\/APP-1\)/);
  assert.match(markdown, /Documented Project Inputs/);
  assert.match(markdown, /Web application with sign-in/);
  assert.match(markdown, /\*\*Proposed:\*\*/);
  assert.match(markdown, /Insufficient information to determine\./);
});

test('rejects incomplete strategy JSON', () => {
  assert.throws(() => validateStrategy({ scopeIn: 'Only one field' }), /proposed Test Strategy structure/);
});

test('rejects unsupported field types from the AI response', () => {
  assert.throws(() => validateStrategy({ ...data, scopeIn: { invented: true } }), /proposed Test Strategy structure/);
});

test('replaces quality thresholds unless the source requirements support them', () => {
  assert.deepEqual(
    validateStrategy({ ...data, qualityMetrics: ['Pass rate >= 95%'] }).qualityMetrics,
    ['Insufficient information to determine.'],
  );
  assert.deepEqual(
    validateStrategy({ ...data, qualityMetrics: ['Pass rate >= 95%'] }, 'A pass rate target of 95% is required.').qualityMetrics,
    ['Pass rate >= 95%'],
  );
});

test('prompt treats Jira records as untrusted and requests project strategy', () => {
  const prompt = buildStrategyPrompt({
    projectName: 'Sample',
    projectContext: '',
    jiraData: { projects: [], issues: [{ key: 'APP-1', description: 'source' }] },
  });
  assert.match(prompt, /not test cases/);
  assert.match(prompt, /untrusted source data/);
  assert.match(prompt, /qualityMetrics/);
});
