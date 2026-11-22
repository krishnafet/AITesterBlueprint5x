const issueKeyPattern = /^[A-Z][A-Z0-9_]*-\d+$/;

export function parseIssueKeys(value) {
  const keys = String(value || '').split(/[,\s]+/).map((key) => key.trim().toUpperCase()).filter(Boolean);
  if (!keys.length) return [];
  if (keys.length > 10 || keys.some((key) => !issueKeyPattern.test(key))) {
    throw new Error('Enter up to 10 Jira issue keys, for example APP-12, APP-13.');
  }
  return [...new Set(keys)];
}

export function extractJiraText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  if (typeof value.text === 'string') return value.text;
  return Object.values(value).map(extractJiraText).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export async function fetchIssues(references, credentials, fetchImpl = fetch) {
  const keys = parseIssueKeys(references);
  const base = new URL(credentials.baseUrl);
  const prefix = base.pathname.replace(/\/+$/, '');
  const apiVersion = process.env.JIRA_API_VERSION || (base.hostname.endsWith('.atlassian.net') ? '3' : '2');
  const issues = [];

  for (const key of keys) {
    const url = new URL(`${prefix}/rest/api/${apiVersion}/issue/${encodeURIComponent(key)}`, base.origin);
    url.searchParams.set('fields', 'summary,description,issuetype,priority,status,labels,components,issuelinks,comment');
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${credentials.email}:${credentials.token}`).toString('base64')}`,
      },
      signal: AbortSignal.timeout(20000),
    });
    if (response.status === 401) throw new Error('Jira authentication failed. Check the Jira email and API token.');
    if (response.status === 403) throw new Error('Jira access denied. Check project permissions.');
    if (response.status === 404) throw new Error(`Jira issue ${key} was not found or is not accessible.`);
    if (!response.ok) throw new Error(`Jira request failed (HTTP ${response.status}).`);

    const issue = await response.json();
    const fields = issue.fields || {};
    issues.push({
      key: issue.key || key,
      url: new URL(`${prefix}/browse/${encodeURIComponent(issue.key || key)}`, base.origin).href,
      summary: fields.summary || '',
      type: fields.issuetype?.name || '',
      status: fields.status?.name || '',
      priority: fields.priority?.name || '',
      labels: fields.labels || [],
      components: (fields.components || []).map((component) => component.name),
      description: extractJiraText(fields.description),
      comments: (fields.comment?.comments || []).map((comment) => extractJiraText(comment.body)).filter(Boolean),
      links: (fields.issuelinks || []).map((link) => ({
        type: link.type?.name || '',
        key: link.inwardIssue?.key || link.outwardIssue?.key || '',
        summary: link.inwardIssue?.fields?.summary || link.outwardIssue?.fields?.summary || '',
      })),
    });
  }
  return issues;
}
