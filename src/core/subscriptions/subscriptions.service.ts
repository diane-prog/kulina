import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Plan } from '../../common/enum/plan.enum';
import { PaymentStatus } from '../../common/enum/payment.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { CheckoutDto } from './dto/checkout.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { Payment } from './entities/payment.entity';
import { PaymentsRepository } from './repositories/payments.repository';

@Injectable()
export class SubscriptionsService {
    constructor(
        private readonly configService: ConfigService,
        private readonly paymentsRepository: PaymentsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly errorHandlingService: ErrorHandlingService,
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
     * Creates a payment intent for the premium plan.
     *
     * @param userId - User identifier
     * @param dto - Checkout payload
     * @returns The created payment
     */
    async checkout(userId: string, dto: CheckoutDto): Promise<Payment> {
        const amountXof =
            dto.amountXof ??
            Number.parseInt(
                this.configService.get<string>('PREMIUM_PRICE_XOF') ?? '2500',
                10,
            );
        const startedAt = new Date();
        const endsAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

        return await this.paymentsRepository.create(
            new Payment({
                user: { id: userId } as any,
                provider: dto.provider ?? 'manual',
                reference: randomUUID(),
                amountXof,
                status: PaymentStatus.PENDING,
                startedAt,
                endsAt,
            }),
        );
    }

    /**
     * Handles a payment webhook and upgrades the user when paid.
     *
     * @param dto - Payment webhook payload
     * @returns The updated payment
     */
    async handleWebhook(dto: PaymentWebhookDto): Promise<Payment> {
        const payment = await this.paymentsRepository.findOne({
            where: { reference: dto.reference, deleted: false },
            relations: ['user'],
        });

        if (!payment) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Payment ${dto.reference} not found`,
                'Payment not found',
            );
        }

        const updated = await this.paymentsRepository.update(
            { id: payment.id },
            { status: dto.status },
        );

        if (dto.status === PaymentStatus.PAID) {
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
