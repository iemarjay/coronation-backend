import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AccessRequestedEvent, AssetEvents } from '../events/asset.event';

@Injectable()
export class AssetListener {
  private logger = new Logger(AssetListener.name);
  constructor() {}

  @OnEvent(AssetEvents.ACCESS_REQUESTED)
  async handleUserCreatedEvent(event: AccessRequestedEvent) {
    const {} = event;
  }
}
