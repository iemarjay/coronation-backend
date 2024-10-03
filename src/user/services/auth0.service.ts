import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as JwksClient from 'jwks-rsa';
import { decode, verify } from 'jsonwebtoken';
import { ManagementClient } from 'auth0';

@Injectable()
export class Auth0Service {
  private jwksClient: JwksClient.JwksClient;
  private managementClient: ManagementClient;
  private readonly logger = new Logger(Auth0Service.name);
  constructor(private configService: ConfigService) {
    this.jwksClient = JwksClient({
      jwksUri: `${this.configService.get('auth0.issuer')}.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });

    this.managementClient = new ManagementClient({
      domain: this.configService.get('auth0.domain'),
      clientId: this.configService.get('auth0.apiClientId'),
      clientSecret: this.configService.get('auth0.apiClientSecret'),
    });
  }

  async verify(token: string): Promise<any> {
    const decodedToken = decode(token, { complete: true });
    if (!decodedToken || typeof decodedToken === 'string') {
      throw new UnauthorizedException('Invalid token');
    }

    const kid = decodedToken.header.kid;
    const key = await this.jwksClient.getSigningKey(kid);
    const signingKey = key.getPublicKey();

    try {
      const payload = verify(token, signingKey, {
        audience: [
          this.configService.get('auth0.audience'),
          this.configService.get('auth0.clientId'),
        ],
        issuer: this.configService.get('auth0.issuer'),
        algorithms: ['RS256'],
      });

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token verification failed');
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

  async createUser(dto: {
    email: string;
    given_name: string;
    family_name: string;
    role: string;
  }) {
    const { email, family_name, given_name, role } = dto;
    const password = this.generatePassword();
    try {
      const user = await this.managementClient.users.create({
        email,
        given_name,
        family_name,
        connection: 'Username-Password-Authentication',
        password,
      });

      const roles = await this.getAllRoles(role);
      let userRole: string;
      if (roles?.data.length) {
        userRole = roles.data[0].id;

        await this.managementClient.users.assignRoles(
          { id: user.data.user_id },
          { roles: [userRole] },
        );
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user on tenet');
    }
  }

  async getAllRoles(name?: string) {
    try {
      const options: GetRolesOptions = {};
      if (name) {
        options.name_filter = name;
      }

      const roles = await this.managementClient.roles.getAll(options);
      return roles;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch roles');
    }
  }
}

interface GetRolesOptions {
  name_filter?: string;
}
