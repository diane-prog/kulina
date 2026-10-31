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
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { CuisinesService } from './cuisines.service';
import { CreateCuisineDto } from './dto/create-cuisine.dto';
import { UpdateCuisineDto } from './dto/update-cuisine.dto';

@ApiTags('cuisines')
@Controller('cuisines')
export class CuisinesController {
    constructor(private readonly cuisinesService: CuisinesService) {}

    @Get()
    @ApiOperation({ summary: 'List African cuisines' })
    findAll(@Query('query') query?: string) {
        return this.cuisinesService.findAll(query);
    }

    @Get('admin/test')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @ApiOperation({ summary: 'Smoke test for the cuisines module' })
    adminTest() {
        return { status: 'ok', module: 'cuisines' };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a cuisine by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.cuisinesService.findOne(id);
    }

    @Post()
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin', 'contributor')
    @ApiOperation({ summary: 'Create a cuisine' })
    create(@Body() dto: CreateCuisineDto) {
        return this.cuisinesService.create(dto);
    }

    @Patch(':id')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin', 'contributor')
    @ApiOperation({ summary: 'Update a cuisine' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCuisineDto,
    ) {
        return this.cuisinesService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @ApiOperation({ summary: 'Delete a cuisine' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.cuisinesService.remove(id);
    }
}
