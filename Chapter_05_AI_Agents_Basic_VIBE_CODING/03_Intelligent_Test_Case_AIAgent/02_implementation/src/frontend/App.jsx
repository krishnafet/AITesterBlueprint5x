import { useEffect, useState } from 'react';

async function request(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

const emptyJira = { baseUrl: '', email: '', token: '' };
const emptyAI = { groqApiKey: '', groqModel: '', ollamaBaseUrl: '', ollamaModel: '' };
const list = (items) => items?.length ? items.join('; ') : 'Insufficient information to determine.';

export default function App() {
  const [page, setPage] = useState('main');
  const [references, setReferences] = useState('');
  const [testPlan, setTestPlan] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [projectName, setProjectName] = useState('');
  const [provider, setProvider] = useState('groq');
  const [jira, setJira] = useState(emptyJira);
  const [ai, setAI] = useState(emptyAI);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState('');
  const [jiraStatus, setJiraStatus] = useState('');
  const [aiStatus, setAIStatus] = useState('');

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((settings) => {
        if (settings.jira) setJira((value) => ({ ...value, baseUrl: settings.jira.baseUrl || '' }));
        if (settings.ai?.provider) setProvider(settings.ai.provider);
      })
      .catch(() => {});
  }, []);

  async function generate(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const generated = await request('/api/test-cases', {
        references,
        testPlan,
        additionalRequirements,
        provider,
        jira,
        ai,
      });
      setResult(generated);
    } catch (cause) {
      setError(cause.message || 'Test Case generation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function downloadWord() {
    if (!result?.testCases.length || exporting) return;
    setExporting(true);
    setError('');
    try {
      const response = await fetch('/api/test-cases/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ projectName, testCases: result.testCases }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Word document export failed.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = projectName.trim().replace(/[^\w-]+/g, '-') || 'test-cases';
      link.href = url;
      link.download = `${fileName}-test-cases.docx`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause.message || 'Word document export failed.');
    } finally {
      setExporting(false);
    }
  }

  async function testConnection(kind, event) {
    event?.preventDefault();
    setBusy(kind);
    if (kind === 'jira') setJiraStatus('');
    else setAIStatus('');
    try {
      const response = await request(`/api/${kind}/test`, { provider, jira, ai });
      if (kind === 'jira') setJiraStatus(response.message);
      else setAIStatus(response.message);
    } catch (cause) {
      if (kind === 'jira') setJiraStatus(cause.message);
      else setAIStatus(cause.message);
    } finally {
      setBusy('');
    }
  }

  const updateJira = (field) => (event) => setJira((value) => ({ ...value, [field]: event.target.value }));
  const updateAI = (field) => (event) => setAI((value) => ({ ...value, [field]: event.target.value }));

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setPage('main')}>
          <span className="brand-mark">T</span> Test Case Studio
        </a>
        <nav aria-label="Main navigation">
          <button className={page === 'main' ? 'nav active' : 'nav'} onClick={() => setPage('main')}>Test Cases</button>
          <button className={page === 'settings' ? 'nav active' : 'nav'} onClick={() => setPage('settings')}>Settings</button>
        </nav>
        <span className="readonly"><i /> Jira read-only</span>
      </header>

      <main className="content">
        {page === 'main' ? (
          <section>
            <div className="heading">
              <div>
                <p className="eyebrow">REQUIREMENTS · TRACEABILITY · TEST CASES</p>
                <h1>Turn requirements into test cases</h1>
                <p className="subheading">Use Jira issues, an approved Test Plan, or requirement details to create a reviewable draft.</p>
              </div>
              <button className="outline-button" onClick={() => setPage('settings')}>Connection settings ↗</button>
            </div>

            <form className="form-card" onSubmit={generate}>
              <div className="two-fields">
                <label>Project or document name <span className="optional">Optional</span>
                  <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="e.g. Checkout release" disabled={loading} />
                </label>
                <label>Jira issue keys <span className="optional">Up to 10 · optional</span>
                  <input value={references} onChange={(event) => setReferences(event.target.value)} placeholder="e.g. APP-12, APP-13" disabled={loading} />
                </label>
              </div>
              <label>Approved Test Plan <span className="optional">Optional · paste text</span>
                <textarea value={testPlan} onChange={(event) => setTestPlan(event.target.value)} placeholder="Paste approved scope, scenarios, acceptance criteria, test data, risks, or dependencies." rows={6} disabled={loading} />
              </label>
              <label>Additional requirements or clarifications <span className="optional">Optional</span>
                <textarea value={additionalRequirements} onChange={(event) => setAdditionalRequirements(event.target.value)} placeholder="Add documented requirements or clarification. Avoid sensitive production data." rows={3} disabled={loading} />
              </label>
              <div className="form-bottom">
                <p>Generated cases stay in draft. Review source references, gaps, test data, and expected results before use.</p>
                <button className="primary-button" disabled={loading || (!references.trim() && !testPlan.trim() && !additionalRequirements.trim())}>
                  {loading ? <><span className="spinner" /> Generating…</> : <>Generate Test Cases <span>→</span></>}
                </button>
              </div>
            </form>

            {error && <div className="alert" role="alert">{error}</div>}

            <section className="output-card" aria-live="polite">
              <div className="output-heading">
                <div><p className="eyebrow">GENERATED DOCUMENT</p><h2>{result ? `${result.testCases.length} Test Case${result.testCases.length === 1 ? '' : 's'} · Draft` : 'Your test cases appear here'}</h2></div>
                {result && result.testCases.length > 0 && (
                  <button className="outline-button" onClick={downloadWord} disabled={exporting}>
                    {exporting ? 'Preparing Word document…' : 'Download Word (.docx)'}
                  </button>
                )}
              </div>
              {loading ? (
                <div className="empty"><span className="spinner big" /><p>Retrieving Jira requirements and generating test cases…</p></div>
              ) : result ? (
                <div className="results">
                  <div className="status-banner">
                    <strong>DRAFT — Pending Human Review</strong>
                    <span>Approval Status: Not Approved</span>
                    <span>Review Required: QA Engineer / QA Lead / Authorized Stakeholder</span>
                  </div>
                  {result.sources.length > 0 && <div className="sources">Jira sources: {result.sources.map((source) => <a key={source.key} href={source.url} target="_blank" rel="noreferrer">{source.key}</a>)}</div>}
                  <section className="analysis">
                    <h3>Requirement analysis</h3>
                    {result.requirementAnalysis.confirmedRequirements.length > 0 && (
                      <div><h4>Source-backed requirements</h4><ul>{result.requirementAnalysis.confirmedRequirements.map((item, index) => <li key={index}><b>{item.reference}</b> — {item.description}</li>)}</ul></div>
                    )}
                    <div className="analysis-grid">
                      <div><h4>Gaps</h4><ul>{result.requirementAnalysis.gaps.length ? result.requirementAnalysis.gaps.map((item, index) => <li key={index}>{item}</li>) : <li>{'Insufficient information to determine.'}</li>}</ul></div>
                      <div><h4>Conflicts & questions</h4><ul>{[...result.requirementAnalysis.conflicts, ...result.requirementAnalysis.questions].length
                        ? [...result.requirementAnalysis.conflicts, ...result.requirementAnalysis.questions].map((item, index) => <li key={index}>{item}</li>)
                        : <li>{'Insufficient information to determine.'}</li>}</ul></div>
                    </div>
                  </section>
                  {result.testCases.length ? result.testCases.map((item) => (
                    <article className="case-card" key={item.id}>
                      <div className="case-heading">
                        <div><span className="case-id">{item.id}</span><h3>{item.title}</h3></div>
                        <span className={`priority ${item.priority.startsWith('P0') ? 'critical' : item.priority === 'P1' ? 'high' : ''}`}>{item.priority}</span>
                      </div>
                      <div className="case-tags"><span>{item.testType}</span><span>Requirement: {item.requirementReference}</span></div>
                      <p className="rationale">{item.priorityRationale}</p>
                      <div className="case-details">
                        <section><h4>Preconditions</h4><ul>{(item.preconditions.length ? item.preconditions : ['Insufficient information to determine.']).map((line, index) => <li key={index}>{line}</li>)}</ul></section>
                        <section><h4>Test data</h4><ul>{(item.testData.length ? item.testData : ['Insufficient information to determine.']).map((line, index) => <li key={index}>{line}</li>)}</ul></section>
                      </div>
                      <h4>Execution steps</h4>
                      <div className="table-scroll"><table><thead><tr><th>Step</th><th>Action</th><th>Expected result</th></tr></thead><tbody>
                        {item.steps.map((step, index) => <tr key={index}><td>{index + 1}</td><td>{step.action}</td><td>{step.expectedResult}</td></tr>)}
                      </tbody></table></div>
                    </article>
                  )) : <div className="empty"><p>No test cases could be generated from the supplied requirements.</p></div>}
                </div>
              ) : <div className="empty"><span className="sparkle">✳</span><p>Add requirements to get started.</p></div>}
            </section>
            <p className="review"><span>ⓘ</span> Proposed structure — no authoritative Test Case template was supplied. Review before submission.</p>
          </section>
        ) : (
          <section className="settings">
            <div className="heading">
              <div><p className="eyebrow">CONFIGURATION</p><h1>Settings</h1><p className="subheading">Credentials stay in page memory and are sent only with requests.</p></div>
              <button className="outline-button" onClick={() => setPage('main')}>← Back</button>
            </div>
            <form className="settings-card" onSubmit={(event) => testConnection('jira', event)}>
              <div className="card-title"><span className="icon jira-icon">J</span><div><h2>Jira connection</h2><p>Issue details are retrieved read-only.</p></div></div>
              <div className="grid">
                <label>Jira URL<input type="url" value={jira.baseUrl} onChange={updateJira('baseUrl')} placeholder="https://your-team.atlassian.net" /></label>
                <label>Email<input type="email" value={jira.email} onChange={updateJira('email')} placeholder="you@company.com" /></label>
                <label className="full">API token<input type="password" autoComplete="new-password" value={jira.token} onChange={updateJira('token')} placeholder="Leave empty to use server configuration" /></label>
              </div>
              <div className="action-row"><button className="outline-button" disabled={busy === 'jira'}>{busy === 'jira' ? 'Testing…' : 'Test connection'}</button>{jiraStatus && <span className={jiraStatus.startsWith('Connected') ? 'success' : 'failure'} role="status">{jiraStatus}</span>}</div>
            </form>
            <section className="settings-card">
              <div className="card-title"><span className="icon ai-icon">✳</span><div><h2>AI provider</h2><p>Select and test the provider used for test-case generation.</p></div></div>
              <div className="providers">
                <label className={provider === 'groq' ? 'provider selected' : 'provider'}><input type="radio" name="provider" checked={provider === 'groq'} onChange={() => { setProvider('groq'); setAIStatus(''); }} /><span><b>Groq.com</b><small>Cloud model</small></span></label>
                <label className={provider === 'ollama' ? 'provider selected' : 'provider'}><input type="radio" name="provider" checked={provider === 'ollama'} onChange={() => { setProvider('ollama'); setAIStatus(''); }} /><span><b>Ollama</b><small>Local model</small></span></label>
              </div>
              <div className="grid provider-inputs">
                {provider === 'groq' ? <>
                  <label className="full">Groq API key<input type="password" autoComplete="new-password" value={ai.groqApiKey} onChange={updateAI('groqApiKey')} placeholder="Leave empty to use server configuration" /></label>
                  <label className="full">Model<input value={ai.groqModel} onChange={updateAI('groqModel')} placeholder="Configured Groq model" /></label>
                </> : <>
                  <label className="full">Ollama URL<input type="url" value={ai.ollamaBaseUrl} onChange={updateAI('ollamaBaseUrl')} placeholder="http://127.0.0.1:11434" /></label>
                  <label className="full">Model<input value={ai.ollamaModel} onChange={updateAI('ollamaModel')} placeholder="Installed Ollama model" /></label>
                </>}
              </div>
              <div className="action-row"><button className="outline-button" type="button" disabled={busy === 'ai'} onClick={() => testConnection('ai')}>{busy === 'ai' ? 'Testing…' : `Test ${provider === 'groq' ? 'Groq.com' : 'Ollama'}`}</button>{aiStatus && <span className={aiStatus.startsWith('Connected') ? 'success' : 'failure'} role="status">{aiStatus}</span>}</div>
              <p className="privacy">Credentials entered here are cleared on page reload and are not written to browser storage. Use HTTPS on shared networks.</p>
            </section>
          </section>
        )}
      </main>
      <footer><span>Test Case Studio</span><span>Read-only Jira · Human-reviewed draft</span></footer>
    </div>
  );
}
