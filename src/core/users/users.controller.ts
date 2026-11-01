import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
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
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { BulkUpdateAuthorizedDto } from './dto/bulk-update-authorized.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './services/users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'Get the current user profile' })
    me(@CurrentUser() user: AuthenticatedUser) {
        return this.usersService.getCurrentUser(user.id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Patch('me')
    @ApiOperation({ summary: 'Update the current user profile' })
    updateProfile(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(user.id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Patch('me/password')
    @ApiOperation({ summary: 'Change the current user password' })
    updatePassword(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: UpdatePasswordDto,
    ) {
        return this.usersService.updatePassword(user.id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get()
    @ApiOperation({ summary: 'List users (admin)' })
    findAll(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: QueryUsersDto,
    ) {
        return this.usersService.getAllUsers(user.id, query);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the users module' })
    adminTest() {
        return { status: 'ok', module: 'users' };
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Patch('bulk-authorized')
    @ApiOperation({ summary: 'Bulk update user authorization (admin)' })
    bulkUpdateAuthorized(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: BulkUpdateAuthorizedDto,
    ) {
        return this.usersService.bulkUpdateAuthorization(
            user.id,
            dto.ids,
            dto.isAuthorized,
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get(':id')
    @ApiOperation({ summary: 'Get one user (admin)' })
    findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.usersService.getUserById(user.id, id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Patch(':id')
    @ApiOperation({ summary: 'Update a user role or status (admin)' })
    updateUser(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AdminUpdateUserDto,
    ) {
        return this.usersService.adminUpdateUser(user.id, id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user (admin)' })
    remove(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.usersService.removeUser(user.id, id);
    }
}
