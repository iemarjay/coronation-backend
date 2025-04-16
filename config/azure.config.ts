import { registerAs } from '@nestjs/config';
import { env } from 'process';

export const azureConfiguration = registerAs('azure', () => ({
  tenants: [
    {
      id: env.AZURE_TENANT_1_ID,
      clientId: env.AZURE_TENANT_1_CLIENT_ID,
      clientSecret: env.AZURE_TENANT_1_CLIENT_SECRET,
    },
    {
      id: env.AZURE_TENANT_2_ID,
      clientId: env.AZURE_TENANT_2_CLIENT_ID,
      clientSecret: env.AZURE_TENANT_2_CLIENT_SECRET,
    },
  ],
  storage: {
    connection_string: env.AZURE_STORAGE_CONNECTION_STRING,
    container_name: env.AZURE_STORAGE_CONTAINER_NAME,
  },
}));
