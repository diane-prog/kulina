import {
    Body,
    Controller,
    Delete,
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
import { Public } from '../../common/decorators/public.decorator';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { QueryTutorialsDto } from './dto/query-tutorials.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';
import { TutorialsService } from './tutorials.service';

@ApiTags('tutorials')
@Controller('tutorials')
export class TutorialsController {
    constructor(private readonly tutorialsService: TutorialsService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'List video tutorials' })
    findAll(@Query() query: QueryTutorialsDto) {
        return this.tutorialsService.findAll(query);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the tutorials module' })
    adminTest() {
        return { status: 'ok', module: 'tutorials' };
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get a tutorial by id' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const tutorial = await this.tutorialsService.findOne(id);
        await this.tutorialsService.incrementViewCount(id);

        return tutorial;
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Create a video tutorial' })
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateTutorialDto,
    ) {
        return this.tutorialsService.create(user.id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a tutorial you created' })
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTutorialDto,
    ) {
        return this.tutorialsService.update(
            id,
            user.id,
            this.isAdminUser(user),
            dto,
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a tutorial you created' })
    remove(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.tutorialsService.remove(
            id,
            user.id,
            this.isAdminUser(user),
        );
    }

    /**
     * Checks whether the current user can manage any tutorial.
     *
     * @param user - Authenticated user
     * @returns True for administrators and moderators
     */
    private isAdminUser(user: AuthenticatedUser): boolean {
        return ['super_admin', 'admin', 'moderator'].includes(
            user.role?.label?.toLowerCase(),
        );
    }
}
