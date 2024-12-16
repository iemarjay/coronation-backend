import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OtpService } from 'src/shared/otp.service';
import { UserRepository } from 'src/user/repositories/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/shared/mail.service';
import * as OktaJwtVerifier from '@okta/jwt-verifier';
import * as okta from '@okta/okta-sdk-nodejs';

@Injectable()
export class OktaService {
  private readonly logger = new Logger(OktaService.name);
  private oktaClient: okta.Client;
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly emitter: EventEmitter2,
    private readonly otp: OtpService,
  ) {
    this.oktaClient = new okta.Client({
      orgUrl: this.config.get('okta.url'),
      token: this.config.get('okta.api_token'),
    });
  }

  async verify(token: string) {
    try {
      const oktaVerifier = new OktaJwtVerifier({
        issuer: this.config.get('okta.issuer'),
        clientId: this.config.get('okta.clientId'),
      });

      const jwt = await oktaVerifier.verifyAccessToken(
        token,
        this.config.get('okta.audience'),
      );

      return jwt.claims;
    } catch (error) {
      throw new UnauthorizedException(error.message ?? 'Invalid Token');
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
      const groupFound = await this.getGroupIdByName(role);
      const user = await this.oktaClient.userApi.createUser({
        body: {
          profile: {
            firstName: given_name,
            lastName: family_name,
            email: email,
            login: email,
          },
          credentials: {
            password: {
              value: password,
            },
          },
        },
      });

      if (groupFound) {
        await this.oktaClient.groupApi.assignUserToGroup({
          groupId: groupFound,
          userId: user.id,
        });
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message ?? 'Failed to create user on tenant',
      );
    }
  }

  async assignRole(dto: {
    email: string;
    given_name: string;
    family_name: string;
    roles: string[];
  }) {
    try {
      const users = await this.oktaClient.userApi.listUsers();

      let userId = null;
      for await (const user of users) {
        if (user.profile.email === dto.email) {
          userId = user.id;
          return userId;
        }
      }
      if (!userId) throw new NotFoundException('User not fount on Okta');

      for (const role of dto.roles) {
        const groupFound = await this.getGroupIdByName(role);

        if (groupFound) {
          await this.oktaClient.groupApi.assignUserToGroup({
            groupId: groupFound,
            userId,
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

  private async getGroupIdByName(roleName: string): Promise<string> {
    roleName = roleName.charAt(0).toUpperCase() + roleName.slice(1);
    const roles = await this.oktaClient.groupApi.listGroups();
    for await (const role of roles) {
      if (role.profile.name === roleName) {
        return role.id;
      }
    }
    throw new Error(
      `Group "${roleName}" not found in organization Okta groups`,
    );
  }

  async createGroups(groups: string[]) {
    for (const groupName of groups) {
      try {
        const formattedGroupName =
          groupName.charAt(0).toUpperCase() + groupName.slice(1);

        await this.oktaClient.groupApi.createGroup({
          group: {
            profile: {
              name: formattedGroupName,
              description: `Group for ${formattedGroupName}s`,
            },
          },
        });
      } catch (error) {
        this.logger.log(
          (error?.errorCauses?.[0]?.['errorSummary'] || error) ??
            `Failed to create group "${groupName}":`,
        );
      }
    }
  }
}
