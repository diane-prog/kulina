import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
    private readonly transporter: nodemailer.Transporter | null;
    private readonly from: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {
        const host = this.configService.get<string>('mail.host');
        this.from = this.configService.get<string>('mail.from');

        this.transporter = host
            ? nodemailer.createTransport({
                  host,
                  port: this.configService.get<number>('mail.port'),
                  secure: this.configService.get<boolean>('mail.secure'),
                  auth: {
                      user: this.configService.get<string>('mail.user'),
                      pass: this.configService.get<string>('mail.password'),
                  },
              })
            : null;
    }

    /**
     * Sends an email when SMTP is configured, otherwise logs the payload.
     *
     * @param to - Recipient address
     * @param subject - Email subject
     * @param html - Email body
     * @returns The nodemailer result or a no-op marker
     */
    async sendMail(
        to: string,
        subject: string,
        html: string,
    ): Promise<unknown> {
        if (!this.transporter) {
            this.logger.warn(
                `SMTP is not configured. Email to ${to} was skipped (subject: ${subject}).`,
            );
            return { skipped: true };
        }

        return await this.transporter.sendMail({
            from: this.from,
            to,
            subject,
            html,
        });
    }
}
