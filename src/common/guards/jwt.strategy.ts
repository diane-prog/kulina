import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './jwt.strategy.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('auth.jwtSecret'),
        });
    }

    /**
     * Resolves the authenticated user from the JWT payload.
     *
     * @param payload - Decoded JWT payload
     * @returns The matching user
     */
    async validate(payload: { id: string }) {
        return this.authService.validateUser(
            payload,
            'No matching credentials found',
        );
    }
}
