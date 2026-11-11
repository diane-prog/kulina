import {
    BadRequestException,
    Body,
    Controller,
    Get,
    NotFoundException,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    AuthenticatedUser,
    CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { ForgotPasswordDto } from '../users/dto/forgot-password.dto';
import { LoginUserDto } from '../users/dto/login.dto';
import { RegisterUserDto } from '../users/dto/register.dto';
import { ResetPasswordDto } from '../users/dto/reset-password.dto';
import { UsersService } from '../users/services/users.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly usersService: UsersService,
        private readonly tokenService: TokenService,
        private readonly otpService: OtpService,
    ) {}

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('register')
    @ApiOperation({ summary: 'Register a new account' })
    async register(@Body() dto: RegisterUserDto) {
        const result = await this.usersService.register(dto);

        return {
            message:
                'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
            user: result.user,
        };
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    @ApiOperation({ summary: 'Log in with credentials and send OTP code' })
    async login(@Body() dto: LoginUserDto) {
        const user = await this.usersService.validateCredentials(dto);
        const targetEmail = user.email;

        if (targetEmail) {
            const code = await this.otpService.generateOtp(targetEmail);
            await this.otpService.sendOtpEmail(
                targetEmail,
                code,
                user.fullname,
            );
        }

        return {
            requireOtp: true,
            identity: user.email ?? user.phone,
            message:
                'Identifiants valides. Un code de vérification à 6 chiffres a été envoyé à votre adresse email.',
        };
    }

    @Public()
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Post('verify-otp')
    @ApiOperation({ summary: 'Verify OTP code and receive access tokens' })
    async verifyOtp(@Body() dto: VerifyOtpDto, @Req() request: any) {
        const isValid = await this.otpService.verifyOtp(dto.identity, dto.code);

        if (!isValid) {
            throw new BadRequestException(
                'Code de vérification invalide ou expiré',
            );
        }

        const user = await this.usersService.findByIdentity(dto.identity);

        if (!user) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        await this.usersService.markEmailVerified(user.id);

        const tokens = await this.tokenService.issueTokens(
            user.id,
            request.headers['user-agent'],
            request.ip,
        );

        return {
            user: this.usersService.sanitizeUser(user),
            ...tokens,
        };
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('resend-otp')
    @ApiOperation({ summary: 'Resend OTP verification code' })
    async resendOtp(@Body() dto: ResendOtpDto) {
        const user = await this.usersService.findByIdentity(dto.identity);

        if (!user) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        if (user.email) {
            const code = await this.otpService.generateOtp(user.email);
            await this.otpService.sendOtpEmail(
                user.email,
                code,
                user.fullname,
            );
        }

        return {
            message:
                'Un nouveau code de vérification a été envoyé à votre adresse email.',
        };
    }

    @Public()
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Post('refresh')
    @ApiOperation({ summary: 'Rotate an access and refresh token pair' })
    refresh(@Body() dto: RefreshTokenDto) {
        return this.tokenService.rotateTokens(dto);
    }

    @Public()
    @Post('logout')
    @ApiOperation({ summary: 'Revoke a refresh token' })
    logout(@Body() dto: RefreshTokenDto) {
        return this.tokenService.revokeToken(dto);
    }

    @Public()
    @Post('forgot-password')
    @ApiOperation({ summary: 'Request a password reset link' })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.usersService.forgotPassword(dto);
    }

    @Public()
    @Post('reset-password')
    @ApiOperation({ summary: 'Reset a password with a reset token' })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.usersService.resetPassword(dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'Get the current user profile' })
    me(@CurrentUser() user: AuthenticatedUser) {
        return this.usersService.getCurrentUser(user.id);
    }
}
