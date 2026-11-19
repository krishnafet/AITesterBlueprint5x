# Playwright Salesforce Login Framework

This TypeScript Playwright Test project uses a Page Object Model to test the live Salesforce login page at `https://login.salesforce.com/?locale=in`.

## Requirements

- Node.js 18 or newer
- npm
- Network access to Salesforce

## Install

```powershell
npm install
npx playwright install chromium
```

## Configure credentials

The valid-login test reads `SF_USERNAME` and `SF_PASSWORD` from the environment. It is skipped unless both are set; the project does not provide or assume valid credentials.
The valid-login assertion verifies that the primary login form is dismissed. It does not assert an org-specific destination or claim completion of any Salesforce MFA challenge.

The invalid-login test reads `SF_INVALID_USERNAME` and `SF_INVALID_PASSWORD` from the environment. Supply deliberately invalid test values to run it. For example, these values are reserved fake test data, not Salesforce credentials:

```powershell
$env:SF_INVALID_USERNAME = 'invalid-playwright-user@example.invalid'
$env:SF_INVALID_PASSWORD = 'not-a-valid-salesforce-password'
```

Set valid credentials only in your local environment when authorized to use them:

```powershell
$env:SF_USERNAME = 'your-authorized-salesforce-username'
$env:SF_PASSWORD = 'your-authorized-salesforce-password'
```

Do not commit credentials or paste them into source files.

## Run

Run the suite headless:

```powershell
npm test
```

Run the suite in a visible browser:

```powershell
npm run test:headed
```

The visible-browser run requires configured invalid test values to execute the invalid-login scenario. Without valid Salesforce credentials, the valid-login scenario is reported as skipped, not passed.
