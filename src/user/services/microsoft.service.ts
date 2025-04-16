import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@microsoft/microsoft-graph-client';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

interface AzureTenant {
  id: string;
  clientId: string;
  clientSecret: string;
  displayName: string;
}

@Injectable()
export class MicrosoftService {
  private readonly logger = new Logger(MicrosoftService.name);
  private graphClients: Map<string, Client> = new Map();
  private jwksClients: Map<string, jwksClient.JwksClient> = new Map();

  constructor(private readonly config: ConfigService) {}

  private getTenantConfig(tenantId: string): AzureTenant {
    const tenants = this.config.get<AzureTenant[]>('azure.tenants');
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) {
      throw new UnauthorizedException(
        `Tenant ${tenantId} not found in configuration`,
      );
    }
    return tenant;
  }

  private getJwksClient(tenantId: string): jwksClient.JwksClient {
    if (!this.jwksClients.has(tenantId)) {
      this.jwksClients.set(
        tenantId,
        jwksClient({
          jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/keys`,
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          timeout: 30000,
        }),
      );
    }
    return this.jwksClients.get(tenantId);
  }

  private async getGraphClient(tenantId: string): Promise<Client> {
    if (!this.graphClients.has(tenantId)) {
      const tenant = this.getTenantConfig(tenantId);
      const client = Client.init({
        authProvider: async (done) => {
          try {
            const token = await this.getAccessToken(tenant);
            done(null, token);
          } catch (error) {
            done(error, null);
          }
        },
      });
      this.graphClients.set(tenantId, client);
    }
    return this.graphClients.get(tenantId);
  }

  private async getAccessToken(tenant: AzureTenant): Promise<string> {
    const params = new URLSearchParams();
    params.append('client_id', tenant.clientId);
    params.append('client_secret', tenant.clientSecret);
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'https://graph.microsoft.com/.default');

    const response = await fetch(
      `https://login.microsoftonline.com/${tenant.id}/oauth2/v2.0/token`,
      {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async verify(token: string) {
    try {
      const decodedHeader = jwt.decode(token, { complete: true }) as any;
      const tenantId = decodedHeader?.payload?.tid;

      if (!tenantId) {
        throw new UnauthorizedException('Tenant ID not found in token');
      }

      const tenant = this.getTenantConfig(tenantId);
      const jwks = this.getJwksClient(tenantId);

      const payload: any = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          (header, callback) => {
            jwks.getSigningKey(header.kid, (err, key) => {
              if (err) return callback(err);
              callback(null, key.getPublicKey());
            });
          },
          {
            algorithms: ['RS256'],
            issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
            audience: tenant.clientId,
            complete: false,
            ignoreExpiration: false,
            clockTolerance: 30,
          },
          (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
          },
        );
      });

      return payload;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new UnauthorizedException(
        error.message ?? 'Invalid token or authentication failed',
      );
    }
  }

  private async getUserRoles(
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    try {
      const graphClient = await this.getGraphClient(tenantId);
      const groups = await graphClient.api(`/users/${userId}/memberOf`).get();

      if (!groups.value) {
        return [];
      }

      return groups.value
        .filter((group) => group.securityEnabled)
        .map((group) => group.displayName);
    } catch (error) {
      this.logger.error('Failed to get user roles:', error);
      return [];
    }
  }

  generatePassword(length = 12): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  async createUser(
    tenantId: string,
    dto: {
      email: string;
      given_name: string;
      family_name: string;
      role: string;
    },
  ) {
    const { email, family_name, given_name, role } = dto;
    const password = this.generatePassword();
    try {
      const graphClient = await this.getGraphClient(tenantId);
      const user = await graphClient.api('/users').post({
        accountEnabled: true,
        displayName: `${given_name} ${family_name}`,
        mailNickname: email.split('@')[0],
        userPrincipalName: email,
        passwordProfile: {
          forceChangePasswordNextSignIn: true,
          password: password,
        },
        givenName: given_name,
        surname: family_name,
        mail: email,
      });

      if (role) {
        await this.assignRole(tenantId, { email, roles: [role] });
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message ?? 'Failed to create user in Microsoft',
      );
    }
  }

  async assignRole(tenantId: string, dto: { email: string; roles: string[] }) {
    try {
      const graphClient = await this.getGraphClient(tenantId);
      const user = await graphClient
        .api('/users')
        .filter(`userPrincipalName eq '${dto.email}'`)
        .get();

      if (!user.value || user.value.length === 0) {
        throw new NotFoundException('User not found in Microsoft');
      }

      const userId = user.value[0].id;

      for (const role of dto.roles) {
        const group = await this.getGroupByName(tenantId, role);
        if (group) {
          await graphClient.api(`/groups/${group.id}/members/$ref`).post({
            '@odata.id': `https://graph.microsoft.com/v1.0/users/${userId}`,
          });
        }
      }

      return userId;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message ?? 'Failed to assign user to groups',
      );
    }
  }

  private async getGroupByName(tenantId: string, groupName: string) {
    try {
      const graphClient = await this.getGraphClient(tenantId);
      const groups = await graphClient
        .api('/groups')
        .filter(`displayName eq '${groupName}'`)
        .get();

      return groups.value && groups.value.length > 0 ? groups.value[0] : null;
    } catch (error) {
      this.logger.error(`Failed to get group by name: ${groupName}`, error);
      return null;
    }
  }

  async createGroups(tenantId: string, groups: string[]) {
    const graphClient = await this.getGraphClient(tenantId);
    for (const groupName of groups) {
      try {
        await graphClient.api('/groups').post({
          displayName: groupName,
          mailNickname: groupName.toLowerCase().replace(/\s+/g, ''),
          mailEnabled: false,
          securityEnabled: true,
          description: `Group for ${groupName}s`,
        });
      } catch (error) {
        this.logger.log(
          error?.message ?? `Failed to create group "${groupName}":`,
        );
      }
    }
  }
}
