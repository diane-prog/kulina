import { OtpService } from './otp.service';

describe('OtpService', () => {
    let service: OtpService;
    let mockRedisService: any;
    let mockMailerService: any;

    beforeEach(() => {
        mockRedisService = {
            set: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockResolvedValue('123456'),
            del: jest.fn().mockResolvedValue(undefined),
        };
        mockMailerService = {
            sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
        };

        service = new OtpService(mockRedisService, mockMailerService);
    });

    it('should generate a 6-digit code and store it in Redis', async () => {
        const code = await service.generateOtp('test@kulina.app');

        expect(code).toHaveLength(6);
        expect(mockRedisService.set).toHaveBeenCalledWith(
            'auth:otp:test@kulina.app',
            code,
            600,
        );
    });

    it('should verify matching code and delete from Redis', async () => {
        const isValid = await service.verifyOtp('test@kulina.app', '123456');

        expect(isValid).toBe(true);
        expect(mockRedisService.del).toHaveBeenCalledWith(
            'auth:otp:test@kulina.app',
        );
    });

    it('should reject wrong code', async () => {
        mockRedisService.get.mockResolvedValue('123456');

        const isValid = await service.verifyOtp('test@kulina.app', '999999');

        expect(isValid).toBe(false);
        expect(mockRedisService.del).not.toHaveBeenCalled();
    });

    it('should send email with generated code', async () => {
        await service.sendOtpEmail('test@kulina.app', '654321', 'Koffi');

        expect(mockMailerService.sendMail).toHaveBeenCalledWith(
            'test@kulina.app',
            expect.stringContaining('654321'),
            expect.stringContaining('654321'),
        );
    });
});
