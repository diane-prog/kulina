import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentStatus } from '../../../common/enum/payment.enum';

export class PaymentWebhookDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Reference is required' })
    @IsString({ message: 'Reference must be a string' })
    reference: string;

    @ApiProperty({ enum: PaymentStatus })
    @IsEnum(PaymentStatus, { message: 'Status is not valid' })
    status: PaymentStatus;
}
