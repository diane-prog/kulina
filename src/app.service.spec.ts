import { AppService } from './app.service';

describe('AppService', () => {
    let service: AppService;

    beforeEach(() => {
        service = new AppService();
    });

    describe('getHello', () => {
        it('should return the Kulina welcome message', () => {
            const actual = service.getHello();

            expect(actual).toContain('Kulina API');
        });
    });

    describe('healthCheck', () => {
        it('should return an ok health payload', () => {
            const actual = service.healthCheck();

            expect(actual).toEqual({ status: 'ok', message: 'pong' });
        });
    });
});
