import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Get()
    @ApiOperation({ summary: 'List all roles' })
    findAll() {
        return this.rolesService.findAll();
    }

    @Get('admin/test')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @ApiOperation({ summary: 'Smoke test for the roles module' })
    adminTest() {
        return { status: 'ok', module: 'roles' };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a role by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.rolesService.findOne(id);
    }

    @Post()
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin')
    @ApiOperation({ summary: 'Create a role' })
    create(@Body() dto: CreateRoleDto) {
        return this.rolesService.create(dto);
    }

    @Patch(':id')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin')
    @ApiOperation({ summary: 'Update a role' })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
        return this.rolesService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin')
    @ApiOperation({ summary: 'Delete a role' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.rolesService.remove(id);
    }
}
