import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../libs/database/database.module';
import { UsersModule } from '../users/users.module';
import { Payment } from './entities/payment.entity';
import { HttpPaymentProvider } from './providers/http-payment.provider';
import { ManualPaymentProvider } from './providers/manual-payment.provider';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { PaymentsRepository } from './repositories/payments.repository';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([Payment]),
        ConfigModule,
        UsersModule,
    ],
    controllers: [SubscriptionsController],
    providers: [
        SubscriptionsService,
        PaymentsRepository,
        PaymentProviderFactory,
        ManualPaymentProvider,
        HttpPaymentProvider,
    ],
    exports: [SubscriptionsService, PaymentsRepository],
})
export class SubscriptionsModule {}
