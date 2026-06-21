import { test as base } from '@playwright/test';
import { AppConfig, config } from '../config/env';
import { LoginPage } from '../pages/LoginPage';
import { MembersPage } from '../pages/MembersPage';

interface Fixtures {
  appConfig: AppConfig;
  loginPage: LoginPage;
  membersPage: MembersPage;
}

export const test = base.extend<Fixtures>({
  appConfig: async ({ }, use) => {
    await use(config);
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  membersPage: async ({ page, appConfig }, use) => {
    await use(new MembersPage(page, appConfig.orgSlug));
  },
});

export { expect } from '@playwright/test';
