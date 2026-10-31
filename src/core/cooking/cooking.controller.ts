import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
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
import { CookingService } from './cooking.service';
import { StartCookingSessionDto } from './dto/start-cooking-session.dto';
import { UpdateCookingProgressDto } from './dto/update-cooking-progress.dto';

@ApiTags('cooking')
@ApiBearerAuth('JWT')
@Controller('cooking')
export class CookingController {
    constructor(private readonly cookingService: CookingService) {}

    @UseGuards(JwtAuthGuard)
    @Post('start')
    @ApiOperation({ summary: 'Start or resume a guided cooking session' })
    start(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: StartCookingSessionDto,
    ) {
        return this.cookingService.start(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'List my cooking sessions' })
    findMine(@CurrentUser() user: AuthenticatedUser) {
        return this.cookingService.findByUser(user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the cooking module' })
    adminTest() {
        return { status: 'ok', module: 'cooking' };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Get one cooking session' })
    findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.cookingService.findOne(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/progress')
    @ApiOperation({ summary: 'Update cooking progress' })
    updateProgress(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCookingProgressDto,
    ) {
        return this.cookingService.updateProgress(id, user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/next')
    @ApiOperation({ summary: 'Go to the next cooking step' })
    nextStep(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.cookingService.nextStep(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/previous')
    @ApiOperation({ summary: 'Go back to the previous cooking step' })
    previousStep(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.cookingService.previousStep(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/complete')
    @ApiOperation({ summary: 'Complete a cooking session' })
    complete(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.cookingService.complete(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/abandon')
    @ApiOperation({ summary: 'Abandon a cooking session' })
    abandon(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.cookingService.abandon(id, user.id);
    }
}
