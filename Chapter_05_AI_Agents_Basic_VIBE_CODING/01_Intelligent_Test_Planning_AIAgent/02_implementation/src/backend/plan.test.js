import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTestPlan, validatePlanData } from './plan.js';

const data = {
  inScope: 'Login acceptance criteria',
  outOfScope: '',
  objective: 'Verify documented behavior',
  questions: [],
  scenarios: [{ id: 'TS-1', priority: 'P1', type: 'positive', scenario: 'Proposed: verify documented login', mapsTo: 'AC-1' }],
  testData: '',
  environment: '',
  roles: '',
  assumptions: '',
  risks: '',
  entry: '',
  exit: '',
  resources: '',
  timeline: '',
  couldNotConfirm: '',
  blockingQuestions: '',
};

test('renders the supplied template sections and source reference', () => {
  const output = renderTestPlan({ key: 'QA-12', title: 'Login', url: 'https://jira.test/browse/QA-12' }, data);
  assert.match(output, /^# Test Plan — QA-12: Login/m);
  assert.match(output, /\[QA-12\]\(https:\/\/jira\.test\/browse\/QA-12\)/);
  assert.match(output, /## 8\. Timelines, Sprint Details/);
  assert.match(output, /Insufficient information to determine\./);
  assert.match(output, /DRAFT — pending human review/);
});

test('rejects incomplete AI response shapes', () => {
  assert.throws(() => validatePlanData({ scenarios: [] }), /required test-plan structure/);
});
