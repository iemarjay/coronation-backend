import { AccessRequest } from '../entities/access-request.entity';

export class AccessRequestedEvent {
  constructor(public readonly request: AccessRequest) {}
}

export const AssetEvents = {
  ACCESS_REQUESTED: 'access.requested',
  ACCESS_UPDATED: 'access.updated',
};
