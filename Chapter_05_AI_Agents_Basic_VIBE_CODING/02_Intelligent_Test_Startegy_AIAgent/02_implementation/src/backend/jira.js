export function parseReferences(value) {
  const references = String(value || '').split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);
  if (!references.length) return [];
  if (references.length > 20 || references.some((item) => !/^[A-Z][A-Z0-9_]*(?:-\d+)?$/.test(item))) {
    throw new Error('Enter a Jira project key or comma-separated issue keys, for example APP or APP-12, APP-13.');
  }
  return [...new Set(references)];
}

export function extractJiraText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  if (typeof value.text === 'string') return value.text;
  return Object.values(value).map(extractJiraText).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function apiVersion(baseUrl) {
  const base = new URL(baseUrl);
  return process.env.JIRA_API_VERSION || (base.hostname.endsWith('.atlassian.net') ? '3' : '2');
}

function apiUrl(baseUrl, path, query = '') {
  const base = new URL(baseUrl);
  const prefix = base.pathname.replace(/\/+$/, '');
  const url = new URL(`${prefix}/rest/api/${apiVersion(baseUrl)}/${path.replace(/^\/+/, '')}`, base.origin);
  if (query) url.search = query;
  return url;
}

async function jiraFetch(url, credentials, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${credentials.email}:${credentials.token}`).toString('base64')}`,
    },
    signal: AbortSignal.timeout(20000),
  });
  if (response.status === 401) throw new Error('Jira authentication failed. Check the Jira email and API token.');
  if (response.status === 403) throw new Error('Jira access denied. Check project permissions.');
  if (response.status === 404) throw new Error('Jira project or issue was not found or is not accessible.');
  if (!response.ok) throw new Error(`Jira request failed (HTTP ${response.status}).`);
  return response.json();
}

function mapIssue(issue, baseUrl) {
  const fields = issue.fields || {};
  const base = new URL(baseUrl);
  const basePath = base.pathname.replace(/\/+$/, '');
  return {
    key: issue.key,
    url: new URL(`${basePath}/browse/${encodeURIComponent(issue.key)}`, base.origin).href,
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
  };
}

export async function fetchProjectContext(references, credentials, fetchImpl = fetch) {
  const entries = parseReferences(references);
  const sources = [];
  const projects = [];
  const issues = [];

  for (const entry of entries) {
    if (entry.includes('-')) {
      const issue = await jiraFetch(
        apiUrl(credentials.baseUrl, `issue/${encodeURIComponent(entry)}`, 'fields=summary,description,issuetype,labels,components,priority,status,issuelinks,comment'),
        credentials,
        fetchImpl,
      );
      issues.push(mapIssue(issue, credentials.baseUrl));
      continue;
    }

    const project = await jiraFetch(apiUrl(credentials.baseUrl, `project/${encodeURIComponent(entry)}`), credentials, fetchImpl);
    projects.push({
      key: project.key,
      name: project.name || '',
      description: extractJiraText(project.description),
      url: new URL(`/plugins/servlet/project-config/${encodeURIComponent(project.key)}`, credentials.baseUrl).href,
    });
    const jql = `project = "${entry}" ORDER BY key ASC`;
    const search = await jiraFetch(
      apiUrl(credentials.baseUrl, 'search', new URLSearchParams({
        jql,
        maxResults: '50',
        fields: 'summary,description,issuetype,labels,components,priority,status,issuelinks,comment',
      }).toString()),
      credentials,
      fetchImpl,
    );
    issues.push(...(search.issues || []).map((issue) => mapIssue(issue, credentials.baseUrl)));
  }

  for (const issue of issues) {
    sources.push({ key: issue.key, url: issue.url });
    for (const link of issue.links) {
      if (link.key && !sources.some((source) => source.key === link.key)) {
        sources.push({ key: link.key, url: new URL(`/browse/${encodeURIComponent(link.key)}`, credentials.baseUrl).href });
      }
    }
  }

  return { projects, issues, sources };
}
