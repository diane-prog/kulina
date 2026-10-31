import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    /**
     * Returns the API welcome message.
     *
     * @returns The welcome message
     */
    getHello(): string {
        return 'Kulina API — cook African recipes with confidence.';
    }

    /**
     * Returns the health check payload.
     *
     * @returns The health status
     */
    healthCheck(): { status: string; message: string } {
        return {
            status: 'ok',
            message: 'pong',
        };
    }
}
