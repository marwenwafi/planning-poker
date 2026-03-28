import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  jira: {
    baseUrl: process.env['JIRA_BASE_URL'] ?? '',
    email: process.env['JIRA_EMAIL'] ?? '',
    apiToken: process.env['JIRA_API_TOKEN'] ?? '',
  },
};

if (!config.jira.baseUrl || !config.jira.email || !config.jira.apiToken) {
  console.warn('[config] Missing Jira env vars — Jira integration will fail. Copy .env.example to .env and fill in values.');
}
