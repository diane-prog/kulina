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
import { CreateRecipeCategoryDto } from './dto/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from './dto/update-recipe-category.dto';
import { RecipeCategoriesService } from './recipe-categories.service';

@ApiTags('recipe-categories')
@Controller('recipe-categories')
export class RecipeCategoriesController {
    constructor(
        private readonly recipeCategoriesService: RecipeCategoriesService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'List recipe categories' })
    findAll() {
        return this.recipeCategoriesService.findAll();
    }

    @Get('admin/test')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @ApiOperation({ summary: 'Smoke test for the recipe categories module' })
    adminTest() {
        return { status: 'ok', module: 'recipe-categories' };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a recipe category by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.recipeCategoriesService.findOne(id);
    }

    @Post()
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin', 'contributor')
    @ApiOperation({ summary: 'Create a recipe category' })
    create(@Body() dto: CreateRecipeCategoryDto) {
        return this.recipeCategoriesService.create(dto);
    }

    @Patch(':id')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin', 'contributor')
    @ApiOperation({ summary: 'Update a recipe category' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRecipeCategoryDto,
    ) {
        return this.recipeCategoriesService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @ApiOperation({ summary: 'Delete a recipe category' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.recipeCategoriesService.remove(id);
    }
}
