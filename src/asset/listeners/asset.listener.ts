import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AccessRequestedEvent, AssetEvents } from '../events/asset.event';
import { AccessRequestStatus } from '../types';
import { MailService } from 'src/shared/mail.service';

@Injectable()
export class AssetListener {
  private logger = new Logger(AssetListener.name);
  constructor(private readonly mail: MailService) {}

  @OnEvent(AssetEvents.ACCESS_UPDATED)
  async handleAccessStatusEvent(event: AccessRequestedEvent) {
    console.log(event.request.status);
    if (event.request.status === AccessRequestStatus.accepted) {
      this.mail.sendAccessApprovedEmail(event);
    } else if (event.request.status === AccessRequestStatus.declined) {
      this.mail.sendAccessDeclinedEmail(event);
    }
  }
}
