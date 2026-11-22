# AI Test Case Creator

A lightweight React and Express application for creating traceable, human-review-only test cases from Jira issues, an approved Test Plan, and requirement clarifications.

## Run locally

Requires Node.js 20+ and the workspace-root `.env`.

```powershell
cd Chapter_05_AI_Agents_Basic_VIBE_CODING\03_Intelligent_Test_Case_AIAgent\02_implementation
npm install
npm run dev
```

Open http://127.0.0.1:5175.

The backend reads `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`, `GROQ_API_KEY`, and `GROQ_MODEL` from the repository-root `.env`; Ollama can instead use `OLLAMA_BASE_URL` and `OLLAMA_MODEL`. `.env.example` contains placeholders only. Credentials entered in Settings are held only in page memory and sent with API requests.

## Deploy to Vercel

Deploy this directory with the Vercel CLI to the `aix5-testcaseaiagent` project. The Vercel token is used only for deployment; workspace `.env` files are excluded from the upload. Configure Jira and AI credentials as server-side environment variables in the Vercel project or enter them through the app Settings page.

## Use

Enter up to 10 Jira issue keys, paste an approved Test Plan and/or add requirement clarifications, select Groq or Ollama, and generate test cases. Jira retrieval is read-only. Download the draft as an editable Word document for review.

No Test Case template, design, or `config.md` was supplied. With user permission, the app uses a clearly labeled proposed structure. Paste Test Plans as text; document upload is not implemented because no upload design or parsing requirements were provided. Cases use source-backed references where available, deterministic IDs, explicit missing-information markers, and QA review for uncertain priorities. Review all generated cases before use.

## Structure and verification

- `src/frontend/`: React application and responsive UI.
- `src/backend/`: Express APIs, read-only Jira integration, AI prompts/validation, and Word export.
- Run `npm test` and `npm run build`.

Unit tests mock Jira and test validation/document generation. Live Jira and AI use require valid credentials and network access. No live Test Case generation was performed as part of implementation.
