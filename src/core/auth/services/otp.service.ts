import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '../../../libs/mailer/mailer.service';
import { RedisService } from '../../../libs/redis/redis.service';

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);
    private readonly otpTtlSeconds = 600; // 10 minutes

    constructor(
        private readonly redisService: RedisService,
        private readonly mailerService: MailerService,
    ) {}

    /**
     * Generates a 6-digit numeric OTP code and stores it in Redis.
     *
     * @param identity - Email or phone
     * @returns The generated 6-digit code
     */
    async generateOtp(identity: string): Promise<string> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const key = this.getOtpKey(identity);

        await this.redisService.set(key, code, this.otpTtlSeconds);
        this.logger.log(`[OTP] Generated OTP code for ${identity}: ${code}`);

        return code;
    }

    /**
     * Verifies the OTP code submitted by the user.
     *
     * @param identity - Email or phone
     * @param code - 6-digit code
     * @returns True if valid, false otherwise
     */
    async verifyOtp(identity: string, code: string): Promise<boolean> {
        const key = this.getOtpKey(identity);
        const stored = await this.redisService.get(key);

        if (!stored || stored.trim() !== code.trim()) {
            return false;
        }

        // Single-use: delete after verification
        await this.redisService.del(key);
        return true;
    }

    /**
     * Sends the OTP code to the user via email.
     *
     * @param email - Recipient email
     * @param code - 6-digit OTP code
     * @param userName - Optional recipient name
     */
    async sendOtpEmail(
        email: string,
        code: string,
        userName?: string,
    ): Promise<void> {
        const greeting = userName ? `Bonjour ${userName},` : 'Bonjour,';
        const html = `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #ea580c; font-size: 24px; font-weight: 700; margin: 0;">Chef en poche — Kulina</h1>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Votre assistant culinaire africain</p>
                </div>
                
                <p style="color: #1f2937; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">${greeting}</p>
                
                <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                    Voici votre code de vérification pour vous connecter en toute sécurité à votre compte Kulina :
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; background-color: #fff7ed; border: 2px dashed #ea580c; border-radius: 8px; padding: 16px 36px;">
                        <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #ea580c; font-family: monospace;">${code}</span>
                    </div>
                </div>
                
                <p style="color: #6b7280; font-size: 13px; line-height: 1.5; text-align: center; margin-bottom: 24px;">
                    ⏳ Ce code expire dans <strong>10 minutes</strong> et ne doit être partagé avec personne.
                </p>
                
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                    Si vous n'êtes pas à l'origine de cette demande de connexion, vous pouvez ignorer cet email en toute sécurité.
                </p>
            </div>
        `;

        await this.mailerService.sendMail(
            email,
            `Votre code de connexion Kulina : ${code}`,
            html,
        );
    }

    /**
     * Builds the Redis key for storing the OTP.
     *
     * @param identity - Email or phone
     * @returns Redis key
     */
    private getOtpKey(identity: string): string {
        return `auth:otp:${identity.trim().toLowerCase()}`;
    }
}
