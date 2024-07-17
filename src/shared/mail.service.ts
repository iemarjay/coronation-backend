import { ApiClient, MessageMetadata } from '@mailchimp/mailchimp_transactional';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ejs from 'ejs';
import * as path from 'path';
import { getResourcesDir } from 'src/helpers/path.helper';
import * as Mailchimp from '@mailchimp/mailchimp_transactional';
import { User } from 'src/user/entities/user.entity';

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
  };
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

  sendUserLoginOtp(user: Partial<User>, otp: string) {
    const data = {
      user,
      otp,
    };
    this.sendTemplate('user_login', data, {
      mail: {
        recipient: { email: data.user.email, name: data.user.full_name },
        tags: ['user_login'],
        subject: 'Login to Coronation',
      },
    })
      .then((r) => {
        this.logger.log({ response: r, data });
      })
      .catch((error) => this.logger.error('Failed to send email', error));
  }
}
