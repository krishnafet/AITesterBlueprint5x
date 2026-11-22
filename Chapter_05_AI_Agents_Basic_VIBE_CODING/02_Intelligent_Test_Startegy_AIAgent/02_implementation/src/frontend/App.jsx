import { useState } from 'react';

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

const initialJira = { baseUrl: '', email: '', token: '' };
const initialAi = { groqApiKey: '', groqModel: '', ollamaBaseUrl: '', ollamaModel: '' };

export default function App() {
  const [page, setPage] = useState('main');
  const [references, setReferences] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [provider, setProvider] = useState('groq');
  const [jira, setJira] = useState(initialJira);
  const [ai, setAi] = useState(initialAi);
  const [strategy, setStrategy] = useState('');
  const [sources, setSources] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [jiraStatus, setJiraStatus] = useState('');
  const [aiStatus, setAiStatus] = useState('');
  const [testBusy, setTestBusy] = useState('');

  async function generate(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setStrategy('');
    setSources([]);
    try {
      const result = await request('/api/test-strategy', {
        references,
        projectName,
        projectContext,
        provider,
        jira,
        ai,
      });
      setStrategy(result.strategy);
      setSources(result.sources);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadWord() {
    if (!strategy || exporting) return;
    setExporting(true);
    setError('');
    try {
      const response = await fetch('/api/test-strategy/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ strategy, projectName }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Word document export failed.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = projectName.trim().replace(/[^\w-]+/g, '-') || 'test-strategy';
      link.href = url;
      link.download = `${safeName}-test-strategy.docx`;
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
    setTestBusy(kind);
    if (kind === 'jira') setJiraStatus('');
    else setAiStatus('');
    try {
      const result = await request(`/api/${kind}/test`, { provider, jira, ai });
      if (kind === 'jira') setJiraStatus(result.message);
      else setAiStatus(result.message);
    } catch (cause) {
      if (kind === 'jira') setJiraStatus(cause.message);
      else setAiStatus(cause.message);
    } finally {
      setTestBusy('');
    }
  }

  const updateJira = (field) => (event) => setJira({ ...jira, [field]: event.target.value });
  const updateAi = (field) => (event) => setAi({ ...ai, [field]: event.target.value });

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setPage('main')}>
          <span className="brand-mark">S</span> Strategy Studio
        </a>
        <nav aria-label="Main navigation">
          <button className={page === 'main' ? 'nav active' : 'nav'} onClick={() => setPage('main')}>Main page</button>
          <button className={page === 'settings' ? 'nav active' : 'nav'} onClick={() => setPage('settings')}>Settings</button>
        </nav>
        <span className="readonly"><i /> Jira read-only</span>
      </header>

      <main className="content">
        {page === 'main' ? (
          <section>
            <div className="heading">
              <div>
                <p className="eyebrow">PROJECT QUALITY · TEST STRATEGY</p>
                <h1>Build a smarter test strategy</h1>
                <p className="subheading">Add project context and Jira references to create a traceable draft.</p>
              </div>
              <button className="outline-button" onClick={() => setPage('settings')}>Connection settings ↗</button>
            </div>

            <form className="form-card" onSubmit={generate}>
              <label>Project name <span className="optional">Optional</span>
                <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Enter project name" disabled={loading} />
              </label>
              <label>Jira project key or issue IDs <span className="optional">Optional if project context is provided</span>
                <input value={references} onChange={(event) => setReferences(event.target.value)} placeholder="e.g. APP or APP-101, APP-102" disabled={loading} />
              </label>
              <label>Project information
                <textarea value={projectContext} onChange={(event) => setProjectContext(event.target.value)} placeholder="Describe the product, goals, requirements, architecture, integrations, environments, or other known project details." rows={5} disabled={loading} />
              </label>
              <div className="form-bottom">
                <p>Jira is read-only. Add only information you are authorized to share with the selected AI provider.</p>
                <button className="primary-button" disabled={loading || (!references.trim() && !projectContext.trim())}>
                  {loading ? <><span className="spinner" /> Analyzing…</> : <>Generate strategy <span>→</span></>}
                </button>
              </div>
            </form>

            {error && <div className="alert" role="alert">{error}</div>}

            <section className="output-card" aria-live="polite">
              <div className="output-heading">
                <div><p className="eyebrow">GENERATED DOCUMENT</p><h2>{strategy ? 'Test Strategy draft' : 'Your strategy appears here'}</h2></div>
                {strategy && <div className="action-row">
                  <button className="outline-button" onClick={downloadWord} disabled={exporting}>
                    {exporting ? 'Preparing Word document…' : 'Download Word (.docx)'}
                  </button>
                  <button className="outline-button" onClick={() => navigator.clipboard.writeText(strategy)}>Copy strategy</button>
                </div>}
              </div>
              {loading ? (
                <div className="empty"><span className="spinner big" /><p>Retrieving Jira information and analyzing your project…</p></div>
              ) : strategy ? (
                <>
                  {sources.length > 0 && <div className="sources">Sources: {sources.map((source) => <a key={source.key} href={source.url} target="_blank" rel="noreferrer">{source.key}</a>)}</div>}
                  <pre className="strategy">{strategy}</pre>
                </>
              ) : (
                <div className="empty"><span className="sparkle">✳</span><p>Add project details to get started.</p></div>
              )}
            </section>
            <p className="review"><span>ⓘ</span> Every generated strategy is a draft and requires stakeholder review.</p>
          </section>
        ) : (
          <section className="settings">
            <div className="heading">
              <div><p className="eyebrow">CONFIGURATION</p><h1>Settings</h1><p className="subheading">Credentials stay in page memory and are sent only with requests.</p></div>
              <button className="outline-button" onClick={() => setPage('main')}>← Back</button>
            </div>

            <form className="settings-card" onSubmit={(event) => testConnection('jira', event)}>
              <div className="card-title"><span className="icon jira-icon">J</span><div><h2>Jira connection</h2><p>Project and issue information is retrieved read-only.</p></div></div>
              <div className="grid">
                <label>Jira URL<input type="url" value={jira.baseUrl} onChange={updateJira('baseUrl')} placeholder="https://your-team.atlassian.net" /></label>
                <label>Email<input type="email" value={jira.email} onChange={updateJira('email')} placeholder="you@company.com" /></label>
                <label className="full">API token<input type="password" autoComplete="new-password" value={jira.token} onChange={updateJira('token')} placeholder="Leave empty to use server configuration" /></label>
              </div>
              <div className="action-row"><button className="outline-button" disabled={testBusy === 'jira'}>{testBusy === 'jira' ? 'Testing…' : 'Test connection'}</button>{jiraStatus && <span className={jiraStatus.startsWith('Connected') ? 'success' : 'failure'} role="status">{jiraStatus}</span>}</div>
            </form>

            <section className="settings-card">
              <div className="card-title"><span className="icon ai-icon">✳</span><div><h2>LLM configuration</h2><p>Select and test the provider used for strategy generation.</p></div></div>
              <div className="providers">
                <label className={provider === 'ollama' ? 'provider selected' : 'provider'}>
                  <input type="radio" name="provider" checked={provider === 'ollama'} onChange={() => { setProvider('ollama'); setAiStatus(''); }} />
                  <span><b>Ollama</b><small>Local connection</small></span>
                </label>
                <label className={provider === 'groq' ? 'provider selected' : 'provider'}>
                  <input type="radio" name="provider" checked={provider === 'groq'} onChange={() => { setProvider('groq'); setAiStatus(''); }} />
                  <span><b>Groq.com</b><small>API key</small></span>
                </label>
              </div>
              <div className="grid provider-inputs">
                {provider === 'groq' ? (
                  <>
                    <label className="full">Groq API key<input type="password" autoComplete="new-password" value={ai.groqApiKey} onChange={updateAi('groqApiKey')} placeholder="Leave empty to use server configuration" /></label>
                    <label className="full">Model<input value={ai.groqModel} onChange={updateAi('groqModel')} placeholder="e.g. openai/gpt-oss-120b" /></label>
                  </>
                ) : (
                  <>
                    <label className="full">Ollama URL<input type="url" value={ai.ollamaBaseUrl} onChange={updateAi('ollamaBaseUrl')} placeholder="http://127.0.0.1:11434" /></label>
                    <label className="full">Model<input value={ai.ollamaModel} onChange={updateAi('ollamaModel')} placeholder="Enter installed model name" /></label>
                  </>
                )}
              </div>
              <div className="action-row"><button className="outline-button" type="button" disabled={testBusy === 'ai'} onClick={() => testConnection('ai')}>{testBusy === 'ai' ? 'Testing…' : `Test ${provider === 'groq' ? 'Groq.com' : 'Ollama'}`}</button>{aiStatus && <span className={aiStatus.startsWith('Connected') ? 'success' : 'failure'} role="status">{aiStatus}</span>}</div>
              <p className="privacy">Credentials entered here are cleared on page reload and are not written to browser storage. Use HTTPS on shared networks.</p>
            </section>
          </section>
        )}
      </main>
      <footer><span>Strategy Studio</span><span>Read-only Jira · Human-reviewed draft</span></footer>
    </div>
  );
}
