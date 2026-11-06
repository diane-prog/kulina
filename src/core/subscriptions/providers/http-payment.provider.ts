import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentStatus } from '../../../common/enum/payment.enum';
import { Payment } from '../entities/payment.entity';
import { CheckoutResult, PaymentProvider } from './payment-provider.interface';

@Injectable()
export class HttpPaymentProvider implements PaymentProvider {
    constructor(private readonly configService: ConfigService) {}

    /**
     * Creates a checkout through a configurable mobile money HTTP provider.
     *
     * @param payment - Payment entity
     * @returns Checkout result
     */
    async createCheckout(payment: Payment): Promise<CheckoutResult> {
        const baseUrl = this.configService.get<string>('MOBILE_MONEY_BASE_URL');
        const checkoutPath =
            this.configService.get<string>('MOBILE_MONEY_CHECKOUT_PATH') ??
            '/checkout';

        if (!baseUrl) {
            return {
                instructions: `Configure MOBILE_MONEY_BASE_URL to create a real checkout for reference ${payment.reference}.`,
                providerReference: payment.reference,
            };
        }

        const response = await fetch(`${baseUrl}${checkoutPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.configService.get<string>('MOBILE_MONEY_API_KEY') ?? ''}`,
            },
            body: JSON.stringify({
                reference: payment.reference,
                amountXof: payment.amountXof,
                currency: 'XOF',
                callbackUrl: this.configService.get<string>(
                    'MOBILE_MONEY_CALLBACK_URL',
                ),
            }),
        });

        const data = (await response.json()) as Record<string, any>;

        return {
            paymentUrl: data.paymentUrl ?? data.payment_url,
            instructions: data.instructions,
            providerReference:
                data.providerReference ?? data.reference ?? payment.reference,
        };
    }

    /**
     * Verifies the HMAC SHA-256 webhook signature.
     *
     * @param headers - HTTP headers
     * @param body - Webhook body
     * @returns Whether the signature is valid
     */
    verifyWebhook(headers: Record<string, any>, body: any): boolean {
        const secret = this.configService.get<string>(
            'MOBILE_MONEY_WEBHOOK_SECRET',
        );

        if (!secret) {
            return true;
        }

        const received = String(headers['x-kulina-signature'] ?? '');
        const expected = createHmac('sha256', secret)
            .update(JSON.stringify(body))
            .digest('hex');

        if (received.length !== expected.length) {
            return false;
        }

        return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
    }

    /**
     * Parses a provider payment webhook.
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
