import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    AuthenticatedUser,
    CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateSessionMessageDto } from './dto/create-session-message.dto';
import { UpdateSessionStepDto } from './dto/update-session-step.dto';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@ApiBearerAuth('JWT')
@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Start or resume a cooking session' })
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateSessionDto,
    ) {
        return this.sessionsService.create(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'List my cooking sessions' })
    findMine(@CurrentUser() user: AuthenticatedUser) {
        return this.sessionsService.findByUser(user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the sessions module' })
    adminTest() {
        return { status: 'ok', module: 'sessions' };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Get one cooking session' })
    findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.sessionsService.findOne(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/step')
    @ApiOperation({ summary: 'Set the current cooking step' })
    updateStep(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateSessionStepDto,
    ) {
        return this.sessionsService.updateStep(id, user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/next')
    @ApiOperation({ summary: 'Go to the next cooking step' })
    nextStep(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.sessionsService.nextStep(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/previous')
    @ApiOperation({ summary: 'Go back to the previous cooking step' })
    previousStep(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.sessionsService.previousStep(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/finish')
    @ApiOperation({ summary: 'Finish a cooking session' })
    finish(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.sessionsService.finish(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/abandon')
    @ApiOperation({ summary: 'Abandon a cooking session' })
    abandon(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.sessionsService.abandon(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/voice')
    @ApiOperation({ summary: 'Get the narration script for a session' })
    voice(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.sessionsService.getVoiceScript(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/messages')
    @ApiOperation({ summary: 'List messages for a cooking session' })
    listMessages(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.sessionsService.listMessages(
            id,
            user.id,
            page ? Number.parseInt(page, 10) : 1,
            limit ? Number.parseInt(limit, 10) : 20,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/messages')
    @ApiOperation({ summary: 'Send a fallback chat message' })
    addMessage(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateSessionMessageDto,
    ) {
        return this.sessionsService.addMessage(id, user.id, dto);
    }
}
