import { ApiClient } from '@mailchimp/mailchimp_transactional';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  async sendEmail<T>(
    template: string,
    data: T,
    mail: {
      recipient: { email: string; name: string };
      cc?: string;
      subject: string;
      html?: string;
    },
  ) {
    const url = new URL(this.config.get('mail.url', { infer: true }));

    const requestData: EmailRequest = {
      to: mail.recipient.email,
      subject: mail.subject,
      body: mail.html,
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
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE-edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap"
      rel="stylesheet"
    />
    <title>Document</title>
    <style type="text/css">
      body {
        margin: 0;
        background-color: #cccccc;
      }
      table {
        border-spacing: 0;
      }
      td {
        padding: 0;
      }
      img {
        border: 0;
      }
      .wrapper {
        width: 100%;
        table-layout: fixed;
        background-color: #eff1f3;
        padding-bottom: 60px;
      }

      p a {
        text-decoration: none;
        color: #ff002b !important;
      }

      .main {
        background-color: #ffffff;
        margin: 0 auto;
        width: 100%;
        max-width: 700px;
        border-spacing: 0;
        font-family: 'Lato', sans-serif;
        color: #2a2d32;
      }

      .content {
        text-align: left;
        font-family: 'Lato', sans-serif;
        padding: 40px 56px;
        max-width: 700px;
      }

      .content p {
        font-weight: 400;
        color: #2a2d32;
        font-size: 14px;
        line-height: 22px;
      }

      .login {
        display: inline-block;
        width: 100%;
        padding: 11px 0;
        text-align: center;
        background-color: #000;
        vertical-align: top;
        font-family: 'Lato', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        text-decoration: none;
      }

      .footer {
        margin-top: 12px;
        color: #999999;
        background-color: #f5f5f5;
        height: 92px;
        /* width: 700.5px; */
        line-height: 16.8px;
        text-align: center;
        vertical-align: middle;
      }

      .footer img {
        line-height: 16.8px;
        vertical-align: middle;
        margin-right: 32px;
      }

      @media (max-width: 425px) {
        .header img {
          width: 258.67px;
          height: 32px;
        }
      }
    </style>
  </head>
  <body>
    <center class="wrapper">
      <table class="main" width="100%">
        <tr style="background-color: #191919">
          <td
            class="header"
            style="margin-bottom: 0; text-align: center; vertical-align: middle"
          >
            <img
              src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/logo"
              alt="coronation-logo"
              width="436.5"
              style="max-width: 100%; padding: 40px 0"
            />
          </td>
        </tr>

        <tr>
          <td>
            <table width="100%">
              <tr>
                <td class="content" style="text-align: left">
                  <h2
                    style="
                      font-weight: 700;
                      font-size: 24px;
                      line-height: 30px;
                      color: #191919;
                      margin: 0;
                    "
                  >
                    Access code for Login,
                  </h2>
                  <p style="margin-top: 12px; margin-bottom: 18px">
                    Dear ${user.firstName},
                  </p>
                  <p>
                    Your access code for logging into the Coronation brand
                    portal has been generated. Please use the code below to
                    complete your login:
                  </p>

                  <table
                    cellpadding="0"
                    cellspacing="0"
                    style="border-collapse: separate; border-spacing: 16px"
                  >
                    <tr>
                      <td
                        style="
                          width: 40px;
                          height: 40px;
                          font-size: 18px;
                          border: 1px solid #eef0f2;
                          text-align: center;
                          color: #ff002b;
                          font-weight: bold;
                        "
                      >
                        ${otp[0]}
                      </td>
                      <td
                        style="
                          width: 40px;
                          height: 40px;
                          font-size: 18px;
                          border: 1px solid #eef0f2;
                          text-align: center;
                          color: #ff002b;
                          font-weight: bold;
                        "
                      >
                        ${otp[1]}
                      </td>
                      <td
                        style="
                          width: 40px;
                          font-size: 18px;
                          height: 40px;
                          border: 1px solid #eef0f2;
                          text-align: center;
                          color: #ff002b;
                          font-weight: bold;
                        "
                      >
                        ${otp[2]}
                      </td>
                      <td
                        style="
                          width: 40px;
                          font-size: 18px;
                          height: 40px;
                          border: 1px solid #eef0f2;
                          text-align: center;
                          color: #ff002b;
                          font-weight: bold;
                        "
                      >
                        ${otp[3]}
                      </td>
                      <td
                        style="
                          width: 40px;
                          font-size: 18px;
                          height: 40px;
                          border: 1px solid #eef0f2;
                          text-align: center;
                          color: #ff002b;
                          font-weight: bold;
                        "
                      >
                        ${otp[4]}
                      </td>
                    </tr>
                  </table>

                  <hr style="color: #eef0f2; border-style: solid" />
                  <p
                    style="
                      font-weight: 400;
                      size: 14px;
                      color: #2a2d32;
                      line-height: 22px;
                    "
                  >
                    Best regards,<br />
                    <span
                      style="
                        font-weight: 700;
                        size: 16px;
                        color: #191919;
                        line-height: 20px;
                      "
                      >Coronation Team</span
                    >
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td>
            <table width="100%">
              <tr>
                <td class="footer">
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/gsmlu7jiqbnhwpz53rfj"
                    alt="youtube-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/smh4i6xlpcavd3im4mn0"
                    alt="x-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/fygzrygyhy4sspi2e5ot"
                    alt="linkedin-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/w0ol81szzcbt8swtbtqr"
                    alt="facebook-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/a1ltdyhvrk8epwr1ledk"
                    style="margin-right: 0"
                    alt="instagram-logo"
                  />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>

    <script>
      function copyToClipboard(text) {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);

        input.select();
        document.execCommand('copy');

        document.body.removeChild(input);
      }
    </script>
  </body>
</html>
`;

    this.sendEmail('user_login', data, {
      recipient: { email: data.user.email, name: data.user.full_name },
      subject: 'Login to Coronation',
      html,
    })
      .then((r) => {
        this.logger.log({ response: r });
      })
      .catch((error) => this.logger.error('Failed to send email', error));
  }

  sendUserWelcomeEmail(data: UserCreatedEvent) {
    const payload = {
      user: data.user,
      url: `${this.config.get('client.url', { infer: true })}sign-in`,
    };
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE-edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap"
      rel="stylesheet"
    />
    <title>Document</title>
    <style type="text/css">
      body {
        margin: 0;
        background-color: #cccccc;
      }
      table {
        border-spacing: 0;
      }
      td {
        padding: 0;
      }
      img {
        border: 0;
      }
      .wrapper {
        width: 100%;
        table-layout: fixed;
        background-color: #eff1f3;
        padding-bottom: 60px;
      }

      p a {
        text-decoration: none;
        color: #ff002b !important;
      }

      .main {
        background-color: #ffffff;
        margin: 0 auto;
        width: 100%;
        max-width: 700px;
        border-spacing: 0;
        font-family: 'Lato', sans-serif;
        color: #2a2d32;
      }

      .content {
        text-align: left;
        font-family: 'Lato', sans-serif;
        padding: 40px 56px;
        max-width: 700px;
      }

      .content p {
        font-weight: 400;
        color: #2a2d32;
        font-size: 14px;
        line-height: 22px;
      }

      .login {
        display: inline-block;
        width: 100%;
        padding: 11px 0;
        text-align: center;
        background-color: #000;
        vertical-align: top;
        font-family: 'Lato', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        text-decoration: none;
      }

      .footer {
        margin-top: 12px;
        color: #999999;
        background-color: #f5f5f5;
        height: 92px;
        /* width: 700.5px; */
        line-height: 16.8px;
        text-align: center;
        vertical-align: middle;
      }

      .footer img {
        line-height: 16.8px;
        vertical-align: middle;
        margin-right: 32px;
      }

      @media (max-width: 425px) {
        .header img {
          width: 258.67px;
          height: 32px;
        }
      }
    </style>
  </head>
  <body>
    <center class="wrapper">
      <table class="main" width="100%">
        <tr style="background-color: #191919">
          <td
            class="header"
            style="margin-bottom: 0; text-align: center; vertical-align: middle"
          >
            <img
              src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/logo"
              alt="coronation-logo"
              width="436.5"
              style="max-width: 100%; padding: 40px 0"
            />
          </td>
        </tr>

        <tr>
          <td>
            <table width="100%">
              <tr>
                <td class="content" style="text-align: left">
                  <h2
                    style="
                      font-weight: 700;
                      font-size: 24px;
                      line-height: 30px;
                      color: #191919;
                      margin: 0;
                    "
                  >
                    Welcome to Coronation Brand Portal,
                  </h2>
                  <p style="margin-top: 12px; margin-bottom: 18px">
                    Hello ${payload.user.firstName},
                  </p>
                  <p>
                    You have been invited to join the Coronation brand portal.
                    Click below to access and log in. To log in, you will need
                    to provide your email address to receive an access code for
                    subsequent logins.
                  </p>
                  <p>
                    Let's get started! Click below to access the portal now.
                  </p>
                  <a class="login" target="_blank" href="${payload.url}"> LOGIN </a>
                  <p style="margin-bottom: 12px">
                    Or copy and paste the link below into your browser to login.
                  </p>
                  <div
                    class="copy"
                    style="
                      text-align: start;
                      background-color: #ffffff;
                      border: 1px solid #eef0f2;
                      margin-bottom: 20px;
                      padding: 9px 24px;
                      position: relative;
                      vertical-align: middle;
                    "
                  >
                    <table style="width: 100%; border-collapse: collapse">
                      <tr>
                        <td style="width: 90%; vertical-align: middle">
                          <p
                            style="
                              font-size: 14px;
                              font-weight: 700;
                              color: #ff002b;
                              margin: 0;
                              text-decoration: none;
                            "
                          >
                            ${payload.url}
                          </p>
                        </td>
                        <td style="vertical-align: top">
                          <img
                            src="https://res.cloudinary.com/ddwsbqk2d/image/upload/v1729678739/coronation/f5zn9bvrpasf2av6ovy1.png"
                            style="width: 20px; height: 20px; cursor: pointer"
                            alt=""
                            onclick="copyToClipboard('${payload.url}')"
                          />
                        </td>
                      </tr>
                    </table>
                  </div>
                  <hr style="color: #eef0f2; border-style: solid" />
                  <p
                    style="
                      font-weight: 400;
                      size: 14px;
                      color: #2a2d32;
                      line-height: 22px;
                    "
                  >
                    Best regards,<br />
                    <span
                      style="
                        font-weight: 700;
                        size: 16px;
                        color: #191919;
                        line-height: 20px;
                      "
                      >Coronation Team</span
                    >
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td>
            <table width="100%">
              <tr>
                <td class="footer">
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/gsmlu7jiqbnhwpz53rfj"
                    alt="youtube-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/smh4i6xlpcavd3im4mn0"
                    alt="x-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/fygzrygyhy4sspi2e5ot"
                    alt="linkedin-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/w0ol81szzcbt8swtbtqr"
                    alt="facebook-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/a1ltdyhvrk8epwr1ledk"
                    style="margin-right: 0"
                    alt="instagram-logo"
                  />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>

    <script>
      function copyToClipboard(text) {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);

        input.select();
        document.execCommand('copy');

        document.body.removeChild(input);
      }
    </script>
  </body>
</html>
`;

    this.sendEmail('user_welcome', payload, {
      recipient: { email: data.user.email, name: data.user.full_name },
      subject: 'Login to Coronation Brand Portal',
      html,
    })
      .then((r) => {
        this.logger.log({ response: r });
      })
      .catch((error) => this.logger.error('Failed to send email', error));
  }

  sendAccessApprovedEmail(data: AccessRequestedEvent) {
    const payload = {
      user: data.request.user,
      url: `${this.config.get('client.url', { infer: true })}downloads?tab=${data.request.asset.assetType.name}`,
      fileName: data.request.asset.filename,
    };

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE-edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap"
      rel="stylesheet"
    />
    <title>Document</title>
    <style type="text/css">
      body {
        margin: 0;
        background-color: #cccccc;
      }
      table {
        border-spacing: 0;
      }
      td {
        padding: 0;
      }
      img {
        border: 0;
      }
      .wrapper {
        width: 100%;
        table-layout: fixed;
        background-color: #eff1f3;
        padding-bottom: 60px;
      }

      p a {
        text-decoration: none;
        color: #ff002b !important;
      }

      .main {
        background-color: #ffffff;
        margin: 0 auto;
        width: 100%;
        max-width: 700px;
        border-spacing: 0;
        font-family: 'Lato', sans-serif;
        color: #2a2d32;
      }

      .content {
        text-align: left;
        font-family: 'Lato', sans-serif;
        padding: 40px 56px;
        max-width: 700px;
      }

      .content p {
        font-weight: 400;
        color: #2a2d32;
        font-size: 14px;
        line-height: 22px;
      }

      .login {
        display: inline-block;
        width: 100%;
        padding: 11px 0;
        text-align: center;
        background-color: #000;
        vertical-align: top;
        font-family: 'Lato', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        text-decoration: none;
      }

      .footer {
        margin-top: 12px;
        color: #999999;
        background-color: #f5f5f5;
        height: 92px;
        /* width: 700.5px; */
        line-height: 16.8px;
        text-align: center;
        vertical-align: middle;
      }

      .footer img {
        line-height: 16.8px;
        vertical-align: middle;
        margin-right: 32px;
      }

      @media (max-width: 425px) {
        .header img {
          width: 258.67px;
          height: 32px;
        }
      }
    </style>
  </head>
  <body>
    <center class="wrapper">
      <table class="main" width="100%">
        <tr style="background-color: #191919">
          <td
            class="header"
            style="margin-bottom: 0; text-align: center; vertical-align: middle"
          >
            <img
              src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/logo"
              alt="coronation-logo"
              width="436.5"
              style="max-width: 100%; padding: 40px 0"
            />
          </td>
        </tr>

        <tr>
          <td>
            <table width="100%">
              <tr>
                <td class="content" style="text-align: left">
                  <h2
                    style="
                      font-weight: 700;
                      font-size: 24px;
                      line-height: 30px;
                      color: #191919;
                      margin: 0;
                    "
                  >
                    Request for File Download - Access Approved
                  </h2>
                  <p style="margin-top: 12px; margin-bottom: 18px">
                    Dear ${payload.user.firstName},
                  </p>
                  <p>
                    We are pleased to inform you that your request to download
                    the file, ${payload.fileName}, has been approved. You can access
                    the requested file by clicking the button below:
                  </p>
                  <a class="login" target="_blank" href="${payload.url}">
                    DOWNLOAD ASSET
                  </a>
                  <p style="margin-bottom: 12px">
                    Or copy and paste the link below into your browser to view
                    asset.
                  </p>
                  <div
                    class="copy"
                    style="
                      text-align: start;
                      background-color: #ffffff;
                      border: 1px solid #eef0f2;
                      margin-bottom: 20px;
                      padding: 9px 24px;
                      position: relative;
                      vertical-align: middle;
                    "
                  >
                    <table style="width: 100%; border-collapse: collapse">
                      <tr>
                        <td style="width: 90%; vertical-align: middle">
                          <p
                            style="
                              font-size: 14px;
                              font-weight: 700;
                              color: #ff002b;
                              margin: 0;
                              text-decoration: none;
                            "
                          >
                            ${payload.url}
                          </p>
                        </td>
                        <td style="vertical-align: top">
                          <img
                            src="https://res.cloudinary.com/ddwsbqk2d/image/upload/v1729678739/coronation/f5zn9bvrpasf2av6ovy1.png"
                            style="width: 20px; height: 20px; cursor: pointer"
                            alt=""
                            onclick="copyToClipboard('${payload.url}')"
                          />
                        </td>
                      </tr>
                    </table>
                  </div>
                  <p>
                    If you encounter any issues or need further assistance,
                    please don't hesitate to reach out to us. Thank you for your
                    patience, and we hope the file meets your needs.
                  </p>
                  <hr style="color: #eef0f2; border-style: solid" />
                  <p
                    style="
                      font-weight: 400;
                      size: 14px;
                      color: #2a2d32;
                      line-height: 22px;
                    "
                  >
                    Best regards,<br />
                    <span
                      style="
                        font-weight: 700;
                        size: 16px;
                        color: #191919;
                        line-height: 20px;
                      "
                      >Coronation Team</span
                    >
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td>
            <table width="100%">
              <tr>
                <td class="footer">
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/gsmlu7jiqbnhwpz53rfj"
                    alt="youtube-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/smh4i6xlpcavd3im4mn0"
                    alt="x-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/fygzrygyhy4sspi2e5ot"
                    alt="linkedin-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/w0ol81szzcbt8swtbtqr"
                    alt="facebook-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/a1ltdyhvrk8epwr1ledk"
                    style="margin-right: 0"
                    alt="instagram-logo"
                  />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>

    <script>
      function copyToClipboard(text) {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);

        input.select();
        document.execCommand('copy');

        document.body.removeChild(input);
      }
    </script>
  </body>
