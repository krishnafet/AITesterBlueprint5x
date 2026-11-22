# AI Test Strategy Generator

## Run locally

Requires Node.js 20+ and the workspace-root `.env`.

```powershell
cd Chapter_05_AI_Agents_Basic_VIBE_CODING\02_Intelligent_Test_Startegy_AIAgent\02_implementation
npm install
npm run dev
```

Open http://127.0.0.1:5174.

No `config.md` was supplied; the backend reads `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`, `GROQ_API_KEY`, and `GROQ_MODEL` from the repository-root `.env`. Secrets remain on the backend. Settings can also accept Jira and AI configuration in page memory; values are sent only with API requests and cleared when the page reloads. `.env.example` contains placeholders only.

## Deploy to Vercel

The project includes a Vercel catch-all API function and Vite production build configuration. Deploy from this directory using the Vercel CLI (`vercel --prod --name aix5-teststrategyaiagent`). The Vercel access token is read from the workspace environment; application secrets are not uploaded automatically. Configure provider credentials through the app's Settings page or add them to the Vercel project's server-side environment variables.

Use Groq by configuring its API key and model, or select Ollama and provide its URL and installed model. Jira API version can be set using `JIRA_API_VERSION`; otherwise version 3 is selected for Atlassian Cloud and version 2 for other hosts.

## Use

Enter project context, a Jira project key, or comma-separated Jira issue keys, then generate a strategy. Project keys retrieve project metadata and up to 50 issues. Issue references retrieve the specified issues. Jira is read-only. Use **Download Word (.docx)** to save the generated draft as an editable Word document for review and finalization. Review every strategy with authorized stakeholders.

## Template notice

No authoritative Test Strategy template was supplied. With permission, the app uses a clearly labeled proposed structure covering project understanding, scope, testing approach, risk, automation, environments, data, defects, entry/exit criteria, metrics, roles, assumptions, dependencies, open questions, and sources. Replace this proposed structure with the authoritative template when it becomes available.

## Verify and limitations

Run `npm test` and `npm run build`. Unit tests use mocked Jira responses and verify Word document export; live Jira and Groq access depend on valid credentials and network access. Jira search is limited to 50 issues per project for a lightweight first pass. No document upload design or authoritative test strategy template was present. AI output can vary, and generated content is always a draft pending human review.
