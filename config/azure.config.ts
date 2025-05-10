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
    {
      id: env.AZURE_TENANT_3_ID,
      clientId: env.AZURE_TENANT_3_CLIENT_ID,
      clientSecret: env.AZURE_TENANT_3_CLIENT_SECRET,
    },
    {
      id: env.AZURE_TENANT_4_ID,
      clientId: env.AZURE_TENANT_4_CLIENT_ID,
      clientSecret: env.AZURE_TENANT_4_CLIENT_SECRET,
    },
    {
      id: env.AZURE_TENANT_5_ID,
      clientId: env.AZURE_TENANT_5_CLIENT_ID,
      clientSecret: env.AZURE_TENANT_5_CLIENT_SECRET,
    },
  ],
  storage: {
    connection_string: env.AZURE_STORAGE_CONNECTION_STRING,
    container_name: env.AZURE_STORAGE_CONTAINER_NAME,
  },
}));
