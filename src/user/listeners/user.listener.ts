import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent, UserEvents } from 'src/user/user.event';
import { Auth0Service } from '../services/auth0.service';
import { Role } from '../types';

@Injectable()
export class UserListener {
  private logger = new Logger(UserListener.name);
  constructor(private readonly auth0: Auth0Service) {}

  @OnEvent(UserEvents.USER_CREATED)
  async handleUserCreatedEvent(event: UserCreatedEvent) {
    const { user } = event;
    const dto = {
      email: user.email,
      given_name: user.firstName,
      family_name: user.lastName,
      role: user.role,
    };

    if (user.role !== Role.vendor) {
      this.auth0.createUser(dto).catch((error) => {
        this.logger.error(error);
      });
    }
  }
}
