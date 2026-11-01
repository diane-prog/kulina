import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
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
import { TokenService } from './services/token.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly usersService: UsersService,
        private readonly tokenService: TokenService,
    ) {}

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('register')
    @ApiOperation({ summary: 'Register a new account' })
    async register(@Body() dto: RegisterUserDto, @Req() request: any) {
        const result = await this.usersService.register(dto);
        const tokens = await this.tokenService.issueTokens(
            result.user.id as string,
            request.headers['user-agent'],
            request.ip,
        );

        return { user: result.user, ...tokens };
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    @ApiOperation({ summary: 'Log in with email or phone' })
    async login(@Body() dto: LoginUserDto, @Req() request: any) {
        const result = await this.usersService.login(dto);
        const tokens = await this.tokenService.issueTokens(
            result.user.id as string,
            request.headers['user-agent'],
            request.ip,
        );

        return { user: result.user, ...tokens };
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
