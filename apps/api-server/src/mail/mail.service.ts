import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isEnabled = false;

  constructor(private configService: ConfigService) {
    this.isEnabled = this.configService.get<string>('MAIL_ENABLED') === 'true';

    if (this.isEnabled) {
      try {
        this.transporter = nodemailer.createTransport({
          host: this.configService.get<string>('MAIL_HOST'),
          port: this.configService.get<number>('MAIL_PORT'),
          secure: this.configService.get<number>('MAIL_PORT') === 465,
          auth: {
            user: this.configService.get<string>('MAIL_USER'),
            pass: this.configService.get<string>('MAIL_PASS'),
          },
        });
        this.logger.log('MailService initialized with SMTP credentials');
      } catch (error) {
        this.logger.error('Failed to initialize MailService', error);
        this.isEnabled = false;
      }
    } else {
      this.logger.log(
        'MailService is disabled (MAIL_ENABLED=false). Emails will be logged to console.',
      );
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string, locale = 'en'): Promise<void> {
    const isVi = locale === 'vi';

    const subject = isVi
      ? 'Khôi phục mật khẩu tài khoản học tập'
      : 'Reset your learning account password';

    const html = isVi
      ? `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Yêu cầu đặt lại mật khẩu</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản học tập liên kết với email này.</p>
        <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu của bạn. Link này sẽ hết hạn sau 15 phút.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Đặt Lại Mật Khẩu</a>
        </div>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #666; font-size: 12px;">Nếu nút bấm không hoạt động, hãy copy đường dẫn này và dán vào trình duyệt: ${resetUrl}</p>
      </div>
      `
      : `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset the password for the learning account associated with this email address.</p>
        <p>Please click the button below to reset your password. This link will expire in 15 minutes.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request a password reset, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser: ${resetUrl}</p>
      </div>
      `;

    if (!this.isEnabled || !this.transporter) {
      this.logger.debug(`================= EMAIL LOG =================`);
      this.logger.debug(`To: ${email}`);
      this.logger.debug(`Subject: ${subject}`);
      this.logger.debug(`Reset URL: ${resetUrl}`);
      this.logger.debug(`=============================================`);
      return;
    }

    try {
      const from =
        this.configService.get<string>('MAIL_FROM') || 'LMS Platform <noreply@example.com>';
      await this.transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
    }
  }
}
