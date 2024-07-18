import { registerAs } from '@nestjs/config';

export const oktaConfiguration = registerAs('okta', () => ({
  clientId: process.env.OKTA_CLIENT_ID,
  clientSecret: process.env.OKTA_CLIENT_SECRET,
  issuer: process.env.OKTA_ISSUER,
  redirectUri: process.env.OKTA_REDIRECT_URI,
}));
