import {
    Body,
    Controller,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    AuthenticatedUser,
    CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { RequirePremium } from '../../common/decorators/require-premium.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { PremiumGuard } from '../../common/guards/premium.guard';
import { AiQueueService } from './ai-queue.service';
import { PhotoCheckDto } from './dto/photo-check.dto';

@ApiTags('sessions')
@ApiBearerAuth('JWT')
@Controller('sessions')
export class PhotoCheckController {
    constructor(private readonly aiQueueService: AiQueueService) {}

    @UseGuards(JwtAuthGuard, PremiumGuard)
    @RequirePremium()
    @Post(':id/photo-check')
    @ApiOperation({ summary: 'Check a cooking photo (premium)' })
    check(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: PhotoCheckDto,
    ) {
        return this.aiQueueService.enqueueAndWait('photo-check', {
            sessionId: id,
            userId: user.id,
            publicId: dto.publicId,
        });
    }
}
