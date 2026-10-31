import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();

        appController = app.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return the Kulina welcome message', () => {
            expect(appController.getHello()).toContain('Kulina API');
        });
    });

    describe('healthCheck', () => {
        it('should return the ping payload', () => {
            expect(appController.healthCheck()).toEqual({
                status: 'ok',
                message: 'pong',
            });
        });
    });
});
