import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpPaymentProvider } from './http-payment.provider';
import { ManualPaymentProvider } from './manual-payment.provider';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PaymentProviderFactory {
    constructor(
        private readonly configService: ConfigService,
        private readonly manualProvider: ManualPaymentProvider,
        private readonly httpProvider: HttpPaymentProvider,
    ) {}

    /**
     * Returns the configured payment provider.
     *
     * @returns The payment provider
     */
    getProvider(): PaymentProvider {
        const provider = (
            this.configService.get<string>('MOBILE_MONEY_PROVIDER') ?? 'manual'
        ).toLowerCase();

        if (
            provider === 'http' ||
            provider === 'mtn_momo' ||
            provider === 'moov' ||
            provider === 'wave'
        ) {
            return this.httpProvider;
        }

        return this.manualProvider;
    }
}
