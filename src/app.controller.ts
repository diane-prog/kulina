import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @ApiOperation({ summary: 'API welcome message' })
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('ping')
    @ApiOperation({ summary: 'Health check' })
    healthCheck(): { status: string; message: string } {
        return this.appService.healthCheck();
    }
}
