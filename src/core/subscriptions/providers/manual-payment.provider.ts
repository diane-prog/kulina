import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../../../common/enum/payment.enum';
import { Payment } from '../entities/payment.entity';
import { CheckoutResult, PaymentProvider } from './payment-provider.interface';

@Injectable()
export class ManualPaymentProvider implements PaymentProvider {
    constructor(private readonly configService: ConfigService) {}

    /**
     * Creates a manual mobile money checkout instruction.
     *
     * @param payment - Payment entity
     * @returns Checkout instructions
     */
    async createCheckout(payment: Payment): Promise<CheckoutResult> {
        return {
            instructions: `Pay ${payment.amountXof} XOF using your mobile money account and use reference ${payment.reference}.`,
            providerReference: payment.reference,
        };
    }

    /**
     * Verifies the shared webhook secret.
     *
     * @param headers - HTTP headers
     * @param _body - Webhook body
     * @returns Whether the webhook is allowed
     */
    verifyWebhook(headers: Record<string, any>, _body: any): boolean {
        const expected = this.configService.get<string>(
            'MOBILE_MONEY_WEBHOOK_SECRET',
        );

        if (!expected) {
            return true;
        }

        return headers['x-kulina-webhook-secret'] === expected;
    }

    /**
     * Parses a manual payment webhook.
     *
     * @param body - Webhook body
     * @returns Reference and payment status
     */
    parseWebhook(body: any): {
        reference: string;
        status: PaymentStatus;
    } {
        return {
            reference: String(body.reference),
            status: body.status as PaymentStatus,
        };
    }
}
