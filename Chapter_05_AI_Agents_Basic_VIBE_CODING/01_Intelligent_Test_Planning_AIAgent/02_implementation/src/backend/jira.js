export function isValidIssueKey(value) {
  return /^[A-Za-z][A-Za-z0-9_]*-\d+$/.test(value);
}

export function extractDescription(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  if (typeof value.text === 'string') return value.text;
  return Object.values(value)
    .map(extractDescription)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchJiraIssue({ baseUrl, email, token, issueKey, fetchImpl = fetch }) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new Error('Jira base URL must use HTTP or HTTPS.');
  }
  const basePath = base.pathname.replace(/\/+$/, '');
  const version = process.env.JIRA_API_VERSION ||
    (base.hostname.endsWith('.atlassian.net') ? '3' : '2');
  const issueUrl = new URL(
    `${basePath}/rest/api/${version}/issue/${encodeURIComponent(issueKey)}?fields=summary,description,issuetype,labels,components,priority,status`,
    base.origin,
  );
  const response = await fetchImpl(issueUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error('Jira authentication failed or this account cannot read the issue.');
  }
  if (response.status === 404) throw new Error('Jira issue was not found or is not accessible.');
  if (!response.ok) throw new Error(`Jira request failed (HTTP ${response.status}).`);

  const issue = await response.json();
  return {
    key: issue.key || issueKey,
    title: issue.fields?.summary || 'Untitled Jira issue',
    url: new URL(`${basePath}/browse/${encodeURIComponent(issue.key || issueKey)}`, base.origin).href,
    type: issue.fields?.issuetype?.name || '',
    status: issue.fields?.status?.name || '',
    priority: issue.fields?.priority?.name || '',
    labels: issue.fields?.labels || [],
    components: (issue.fields?.components || []).map((component) => component.name),
    description: extractDescription(issue.fields?.description),
  };
}
