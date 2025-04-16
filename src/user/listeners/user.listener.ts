import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent, UserEvents } from 'src/user/user.event';
import { Role } from '../types';
import { MailService } from 'src/shared/mail.service';
import { OktaService } from '../services/okta.service';

@Injectable()
export class UserListener {
  private logger = new Logger(UserListener.name);
  constructor(
    private readonly okta: OktaService,
    private readonly mail: MailService,
  ) {}

  @OnEvent(UserEvents.USER_CREATED)
  async handleUserCreatedEvent(event: UserCreatedEvent) {
    const { user } = event;
    const dto: any = {
      email: user.email,
      given_name: user.firstName,
      role: user.role,
    };

    if (user.lastName) {
      dto.family_name = user.lastName.trim();
    }

    // if (user.role !== Role.vendor) {
    //   this.okta
    //     .createUser(dto)
    //     .then(() => {
    //       this.mail.sendUserWelcomeEmail(event);
    //     })
    //     .catch((error) => {
    //       this.logger.error(error);
    //     });
    // }
  }

  @OnEvent(UserEvents.SUPER_USER_CREATED)
  async handleSuperUserCreatedEvent(event: UserCreatedEvent) {
    const { user } = event;
    const dto: any = {
      email: user.email,
      given_name: user.firstName,
      roles: [Role.owner, Role.admin],
    };

    if (user.lastName) {
      dto.family_name = user.lastName.trim();
    }

    this.okta
      .assignRole(dto)
      .then(() => {
        this.mail.sendUserWelcomeEmail(event);
      })
      .catch((error) => {
        this.logger.error(error);
      });
  }
}
