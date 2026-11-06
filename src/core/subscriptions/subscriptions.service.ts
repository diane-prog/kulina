import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Plan } from '../../common/enum/plan.enum';
import { PaymentStatus } from '../../common/enum/payment.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { CheckoutDto } from './dto/checkout.dto';
import { Payment } from './entities/payment.entity';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { PaymentsRepository } from './repositories/payments.repository';

@Injectable()
export class SubscriptionsService {
    constructor(
        private readonly configService: ConfigService,
        private readonly paymentsRepository: PaymentsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly errorHandlingService: ErrorHandlingService,
        private readonly paymentProviderFactory: PaymentProviderFactory,
    ) {}

    /**
     * Returns the available plans.
     *
     * @returns Free and premium plan details
     */
    getPlans() {
        return [
            {
                code: Plan.FREE,
                name: 'Gratuit',
                priceXof: 0,
                features: [
                    'Recettes étape par étape',
                    'Minuteurs',
                    'Recherche par ingrédients',
                    'Budget en FCFA',
                ],
            },
            {
                code: Plan.PREMIUM,
                name: 'Premium',
                priceXof: Number.parseInt(
                    this.configService.get<string>('PREMIUM_PRICE_XOF') ??
                        '2500',
                    10,
                ),
                features: [
                    'Chat IA en cours de cuisson',
                    'Photo de contrôle',
                    'Voix mains libres',
                    'Vidéos plus tard',
                ],
            },
        ];
    }

    /**
     * Creates a payment intent and a provider checkout.
     *
     * @param userId - User identifier
     * @param dto - Checkout payload
     * @returns The payment and provider checkout details
     */
    async checkout(userId: string, dto: CheckoutDto) {
        const amountXof =
            dto.amountXof ??
            Number.parseInt(
                this.configService.get<string>('PREMIUM_PRICE_XOF') ?? '2500',
                10,
            );
        const startedAt = new Date();
        const endsAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        const providerName =
            dto.provider ??
            this.configService.get<string>('MOBILE_MONEY_PROVIDER') ??
            'manual';

        const payment = await this.paymentsRepository.create(
            new Payment({
                user: { id: userId } as any,
                provider: providerName,
                reference: randomUUID(),
                amountXof,
                status: PaymentStatus.PENDING,
                startedAt,
                endsAt,
            }),
        );

        const provider = this.paymentProviderFactory.getProvider();
        const checkout = await provider.createCheckout(payment);
        const updated = await this.paymentsRepository.update(
            { id: payment.id },
            {
                providerReference: checkout.providerReference,
                checkoutUrl: checkout.paymentUrl,
                instructions: checkout.instructions,
            },
        );

        return { payment: updated, checkout };
    }

    /**
     * Handles a provider webhook and upgrades the user when paid.
     *
     * @param headers - HTTP headers
     * @param body - Webhook body
     * @returns The updated payment
     */
    async handleWebhook(
        headers: Record<string, any>,
        body: any,
    ): Promise<Payment> {
        const provider = this.paymentProviderFactory.getProvider();

        if (!provider.verifyWebhook(headers, body)) {
            throw new ForbiddenException('Invalid payment webhook signature');
        }

        const parsed = provider.parseWebhook(body);
        const payment = await this.paymentsRepository.findOne({
            where: { reference: parsed.reference, deleted: false },
            relations: ['user'],
        });

        if (!payment) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Payment ${parsed.reference} not found`,
                'Payment not found',
            );
        }

        const updated = await this.paymentsRepository.update(
            { id: payment.id },
            { status: parsed.status },
        );

        if (parsed.status === PaymentStatus.PAID) {
            await this.usersRepository.update(
                { id: payment.user.id },
                {
                    plan: Plan.PREMIUM,
                    premiumUntil: payment.endsAt,
                },
            );
        }

        return updated;
    }
}
