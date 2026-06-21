import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly continueButton: Locator;
  private readonly passwordInput: Locator;
  private readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  async goto(): Promise<void> {
    await this.open('/login');
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.submitEmailStep(email);
    await this.submitPasswordStep(password);

    await this.page.waitForURL(/\/admin\//, { waitUntil: 'commit' });
  }

  private async submitEmailStep(email: string): Promise<void> {
    await expect(async () => {
      await this.emailInput.fill(email);
      await this.continueButton.click();
      await expect(this.passwordInput).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
  }

  private async submitPasswordStep(password: string): Promise<void> {
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
