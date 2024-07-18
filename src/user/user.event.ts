import { User } from 'src/user/entities/user.entity';
import { UserCreatedEventRoute } from 'src/user/types';

export class UserCreatedEvent {
  constructor(
    public readonly user: Partial<User>,
    public readonly route: UserCreatedEventRoute,
  ) {}
}

export const UserEvents = {
  USER_CREATED: 'user.created',
};
