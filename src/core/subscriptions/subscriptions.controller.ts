import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    AuthenticatedUser,
    CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CheckoutDto } from './dto/checkout.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller()
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @Public()
    @Get('plans')
    @ApiOperation({ summary: 'List available plans' })
    plans() {
        return this.subscriptionsService.getPlans();
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Post('subscriptions/checkout')
    @ApiOperation({ summary: 'Create a premium checkout' })
    checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
        return this.subscriptionsService.checkout(user.id, dto);
    }

    @Public()
    @Post('webhooks/payments')
    @ApiOperation({ summary: 'Handle a mobile money payment webhook' })
    webhook(@Body() dto: PaymentWebhookDto) {
        return this.subscriptionsService.handleWebhook(dto);
    }
}
