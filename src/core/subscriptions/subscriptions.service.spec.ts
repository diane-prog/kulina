import { ForbiddenException } from '@nestjs/common';
import { PaymentStatus } from '../../common/enum/payment.enum';
import { Plan } from '../../common/enum/plan.enum';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
    let service: SubscriptionsService;
    let mockPaymentsRepository: any;
    let mockUsersRepository: any;
    let mockErrorHandlingService: any;
    let mockProvider: any;
    let mockPaymentProviderFactory: any;

    beforeEach(() => {
        mockPaymentsRepository = {
            create: jest.fn(async (payment) => ({
                ...payment,
                id: 'payment-1',
            })),
            update: jest.fn(async (_criteria, patch) => ({
                id: 'payment-1',
                ...patch,
            })),
            findOne: jest.fn(),
        };
        mockUsersRepository = { update: jest.fn() };
        mockErrorHandlingService = { returnErrorOnNotFound: jest.fn() };
        mockProvider = {
            createCheckout: jest.fn().mockResolvedValue({
                instructions: 'Pay with the reference',
                providerReference: 'reference-1',
            }),
            verifyWebhook: jest.fn().mockReturnValue(true),
            parseWebhook: jest.fn(),
        };
        mockPaymentProviderFactory = {
            getProvider: jest.fn().mockReturnValue(mockProvider),
        };

        service = new SubscriptionsService(
            {
                get: jest.fn((key: string) =>
                    key === 'PREMIUM_PRICE_XOF' ? '2500' : undefined,
                ),
            } as any,
            mockPaymentsRepository,
            mockUsersRepository,
            mockErrorHandlingService,
            mockPaymentProviderFactory,
        );
    });

    describe('checkout', () => {
        it('should create a pending payment and store the provider checkout', async () => {
            const actual = await service.checkout('user-1', {});

            expect(mockPaymentsRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amountXof: 2500,
                    status: PaymentStatus.PENDING,
                }),
            );
            expect(mockProvider.createCheckout).toHaveBeenCalled();
            expect(mockPaymentsRepository.update).toHaveBeenCalledWith(
                { id: 'payment-1' },
                expect.objectContaining({
                    providerReference: 'reference-1',
                    instructions: 'Pay with the reference',
                }),
            );
            expect(actual.checkout.instructions).toBe('Pay with the reference');
        });
    });

    describe('handleWebhook', () => {
        it('should mark the payment paid and upgrade the user to premium', async () => {
            const endsAt = new Date('2026-12-06T00:00:00.000Z');
            mockProvider.parseWebhook.mockReturnValue({
                reference: 'reference-1',
                status: PaymentStatus.PAID,
            });
            mockPaymentsRepository.findOne.mockResolvedValue({
                id: 'payment-1',
                user: { id: 'user-1' },
                endsAt,
            });

            await service.handleWebhook({}, { reference: 'reference-1' });

            expect(mockPaymentsRepository.update).toHaveBeenCalledWith(
                { id: 'payment-1' },
                { status: PaymentStatus.PAID },
            );
            expect(mockUsersRepository.update).toHaveBeenCalledWith(
                { id: 'user-1' },
                { plan: Plan.PREMIUM, premiumUntil: endsAt },
            );
        });

        it('should reject a webhook with an invalid signature', async () => {
            mockProvider.verifyWebhook.mockReturnValue(false);

            await expect(
                service.handleWebhook({}, { reference: 'reference-1' }),
            ).rejects.toBeInstanceOf(ForbiddenException);
            expect(mockPaymentsRepository.findOne).not.toHaveBeenCalled();
        });
    });
});
