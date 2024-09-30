import { registerAs } from '@nestjs/config';
import { env } from 'process';

export const auth0Configuration = registerAs('auth0', () => ({
  issuer: env.AUTH0_ISSUER,
  domain: env.AUTH0_DOMAIN,
  clientId: env.AUTH0_CLIENT_ID,
  clientSecret: env.AUTH0_CLIENT_SECRET,
  apiClientId: env.AUTH0_API_CLIENT_ID,
  apiClientSecret: env.AUTH0_API_CLIENT_SECRET,
  audience: env.AUTH0_IDENTIFIER,
}));
