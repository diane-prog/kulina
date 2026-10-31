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
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { QueryRecipesDto } from './dto/query-recipes.dto';
import { SearchByIngredientsDto } from './dto/search-by-ingredients.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { UpdateRecipeStatusDto } from './dto/update-recipe-status.dto';
import { RecipesService } from './recipes.service';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
    constructor(private readonly recipesService: RecipesService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'List published recipes with filters' })
    findAll(@Query() query: QueryRecipesDto) {
        return this.recipesService.findAll(query);
    }

    @Public()
    @Get('popular')
    @ApiOperation({ summary: 'List popular recipes' })
    findPopular(@Query('limit') limit?: string) {
        return this.recipesService.findPopular(
            limit ? Number.parseInt(limit, 10) : 10,
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Get('recommended')
    @ApiOperation({ summary: 'Recommend recipes for the current user' })
    findRecommended(@CurrentUser() user: AuthenticatedUser) {
        return this.recipesService.findRecommendedForUser(user.id);
    }

    @Public()
    @Post('search/by-ingredients')
    @ApiOperation({ summary: 'Find recipes from the ingredients you have' })
    searchByIngredients(@Body() dto: SearchByIngredientsDto) {
        return this.recipesService.searchByIngredients(dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the recipes module' })
    adminTest() {
        return { status: 'ok', module: 'recipes' };
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get a recipe detail' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const recipe = await this.recipesService.findOne(id);
        await this.recipesService.incrementViewCount(id);

        return recipe;
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Create a recipe' })
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateRecipeDto,
    ) {
        return this.recipesService.create(user.id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a recipe you created (or any as admin)' })
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRecipeDto,
    ) {
        return this.recipesService.update(
            id,
            user.id,
            this.isAdminUser(user),
            dto,
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin', 'contributor')
    @Patch(':id/status')
    @ApiOperation({ summary: 'Publish or archive a recipe' })
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRecipeStatusDto,
    ) {
        return this.recipesService.updateStatus(id, dto.status);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a recipe you created (or any as admin)' })
    remove(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.recipesService.remove(id, user.id, this.isAdminUser(user));
    }

    /**
     * Checks whether the current user can manage any recipe.
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
