import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';

@Injectable()
export class TokenService {
    constructor(
        private readonly configService: ConfigService,
        private readonly refreshTokensRepository: RefreshTokensRepository,
    ) {}

    /**
     * Issues an access token and a persisted refresh token.
     *
     * @param userId - User identifier
     * @param userAgent - Optional client user agent
     * @param ipAddress - Optional client IP address
     * @returns Access and refresh tokens
     */
    async issueTokens(
        userId: string,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = jwt.sign(
            { id: userId },
            this.configService.getOrThrow<string>('auth.jwtSecret'),
            {
                expiresIn: this.configService.get<string>(
                    'auth.jwtAccessExpirationTime',
                ) as jwt.SignOptions['expiresIn'],
            },
        );
        const refreshToken = jwt.sign(
            { id: userId, purpose: 'refresh-token' },
            this.configService.getOrThrow<string>('auth.jwtRefreshSecret'),
            {
                expiresIn: this.configService.get<string>(
                    'auth.jwtRefreshExpirationTime',
                ) as jwt.SignOptions['expiresIn'],
            },
        );
        const decoded = jwt.decode(refreshToken) as { exp?: number };
        const expiresAt = decoded.exp
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await this.refreshTokensRepository.create(
            new RefreshToken({
                user: { id: userId } as any,
                tokenHash: this.hashToken(refreshToken),
                expiresAt,
                userAgent,
                ipAddress,
            }),
        );

        return { accessToken, refreshToken };
    }

    /**
     * Rotates a refresh token and returns a new pair.
     *
     * @param dto - Refresh token payload
     * @returns New access and refresh tokens
     * @throws UnauthorizedException when the token is invalid, expired, or revoked
     */
    async rotateTokens(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        let payload: { id?: string; purpose?: string };

        try {
            payload = jwt.verify(
                dto.refreshToken,
                this.configService.getOrThrow<string>('auth.jwtRefreshSecret'),
            ) as { id?: string; purpose?: string };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (!payload.id || payload.purpose !== 'refresh-token') {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const stored = await this.refreshTokensRepository.findOne({
            where: {
                tokenHash: this.hashToken(dto.refreshToken),
                revokedAt: null,
                deleted: false,
            },
        });

        if (!stored || stored.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token expired or revoked');
        }

        await this.refreshTokensRepository.update(
            { id: stored.id },
            { revokedAt: new Date() },
        );

        return await this.issueTokens(payload.id);
    }

    /**
     * Revokes a refresh token.
     *
     * @param dto - Refresh token payload
     * @returns A confirmation message
     */
    async revokeToken(dto: RefreshTokenDto): Promise<{ message: string }> {
        const stored = await this.refreshTokensRepository.findOne({
            where: {
                tokenHash: this.hashToken(dto.refreshToken),
                deleted: false,
            },
        });

        if (stored && !stored.revokedAt) {
            await this.refreshTokensRepository.update(
                { id: stored.id },
                { revokedAt: new Date() },
            );
        }

        return { message: 'Logged out successfully' };
    }

    /**
     * Hashes a refresh token before storage.
     *
     * @param token - Raw refresh token
     * @returns SHA-256 hash
     */
    private hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
