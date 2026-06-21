import * as dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {

  readonly baseURL: string;
  readonly orgSlug: string;
  readonly email: string;
  readonly password: string;
}

function read(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
      `Copy .env.example to .env and fill it in (see README.md).`,
    );
  }
  return value;
}

export const config: AppConfig = {
  baseURL: read('BASE_URL', 'https://staging.officernd.com'),
  orgSlug: read('ORG_SLUG', 'adrinkov-qa-task'),
  email: read('USER_EMAIL'),
  password: read('USER_PASSWORD'),
};