</html>
`;
    this.sendEmail('access_approved', payload, {
      recipient: { email: payload.user.email, name: payload.user.full_name },
      subject: 'Request for File Download - Access Approved',
      html,
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

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE-edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap"
      rel="stylesheet"
    />
    <title>Document</title>
    <style type="text/css">
      body {
        margin: 0;
        background-color: #cccccc;
      }
      table {
        border-spacing: 0;
      }
      td {
        padding: 0;
      }
      img {
        border: 0;
      }
      .wrapper {
        width: 100%;
        table-layout: fixed;
        background-color: #eff1f3;
        padding-bottom: 60px;
      }

      p a {
        text-decoration: none;
        color: #ff002b !important;
      }

      .main {
        background-color: #ffffff;
        margin: 0 auto;
        width: 100%;
        max-width: 700px;
        border-spacing: 0;
        font-family: 'Lato', sans-serif;
        color: #2a2d32;
      }

      .content {
        text-align: left;
        font-family: 'Lato', sans-serif;
        padding: 40px 56px;
        max-width: 700px;
      }

      .content p {
        font-weight: 400;
        color: #2a2d32;
        font-size: 14px;
        line-height: 22px;
      }

      .login {
        display: inline-block;
        width: 100%;
        padding: 11px 0;
        text-align: center;
        background-color: #000;
        vertical-align: top;
        font-family: 'Lato', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        text-decoration: none;
      }

      .footer {
        margin-top: 12px;
        color: #999999;
        background-color: #f5f5f5;
        height: 92px;
        /* width: 700.5px; */
        line-height: 16.8px;
        text-align: center;
        vertical-align: middle;
      }

      .footer img {
        line-height: 16.8px;
        vertical-align: middle;
        margin-right: 32px;
      }

      @media (max-width: 425px) {
        .header img {
          width: 258.67px;
          height: 32px;
        }
      }
    </style>
  </head>
  <body>
    <center class="wrapper">
      <table class="main" width="100%">
        <tr style="background-color: #191919">
          <td
            class="header"
            style="margin-bottom: 0; text-align: center; vertical-align: middle"
          >
            <img
              src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/logo"
              alt="coronation-logo"
              width="436.5"
              style="max-width: 100%; padding: 40px 0"
            />
          </td>
        </tr>

        <tr>
          <td>
            <table width="100%">
              <tr>
                <td class="content" style="text-align: left">
                  <h2
                    style="
                      font-weight: 700;
                      font-size: 24px;
                      line-height: 30px;
                      color: #191919;
                      margin: 0;
                    "
                  >
                    Request for File Download - Access Declined
                  </h2>
                  <p style="margin-top: 12px; margin-bottom: 18px">
                    Dear ${payload.user.firstName},
                  </p>
                  <p>
                    Thank you for your recent request to download ${
                      payload.fileName
                    }. After reviewing your request, we regret to inform you
                    that access to the requested file has been denied due to the
                    following reason:
                  </p>
                  <p>${payload.reason}</p>

                  <p style="margin-bottom: 12px">
                    If you believe this is an error or require further
                    clarification, please feel free to contact us, and we will
                    be happy to assist you.
                  </p>

                  <p>We appreciate your understanding and cooperation.</p>
                  <hr style="color: #eef0f2; border-style: solid" />
                  <p
                    style="
                      font-weight: 400;
                      size: 14px;
                      color: #2a2d32;
                      line-height: 22px;
                    "
                  >
                    Best regards,<br />
                    <span
                      style="
                        font-weight: 700;
                        size: 16px;
                        color: #191919;
                        line-height: 20px;
                      "
                      >Coronation Team</span
                    >
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td>
            <table width="100%">
              <tr>
                <td class="footer">
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/gsmlu7jiqbnhwpz53rfj"
                    alt="youtube-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/smh4i6xlpcavd3im4mn0"
                    alt="x-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/fygzrygyhy4sspi2e5ot"
                    alt="linkedin-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/w0ol81szzcbt8swtbtqr"
                    alt="facebook-logo"
                  />
                  <img
                    src="https://res.cloudinary.com/ddwsbqk2d/image/upload/f_auto,q_auto/v1/coronation/a1ltdyhvrk8epwr1ledk"
                    style="margin-right: 0"
                    alt="instagram-logo"
                  />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>

    <script>
      function copyToClipboard(text) {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);

        input.select();
        document.execCommand('copy');

        document.body.removeChild(input);
      }
    </script>
  </body>
</html>
`;
    this.sendEmail('access_declined', payload, {
      recipient: { email: payload.user.email, name: payload.user.full_name },
      subject: 'Request for File Download - Access Declined',
      html,
    })
      .then((r) => {
        this.logger.log({ response: r });
      })
      .catch((error) => this.logger.error('Failed to send email', error));
  }
}
