import { SetMetadata } from '@nestjs/common';

export const PREMIUM_KEY = 'requiresPremium';
export const RequirePremium = () => SetMetadata(PREMIUM_KEY, true);
