import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../libs/database/database.module';
import { MailerModule } from '../../libs/mailer/mailer.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([RefreshToken]),
        ConfigModule,
        UsersModule,
        MailerModule,
    ],
    controllers: [AuthController],
    providers: [TokenService, RefreshTokensRepository, OtpService],
    exports: [TokenService, OtpService],
})
export class AuthModule {}
