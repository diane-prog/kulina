import {
    Controller,
    Delete,
    Get,
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
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth('JWT')
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'List my favorite recipes' })
    findMine(@CurrentUser() user: AuthenticatedUser) {
        return this.favoritesService.findByUser(user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the favorites module' })
    adminTest() {
        return { status: 'ok', module: 'favorites' };
    }

    @UseGuards(JwtAuthGuard)
    @Post(':recipeId')
    @ApiOperation({ summary: 'Add a recipe to favorites' })
    add(
        @CurrentUser() user: AuthenticatedUser,
        @Param('recipeId', ParseUUIDPipe) recipeId: string,
    ) {
        return this.favoritesService.add(user.id, recipeId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':recipeId')
    @ApiOperation({ summary: 'Remove a recipe from favorites' })
    remove(
        @CurrentUser() user: AuthenticatedUser,
        @Param('recipeId', ParseUUIDPipe) recipeId: string,
    ) {
        return this.favoritesService.remove(user.id, recipeId);
    }
}
