# Jira Test Plan Agent

## Run locally

Requires Node.js 20+ and the workspace `.env` at the repository root.

```powershell
cd Chapter_05_AI_Agents_Basic_VIBE_CODING\01_Intelligent_Test_Planning_AIAgent\02_implementation
npm install
npm run dev
```

Open http://127.0.0.1:5173.

The backend reads `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`, and AI settings from `..\..\..\.env` (the workspace root). Alternatively, enter connection details in **Settings**; overrides are kept in page memory only, sent to the backend for requests, and never written to browser storage. A safe variable-name template is in `.env.example`.

## Deploy to Vercel

The project includes a Vercel serverless API entry and deploy configuration. From this directory, run `npx vercel --prod --name aix5-testplanaiagent` after authenticating with Vercel. Assign the requested `aix5-testplanaiagent.vercel.app` domain to the project in Vercel if it is available. The workspace `.env`, including deploy credentials, is excluded from uploads. Users can enter Jira and AI configuration on the Settings page; deploy server-side environment variables separately only if desired.

Configure one provider:

- Groq: `GROQ_API_KEY` and `GROQ_MODEL`. The current workspace `.env` uses `openai/gpt-oss-120b`; it was verified against the configured Groq account with JSON response mode.
- Ollama: `OLLAMA_BASE_URL` and `OLLAMA_MODEL`.

The app does not write or change `.env`. Use HTTPS when hosting so user-entered credentials are encrypted in transit.

Jira API version may be set with `JIRA_API_VERSION`. If unset, the backend uses version 3 for `*.atlassian.net` and version 2 for other hosts. **Inference (low confidence):** this host-based choice may not match a custom or self-hosted Jira deployment.

## Use

Enter Jira and AI configuration in **Settings** or configure it on the server, then enter an issue key on the main page and choose **Generate plan**. The settings page tests Jira and the selected AI provider. Jira access is read-only. Generated plans follow the section names and order in `01_plan/test_Plan_template.md`; proposals and missing information remain subject to the human review gate.

## Verify

```powershell
npm test
npm run build
```

Unit tests cover Jira issue-key validation, rich-text extraction, issue mapping, source links, template rendering, and invalid AI response shapes. Live Jira retrieval and provider generation require authorized network access and credentials; they are not represented as verified by the unit tests.

## Limitations

- The supplied settings wireframe is implemented. No `config.md` was present; server configuration uses the existing workspace `.env`.
- The Groq or Ollama model must be supplied in Settings or configured on the server.
- Jira acceptance criteria are included only when present in the retrieved issue description. No custom Jira fields are assumed.
- AI output can vary by provider/model even with temperature zero; every plan is labeled as a draft for human review.
