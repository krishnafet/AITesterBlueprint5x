import { expect, Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly rememberMe: Locator;
  readonly loginButton: Locator;
  readonly invalidLoginMessage: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password');
    this.rememberMe = page.getByRole('checkbox', { name: 'Remember me' });
    this.loginButton = page.getByRole('button', { name: 'Log In' });
    this.invalidLoginMessage = page.getByText(
      /^Error: Please check your username and password\./,
    );
  }

  async open(): Promise<void> {
    await this.page.goto('/?login=1&locale=in');
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.loginButton.click();
    await expect(this.password).toBeVisible();
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.username).toBeVisible();
    await expect(this.rememberMe).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectLoginFormDismissed(): Promise<void> {
    await expect(this.username).toBeHidden();
    await expect(this.password).toBeHidden();
    await expect(this.loginButton).toBeHidden();
  }

  async expectInvalidLoginMessage(): Promise<void> {
    await expect(this.invalidLoginMessage).toBeVisible();
  }
}
