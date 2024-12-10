import { registerAs } from '@nestjs/config';
import { env } from 'process';

export const oktaConfiguration = registerAs('okta', () => ({
  clientId: env.OKTA_CLIENT_ID,
  clientSecret: env.OKTA_CLIENT_SECRET,
  issuer: env.OKTA_ISSUER,
  audience: env.OKTA_AUDIENCE,
  url: env.OKTA_URL,
  api_token: env.OKTA_API_TOKEN,
}));
