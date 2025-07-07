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
    domains: [
      'coronationmb.com',
      'coronationam.com',
      'coronationsl.com',
      'coronationnt.com',

      'coronationregistrars.com',
      'coronationinsurance.com.ng',
      'coronationcapital.com.ng',
      'trium.ng',
      'coronationgroup.com',
      'coronationtechnology.com',
      'myfiducia.com',
      'coronationinsurance.com.gh',
      'coronationinsurance.com.ng',
    ],
    adminEmails: {
      'coronationcapital.com.ng': process.env.CORONATION_CAPITAL_EMAIL,
      'coronationgroup.com': process.env.CORONATION_GROUP_EMAIL,
      'coronationtechnology.com': process.env.CORONATION_TECH_EMAIL,
      'myfiducia.com': process.env.MYFIDUCIA_EMAIL,
      'trium.ng': process.env.TRIUM_EMAIL,
      'coronationmb.com': process.env.CORONATION_MB_EMAIL,
      'coronationam.com': process.env.CORONATION_AM_EMAIL,
      'coronationregistrars.com': process.env.CORONATION_REGISTERS_EMAIL,
      'coronationinsurance.com.ng': process.env.CORONATION_INSURANCE_EMAIL,
    },
    mail: {
      from: process.env.MAIL_FROM ?? 'noreply@pouchfi.io',
      from_name: process.env.MAIL_FROM_NAME ?? 'PouchFi',
      apiKey: process.env.MAIL_API_KEY,
      url: process.env.MAIL_URL,
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
      tls: {},
      password: process.env.REDIS_PASSWORD,
    },
    azure: {
      connection_string: process.env.AZURE_STORAGE_CONNECTION_STRING,
      container_name: process.env.AZURE_STORAGE_CONTAINER_NAME,
    },
  };
}

export * from './auth0.config';
export * from './okta.config';
export * from './azure.config';
