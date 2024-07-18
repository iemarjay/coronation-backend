import * as process from 'process';

export default function configuration() {
  return {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.APP_ENV,
    url: process.env.APP_URL,
    name: process.env.APP_NAME ?? 'Coronation',

    client: { url: process.env.CLIENT_URL },
    admin: { url: process.env.ADMIN_URL },
    mailchimp: {
      apiKey: process.env.MAILCHIMP_API_KEY,
    },
    mail: {
      from: process.env.MAIL_FROM ?? 'noreply@pouchfi.io',
      from_name: process.env.MAIL_FROM_NAME ?? 'PouchFi',
    },
    database: {
      type: 'mssql',
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USERNAME,
      database: process.env.DATABASE_NAME,
      password: process.env.DATABASE_PASSWORD,
      migrationsRun: true,
    },
    auth: {
      secret: process.env.APP_SECRET,
      google_client: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET,
      },
      redirectUrl: process.env.AUTH_REDIRECT_URL,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      // db: parseInt(process.env.REDIS_DB),
      password: process.env.REDIS_PASSWORD,
    },
  };
}

export * from './okta.config';
