import { User } from 'src/user/entities/user.entity';
import { AccessRequest } from '../entities/access-request.entity';

export class AccessRequestedEvent {
  constructor(
    public readonly request: AccessRequest,
    public readonly user: Partial<User>,
  ) {}
}

export const AssetEvents = {
  ACCESS_REQUESTED: 'access.requested',
  ACCESS_UPDATED: 'access.updated',
};
