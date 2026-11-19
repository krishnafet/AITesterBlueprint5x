import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

const validUsername = process.env.SF_USERNAME;
const validPassword = process.env.SF_PASSWORD;
const invalidUsername = process.env.SF_INVALID_USERNAME;
const invalidPassword = process.env.SF_INVALID_PASSWORD;

test.describe('Salesforce login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open();
  });

  test('shows the login form and remember-me option', async () => {
    await loginPage.expectLoginFormVisible();
    await expect(loginPage.password).toBeHidden();
    await expect(loginPage.rememberMe).not.toBeChecked();
  });

  test('submits valid credentials and dismisses the login form', async () => {
    if (!validUsername || !validPassword) {
      test.skip(true, 'Set SF_USERNAME and SF_PASSWORD to run the valid-login test.');
      return;
    }

    await loginPage.login(validUsername, validPassword);
    await loginPage.expectLoginFormDismissed();
  });

  test('shows the observed error for invalid credentials', async () => {
    if (!invalidUsername || !invalidPassword) {
      test.skip(
        true,
        'Set SF_INVALID_USERNAME and SF_INVALID_PASSWORD to run the invalid-login test.',
      );
      return;
    }

    await loginPage.login(invalidUsername, invalidPassword);
    await loginPage.expectInvalidLoginMessage();
  });
});
