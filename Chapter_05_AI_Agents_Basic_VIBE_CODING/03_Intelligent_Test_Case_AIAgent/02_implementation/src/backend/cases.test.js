import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCasePrompt, missing, validateCaseDocument } from './cases.js';

const jiraIssues = [{ key: 'APP-12', url: 'https://jira.example/browse/APP-12', summary: 'Sign in', description: 'Users can sign in.' }];
const sourceText = `${JSON.stringify(jiraIssues)}\nAC-1 When the user submits a valid username and password, the application authenticates the user.`;

test('builds a source-first test case generation prompt', () => {
  const prompt = buildCasePrompt({ jiraIssues, testPlan: 'AC-1 Users can sign in.', additionalRequirements: '' });
  assert.match(prompt, /untrusted source data/);
  assert.match(prompt, /stable sequential ID/);
  assert.match(prompt, /positive, negative, boundary/);
  assert.match(prompt, /proposed default test-case structure/);
});

test('assigns deterministic IDs and preserves source-backed traceability', () => {
  const result = validateCaseDocument({
    requirementAnalysis: { confirmedRequirements: [], gaps: [], conflicts: [], questions: [] },
    testCases: [{
      id: 'random',
      title: 'The application authenticates the user',
      requirementReference: 'AC-1',
      priority: 'P1',
      priorityRationale: 'Insufficient information to determine.',
      testType: 'Positive',
      preconditions: [],
      testData: ['Valid username and password.'],
      steps: [{ action: 'The user submits a valid username and password.', expectedResult: 'The application authenticates the user.' }],
    }],
  }, { sourceText, jiraIssues });
  assert.equal(result.testCases[0].id, 'TC-001');
  assert.equal(result.testCases[0].requirementReference, 'AC-1');
  assert.equal(result.testCases[0].priority, 'QA review required');
  assert.equal(result.testCases[0].steps[0].expectedResult, 'The application authenticates the user.');
  assert.equal(result.sources[0].key, 'APP-12');
});

test('does not trust invented requirement references or priorities', () => {
  const result = validateCaseDocument({
    requirementAnalysis: { confirmedRequirements: [], gaps: [], conflicts: [], questions: [] },
    testCases: [{
      title: 'Verify an undocumented error',
      requirementReference: 'AC-999',
      priority: 'Urgent',
      testType: 'Other',
      steps: [{ action: '', expectedResult: '' }],
    }],
  }, { sourceText, jiraIssues });
  assert.equal(result.testCases.length, 0);
  assert.match(result.requirementAnalysis.questions[0], /verified requirement reference/);
});

test('replaces undocumented UI behavior and invented test data with missing-information markers', () => {
  const result = validateCaseDocument({
    requirementAnalysis: { confirmedRequirements: [], gaps: [], conflicts: [], questions: [] },
    testCases: [{
      title: 'The application authenticates the user',
      requirementReference: 'REQ-1',
      priority: 'P1',
      priorityRationale: 'A critical workflow.',
      testType: 'Positive',
      preconditions: ['Login page is reachable.'],
      testData: ['username: validUser', 'valid username and password'],
      steps: [
        { action: 'Click the login button.', expectedResult: 'The user is redirected to dashboard.' },
        { action: 'The user submits a valid username and password.', expectedResult: 'The application authenticates the user.' },
      ],
    }],
  }, { sourceText: `${sourceText}\nREQ-1 When the user submits a valid username and password, the application authenticates the user.`, jiraIssues });
  const item = result.testCases[0];
  assert.equal(item.preconditions[0], missing);
  assert.equal(item.testData[0], missing);
  assert.equal(item.testData[1], 'valid username and password');
  assert.equal(item.steps[0].action, missing);
  assert.equal(item.steps[0].expectedResult, missing);
  assert.equal(item.steps[1].expectedResult, 'The application authenticates the user.');
  assert.equal(item.priority, 'QA review required');
});

test('derives only a directly specified submit action and result when model steps are unsupported', () => {
  const requirement = 'When the user submits a valid username and password, the application authenticates the user.';
  const result = validateCaseDocument({
    requirementAnalysis: {
      confirmedRequirements: [{ reference: 'REQ-1', description: requirement }],
      gaps: [],
      conflicts: [],
      questions: [],
    },
    testCases: [{
      title: 'Verify login redirects to dashboard',
      requirementReference: 'REQ-1',
      priority: 'P1',
      priorityRationale: 'Core workflow',
      testType: 'Positive',
      preconditions: ['Login page is open.'],
      testData: ['username: validUser'],
      steps: [{ action: 'Click the login button.', expectedResult: 'Redirect to dashboard.' }],
    }],
  }, { sourceText: `${sourceText}\nREQ-1: ${requirement}`, jiraIssues });
  assert.equal(result.testCases[0].title, 'Submit a valid username and password');
  assert.equal(result.testCases[0].steps[0].action, `The user submits a valid username and password.`);
  assert.equal(result.testCases[0].steps[0].expectedResult, 'The application authenticates the user.');
  assert.equal(result.testCases[0].testData[0], 'a valid username and password');
  assert.equal(result.testCases[0].priority, 'QA review required');
});

test('rejects malformed AI response', () => {
  assert.throws(() => validateCaseDocument({}, { sourceText, jiraIssues }), /proposed Test Case structure/);
});
