# Chapter 3: Prompt Engineering with RICE-POT

This chapter contains RICE-POT prompts and the Playwright framework generated from the Playwright prompt.

## Playwright Salesforce Login Framework

The runnable TypeScript project is in [PlaywrightFramework](./PlaywrightFramework/). It uses Playwright Test and a Page Object Model to exercise the live Salesforce login page.

To install dependencies and Chromium, then run tests in a visible browser:

```powershell
cd PlaywrightFramework
npm install
npx playwright install chromium
npm run test:headed
```

The invalid-login test requires `SF_INVALID_USERNAME` and `SF_INVALID_PASSWORD`. The valid-login test requires authorized `SF_USERNAME` and `SF_PASSWORD`; it is skipped if they are not set. See the [framework README](./PlaywrightFramework/README.md) for credential configuration and test details. Do not commit credentials.
