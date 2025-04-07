import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';

@Injectable()
export class SendMailsService {
  private readonly logger = new Logger(SendMailsService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(to: any, subject: string, template: any, context?: any) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send verification email', error.stack);

      if (error.code === 'ETIMEDOUT') {
        throw new InternalServerErrorException(
          'Connection timeout while sending verification email. Please try again later.',
        );
      } else {
        throw new InternalServerErrorException(
          'Failed to send verification email.',
          error,
        );
      }
    }
  }
}
