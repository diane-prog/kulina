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
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { RecipeStatus } from '../../common/enum/recipe.enum';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRecipeDto } from '../recipes/dto/create-recipe.dto';
import { QueryRecipesDto } from '../recipes/dto/query-recipes.dto';
import { UpdateRecipeDto } from '../recipes/dto/update-recipe.dto';
import { RecipesService } from '../recipes/recipes.service';
import { AdminImportService } from './admin-import.service';
import { ImportRecipesDto } from './dto/import-recipes.dto';
import { ImportRecipeDto } from './dto/import-recipe.dto';

@ApiTags('admin')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles('super_admin', 'admin')
@Controller('admin/recipes')
export class AdminRecipesController {
    constructor(
        private readonly adminImportService: AdminImportService,
        private readonly recipesService: RecipesService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'List all recipes including drafts' })
    findAll(@Query() query: QueryRecipesDto) {
        return this.recipesService.findAll(query, true);
    }

    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the admin module' })
    adminTest() {
        return { status: 'ok', module: 'admin' };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a recipe including drafts' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.recipesService.findOne(id, true);
    }

    @Post()
    @ApiOperation({ summary: 'Create a recipe as an administrator' })
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateRecipeDto,
    ) {
        return this.recipesService.create(user.id, dto);
    }

    @Post('import')
    @ApiOperation({ summary: 'Import a recipe from YAML or JSON' })
    import(@Body() dto: ImportRecipeDto) {
        return this.adminImportService.importYaml(dto.yaml);
    }

    @Post('import-bulk')
    @ApiOperation({ summary: 'Import multiple recipes from YAML or JSON' })
    importBulk(@Body() dto: ImportRecipesDto) {
        return this.adminImportService.importMany(dto.recipes);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update any recipe as an administrator' })
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRecipeDto,
    ) {
        return this.recipesService.update(id, user.id, true, dto);
    }

    @Patch(':id/publish')
    @ApiOperation({ summary: 'Publish a recipe' })
    publish(@Param('id', ParseUUIDPipe) id: string) {
        return this.recipesService.updateStatus(id, RecipeStatus.PUBLISHED);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete any recipe as an administrator' })
    remove(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.recipesService.remove(id, user.id, true);
    }
}
