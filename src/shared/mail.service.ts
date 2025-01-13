import { ApiClient, MessageMetadata } from '@mailchimp/mailchimp_transactional';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ejs from 'ejs';
import * as path from 'path';
import { getResourcesDir } from 'src/helpers/path.helper';
import * as Mailchimp from '@mailchimp/mailchimp_transactional';
import { User } from 'src/user/entities/user.entity';
import { UserCreatedEvent } from 'src/user/user.event';
import { AccessRequestedEvent } from 'src/asset/events/asset.event';
import axios from 'axios';

interface ConfigServiceShape {
  url: string;
  name: string;
  client: { url: string };
  admin: { url: string };
  mailchimp: {
    apiKey: string;
  };
  mail: {
    from: string;
    from_name: string;
    url: string;
    apiKey: string;
  };
}

interface EmailRequest {
  to: string;

  subject: string;

  body: string;

  cc?: string;
}

@Injectable()
export class MailService {
  private readonly client: ApiClient;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService<ConfigServiceShape>) {
    this.client = Mailchimp(
      this.config.get('mailchimp.apiKey', { infer: true }),
    );
  }
  async sendTemplate<T>(
    template: string,
    data: T,
    options?: {
      template?: Record<string, any>;
      mail?: {
        metadata?: MessageMetadata & { website: string };
        tags?: string[];
        attachments?: { type: string; name: string; content: string }[];
        recipient: { email: string; name: string };
        subject: string;
      };
    },
  ) {
    data = Object.assign(
      {
        currentYear: new Date().getFullYear(),
        siteName: this.config.get('name', { infer: true }),
        serverUrl: this.config.get('url', { infer: true }),
        siteUrl: this.config.get('client.url', { infer: true }),
        adminUrl: this.config.get('admin.url', { infer: true }),
      },
      data,
    );

    const templatePath = getResourcesDir(
      path.join('templates/email', `${template}_en-us.ejs`),
    );

    const html = await ejs.renderFile(templatePath, data, options.template);

    return this.client.messages.send({
      message: {
        track_clicks: false,
        track_opens: false,
        inline_css: true,
        preserve_recipients: true,
        from_email: this.config.get('mail.from', { infer: true }),
        from_name: this.config.get('mail.from_name', { infer: true }),
        metadata: options.mail.metadata,
        tags: options.mail.tags,
        to: [options.mail.recipient],
        html: html,
        attachments: options.mail.attachments,
        subject: options.mail.subject,
      },
    });
  }

  async testTemplate<T>(
    template: string,
    data: T,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mail?: {
      recipient: { email: string; name: string };
      cc?: string;
      subject: string;
    },
  ) {
    const templatePath = getResourcesDir(
      path.join('templates/email', `${template}_en-us.ejs`),
    );

    const html = await ejs.renderFile(templatePath, data);

    const url = new URL(this.config.get('mail.url', { infer: true }));

    const requestData: EmailRequest = {
      to: 'echukwurah99@gmail.com',
      subject: 'Test this now',
      body: html.toString(),
    };

    const response = await axios.post(url.toString(), requestData, {
      headers: {
        'x-api-key': this.config.get('mail.apiKey', { infer: true }),
      },
    });

    return response.data;
  }

  async sendEmail<T>(
    template: string,
    data: T,
    mail: {
      recipient: { email: string; name: string };
      cc?: string;
      subject: string;
    },
  ) {
    const templatePath = getResourcesDir(
      path.join('templates/email', `${template}_en-us.ejs`),
    );

    const html = await ejs.renderFile(templatePath, data);
    const url = new URL(this.config.get('mail.url', { infer: true }));

    const requestData: EmailRequest = {
      to: mail.recipient.email,
      subject: mail.subject,
      body: html,
    };

    if (mail.cc) {
      requestData.cc = mail.cc;
    }
    const response = await axios.post(url.toString(), requestData, {
      headers: {
        'x-api-key': this.config.get('mail.apiKey', { infer: true }),
      },
    });

    return response.data;
  }

  sendUserLoginOtp(user: Partial<User>, otp: string) {
    const data = {
      user,
      otp,
    };
    this.sendEmail('user_login', data, {
      recipient: { email: data.user.email, name: data.user.full_name },
      subject: 'Login to Coronation',
    })
      .then((r) => {
        this.logger.log({ response: r, data });
      })
      .catch((error) => this.logger.error('Failed to send email', error));
  }

  sendTestUserLoginOtp(user, otp: string) {
    const data = {
      user,
      otp,
    };
    return this.testTemplate('user_login', data, {
      recipient: { email: data.user.email, name: data.user.full_name },
      subject: 'Login to Coronation',
    });
  }

  sendUserWelcomeEmail(data: UserCreatedEvent) {
    const payload = {
      user: data.user,
      url: `${this.config.get('client.url', { infer: true })}sign-in`,
    };
    this.sendEmail('user_welcome', payload, {
      recipient: { email: data.user.email, name: data.user.full_name },
      subject: 'Login to Coronation Brand Portal',
    })
      .then((r) => {
        this.logger.log({ response: r, data });
      })
      .catch((error) => this.logger.error('Failed to send email', error));
  }

  sendAccessApprovedEmail(data: AccessRequestedEvent) {
    const payload = {
      user: data.request.user,
      url: `${this.config.get('client.url', { infer: true })}downloads?tab=${data.request.asset.assetType.name}`,
      fileName: data.request.asset.filename,
    };
    this.sendEmail('access_approved', payload, {
      recipient: { email: payload.user.email, name: payload.user.full_name },
      subject: 'Request for File Download - Access Approved',
    })
      .then((r) => {
        this.logger.log({ response: r, data });
      })
      .catch((error) => this.logger.error('Failed to send email', error));
  }

  sendAccessDeclinedEmail(data: AccessRequestedEvent) {
    const payload = {
      user: data.request.user,
      reason: data.request.rejectionReason,
      fileName: data.request.asset.filename,
    };
    this.sendEmail('access_declined', payload, {
      recipient: { email: payload.user.email, name: payload.user.full_name },
      subject: 'Request for File Download - Access Declined',
    })
      .then((r) => {
        this.logger.log({ response: r, data });
      })
      .catch((error) => this.logger.error('Failed to send email', error));
  }
}
