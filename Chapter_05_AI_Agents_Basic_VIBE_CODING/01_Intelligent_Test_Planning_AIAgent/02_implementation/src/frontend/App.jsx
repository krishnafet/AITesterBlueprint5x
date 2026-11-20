import { useEffect, useState } from 'react';

async function request(path, options) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

function App() {
  const [page, setPage] = useState('main');
  const [issueKey, setIssueKey] = useState('');
  const [plan, setPlan] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);
  const [provider, setProvider] = useState('groq');
  const [jiraForm, setJiraForm] = useState({ baseUrl: '', email: '', token: '' });
  const [aiForm, setAiForm] = useState({
    groqApiKey: '',
    groqModel: '',
    ollamaBaseUrl: '',
    ollamaModel: '',
  });
  const [jiraTest, setJiraTest] = useState('');
  const [aiTest, setAiTest] = useState('');
  const [jiraBusy, setJiraBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    request('/api/settings')
      .then((data) => {
        setSettings(data);
        setProvider(data.ai.provider || 'groq');
        setJiraForm((current) => ({
          ...current,
          baseUrl: data.jira.baseUrl || '',
        }));
      })
      .catch((cause) => setError(cause.message));
  }, []);

  async function generatePlan(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setPlan('');
    setSourceUrl('');
    try {
      const result = await request('/api/test-plan', {
        method: 'POST',
        body: JSON.stringify({ issueKey, provider, jira: jiraForm, ai: aiForm }),
      });
      setPlan(result.testPlan);
      setSourceUrl(result.sourceUrl);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function testJira(event) {
    event.preventDefault();
    setJiraBusy(true);
    setJiraTest('');
    try {
      const result = await request('/api/jira/test', {
        method: 'POST',
        body: JSON.stringify(jiraForm),
      });
      setJiraTest(result.message);
    } catch (cause) {
      setJiraTest(cause.message);
    } finally {
      setJiraBusy(false);
    }
  }

  async function testAi() {
    setAiBusy(true);
    setAiTest('');
    try {
      const result = await request('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({ provider, ai: aiForm }),
      });
      setAiTest(result.message);
    } catch (cause) {
      setAiTest(cause.message);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setPage('main')}>
          <span className="brand-mark">T</span>
          <span>Test Plan Agent</span>
        </a>
        <nav aria-label="Main navigation">
          <button className={page === 'main' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('main')}>Main page</button>
          <button className={page === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('settings')}>Settings</button>
        </nav>
        <span className="status-label"><span className="status-dot" /> Jira read-only</span>
      </header>

      <main className="content">
        {page === 'main' ? (
          <section className="workspace">
            <div className="page-heading">
              <div>
                <p className="eyebrow">JIRA · TEST PLANNING</p>
                <h1>Turn a Jira issue into a test plan</h1>
                <p className="subheading">Requirements in. A traceable draft plan out.</p>
              </div>
              <button className="quiet-button" onClick={() => setPage('settings')}>Connection settings <span aria-hidden="true">↗</span></button>
            </div>

            <form className="issue-form" onSubmit={generatePlan}>
              <label htmlFor="issue-key">Jira issue ID</label>
              <div className="input-row">
                <span className="input-icon" aria-hidden="true">⌕</span>
                <input
                  id="issue-key"
                  placeholder="e.g. QA-123"
                  value={issueKey}
                  onChange={(event) => setIssueKey(event.target.value)}
                  disabled={busy}
                  required
                />
                <button className="primary-button" type="submit" disabled={busy || !issueKey.trim()}>
                  {busy ? <><span className="spinner" /> Generating…</> : <>Generate plan <span aria-hidden="true">→</span></>}
                </button>
              </div>
              <p className="field-note">The issue is read from Jira. No Jira content will be changed.</p>
            </form>

            {error && <div className="notice error-notice" role="alert"><span>!</span><p>{error}</p></div>}

            <section className="result-card" aria-live="polite">
              <div className="result-header">
                <div>
                  <p className="eyebrow">GENERATED OUTPUT</p>
                  <h2>{plan ? 'Test plan draft' : 'Your test plan will appear here'}</h2>
                </div>
                {sourceUrl && <a className="source-link" href={sourceUrl} target="_blank" rel="noreferrer">Source issue <span aria-hidden="true">↗</span></a>}
              </div>
              {busy ? (
                <div className="empty-state"><span className="spinner large" /><p>Reading Jira and preparing your draft…</p></div>
              ) : plan ? (
                <pre className="plan-output">{plan}</pre>
              ) : (
                <div className="empty-state"><div className="empty-icon">✳</div><p>Enter an issue ID above to get started.</p></div>
              )}
            </section>
            <p className="review-note"><span>ⓘ</span> Drafts require human review before test execution.</p>
          </section>
        ) : (
          <section className="settings-page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">CONFIGURATION</p>
                <h1>Settings</h1>
                <p className="subheading">Enter credentials here or use server configuration. Inputs stay in this page session only.</p>
              </div>
              <button className="quiet-button" onClick={() => setPage('main')}>← Back to main page</button>
            </div>

            <form className="settings-card" onSubmit={testJira}>
              <div className="card-title"><span className="service-icon jira-icon">J</span><div><h2>Jira connection</h2><p>Read issue details using your Jira account.</p></div></div>
              <div className="settings-grid">
                <label>Base URL<input type="url" placeholder="https://your-team.atlassian.net" value={jiraForm.baseUrl} onChange={(event) => setJiraForm({ ...jiraForm, baseUrl: event.target.value })} /></label>
                <label>Email<input type="email" placeholder={settings?.jira.emailConfigured ? 'Configured in server .env — leave blank to use it' : 'you@company.com'} value={jiraForm.email} onChange={(event) => setJiraForm({ ...jiraForm, email: event.target.value })} /></label>
                <label className="full-width">API token<input type="password" autoComplete="new-password" placeholder={settings?.jira.tokenConfigured ? 'Configured in server .env — leave blank to use it' : 'Enter a Jira API token'} value={jiraForm.token} onChange={(event) => setJiraForm({ ...jiraForm, token: event.target.value })} /></label>
              </div>
              <div className="card-actions">
                <button className="secondary-button" type="submit" disabled={jiraBusy}>{jiraBusy ? 'Testing…' : 'Test connection'}</button>
                {jiraTest && <span className={jiraTest.startsWith('Connected') ? 'test-result success' : 'test-result'} role="status">{jiraTest}</span>}
              </div>
            </form>

            <section className="settings-card">
              <div className="card-title"><span className="service-icon ai-icon">✳</span><div><h2>LLM configuration</h2><p>Enter provider details or use server configuration.</p></div></div>
              <div className="provider-options">
                <label className={provider === 'ollama' ? 'provider-option selected' : 'provider-option'}>
                  <input type="radio" name="provider" value="ollama" checked={provider === 'ollama'} onChange={() => { setProvider('ollama'); setAiTest(''); }} />
                  <span className="radio-dot" /><span><strong>Ollama</strong><small>URL, model, or server config</small></span>
                  <span className={settings?.ai.ollamaConfigured || (aiForm.ollamaBaseUrl && aiForm.ollamaModel) ? 'config-state ready' : 'config-state'}>{settings?.ai.ollamaConfigured || (aiForm.ollamaBaseUrl && aiForm.ollamaModel) ? 'Ready' : settings?.ai.ollamaUrlConfigured || aiForm.ollamaBaseUrl ? 'Model required' : 'Not configured'}</span>
                </label>
                <label className={provider === 'groq' ? 'provider-option selected' : 'provider-option'}>
                  <input type="radio" name="provider" value="groq" checked={provider === 'groq'} onChange={() => { setProvider('groq'); setAiTest(''); }} />
                  <span className="radio-dot" /><span><strong>Groq.com</strong><small>API key, model, or server config</small></span>
                  <span className={settings?.ai.groqConfigured || (aiForm.groqApiKey && aiForm.groqModel) ? 'config-state ready' : 'config-state'}>{settings?.ai.groqConfigured || (aiForm.groqApiKey && aiForm.groqModel) ? 'Ready' : settings?.ai.groqApiKeyConfigured || aiForm.groqApiKey ? 'Model required' : 'Not configured'}</span>
                </label>
              </div>
              <div className="settings-grid provider-fields">
                {provider === 'groq' ? (
                  <>
                    <label className="full-width">Groq API key<input type="password" autoComplete="new-password" placeholder={settings?.ai.groqApiKeyConfigured ? 'Configured on server — leave blank to use it' : 'Enter Groq API key'} value={aiForm.groqApiKey} onChange={(event) => setAiForm({ ...aiForm, groqApiKey: event.target.value })} /></label>
                    <label className="full-width">Groq model<input type="text" placeholder="e.g. openai/gpt-oss-120b" value={aiForm.groqModel} onChange={(event) => setAiForm({ ...aiForm, groqModel: event.target.value })} /></label>
                  </>
                ) : (
                  <>
                    <label className="full-width">Ollama URL<input type="url" placeholder={settings?.ai.ollamaUrlConfigured ? 'Configured on server — leave blank to use it' : 'http://localhost:11434'} value={aiForm.ollamaBaseUrl} onChange={(event) => setAiForm({ ...aiForm, ollamaBaseUrl: event.target.value })} /></label>
                    <label className="full-width">Ollama model<input type="text" placeholder="Enter installed model name" value={aiForm.ollamaModel} onChange={(event) => setAiForm({ ...aiForm, ollamaModel: event.target.value })} /></label>
                  </>
                )}
              </div>
              <div className="card-actions">
                <button className="secondary-button" type="button" onClick={testAi} disabled={aiBusy}>{aiBusy ? 'Testing…' : `Test ${provider === 'ollama' ? 'Ollama' : 'Groq.com'}`}</button>
                {aiTest && <span className={aiTest.startsWith('Connected') ? 'test-result success' : 'test-result'} role="status">{aiTest}</span>}
              </div>
              <p className="privacy-note">Credentials entered here are kept in page memory, never browser storage, and sent to the backend only for requests. Use HTTPS when hosted.</p>
            </section>
          </section>
        )}
      </main>
      <footer><span>Test Plan Agent</span><span>Read-only Jira integration <i /> Human-reviewed drafts</span></footer>
    </div>
  );
}

export default App;
