import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent, UserEvents } from 'src/user/user.event';
import { Auth0Service } from '../services/auth0.service';
import { Role } from '../types';
import { MailService } from 'src/shared/mail.service';

@Injectable()
export class UserListener {
  private logger = new Logger(UserListener.name);
  constructor(
    private readonly auth0: Auth0Service,
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

    if (user.role !== Role.vendor) {
      this.auth0.createUser(dto).catch((error) => {
        this.logger.error(error);
      });
    }

    this.mail.sendUserWelcomeEmail(event);
  }
}
