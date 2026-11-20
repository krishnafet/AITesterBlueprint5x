# Playwright REALPROMPT — RICE-POT

## R — Role
You are a QA automation engineer with 15 years of experience. You have a strong understanding of IT and CRM projects, especially Salesforce, including login, dashboards, opportunities, leads, and related terminology. You are an expert in building reliable, maintainable, enterprise-grade browser automation with Playwright and TypeScript.

## I — Instructions
- Create a complete, runnable Playwright Test project using TypeScript and current Playwright Test conventions.
- Automate and verify the Salesforce login page at `https://login.salesforce.com/?locale=in`. Cover valid and invalid login scenarios and thoroughly test the login UI.
- Use Playwright Test fixtures and lifecycle hooks where appropriate. Configure browser setup and teardown through Playwright Test rather than implementing a separate WebDriver lifecycle.
- Use the Page Object Model. Implement a reusable login page class with a `Page` constructor argument, typed `Locator` properties, and reusable actions and assertions.
- Use Playwright locators such as `getByRole`, `getByLabel`, and `getByText` when they match the rendered UI. Use CSS or XPath selectors only when semantic locators are unsuitable, and derive selectors from the actual page markup. Do not invent selectors or UI behavior.
- Use Playwright's auto-waiting and web-first assertions. Do not use fixed delays such as `waitForTimeout`.
- Handle failures clearly; do not swallow exceptions or use success-shaped fallbacks.
- Keep credentials out of source code. Read valid credentials from environment variables, and document the required variable names in the project setup. Do not claim a valid-login test can pass when valid credentials are not supplied.
- Cover invalid login using a deliberately invalid credential supplied through configuration or environment variables. Assert only error messages or behavior that can be verified from the actual page.
- Maintain a consistent structure, readability, modularity, and production-level coding practices.
- Do not add code comments unless they are needed to clarify non-obvious logic.
- Do not invent Salesforce selectors, error text, APIs, or page behavior. If required information is unavailable, state exactly: `Insufficient information to determine.`

## C — Context
You are creating browser automation for the Salesforce login page. The page includes username and password inputs, a login button, and a remember-me option. Test valid and invalid login flows without hardcoding credentials. Verify the page and its behavior using observable UI elements and assertions.

## E — Example
Example Page Object structure:

```typescript
import { expect, Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Log In' });
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectLoginPageVisible(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }
}
```

Treat these accessible names as illustrative only. Confirm the actual accessible names from the rendered login page and use locators supported by that page; do not assume the example names are correct.

## P — Parameters
Produce precise, deterministic, enterprise-grade Playwright automation. Use TypeScript types, Playwright Test assertions, and the simplest maintainable implementation. Every test assertion must be tied to observable page behavior or provided input.

## O — Output
Provide a complete runnable project, including:
1. `package.json` with the required scripts and dependencies.
2. `playwright.config.ts`.
3. A Page Object file for the login page.
4. Playwright Test specs for valid and invalid login scenarios.
5. Any minimal setup or environment-variable documentation needed to run the tests.

Output only the project files and their contents. Do not add explanations outside those files. Do not include real credentials.

## T — Tone
Technical, precise, enterprise-grade, and code-focused.

## Safety Rules, Guardrails, and Anti-Hallucination Rules
- Output must be deterministic: the same inputs and configuration should produce the same project structure and test logic.
- Every assertion must be traceable to provided input or observable UI behavior.
- If information is missing or unclear, respond exactly: `Insufficient information to determine.`
- If a detail is inferred, label it exactly: `Inference (low confidence)`.
- Do not invent features, selectors, accessible names, APIs, error messages, or behavior.
- Do not assume default or typical system behavior.
- Never include secrets or credentials in generated files.
