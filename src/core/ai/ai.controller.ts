import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    AuthenticatedUser,
    CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiQueueService } from './ai-queue.service';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/chat.dto';
import { StructureRecipeDto } from './dto/structure-recipe.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly aiQueueService: AiQueueService,
    ) {}

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Post('chat')
    @ApiOperation({ summary: 'Ask the cooking assistant (premium)' })
    chat(@CurrentUser() user: AuthenticatedUser, @Body() dto: AiChatDto) {
        return this.aiService.chat(dto.sessionId, user.id, dto.text);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Post('structure')
    @ApiOperation({ summary: 'Structure a raw recipe transcript' })
    structure(@Body() dto: StructureRecipeDto) {
        return this.aiService.structureRecipe(dto.transcript);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the AI module' })
    adminTest() {
        return { status: 'ok', module: 'ai' };
    }
}
