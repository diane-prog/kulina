import { PaymentStatus } from '../../../common/enum/payment.enum';
import { Payment } from '../entities/payment.entity';

export interface CheckoutResult {
    paymentUrl?: string;
    instructions?: string;
    providerReference: string;
}

export interface PaymentProvider {
    createCheckout(payment: Payment): Promise<CheckoutResult>;
    verifyWebhook(headers: Record<string, any>, body: any): boolean;
    parseWebhook(body: any): {
        reference: string;
        status: PaymentStatus;
    };
}
