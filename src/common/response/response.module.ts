import { Global, Module } from '@nestjs/common';
import { ErrorHandlingService } from './errorHandler.service';

@Global()
@Module({
    providers: [ErrorHandlingService],
    exports: [ErrorHandlingService],
})
export class ResponseModule {}
