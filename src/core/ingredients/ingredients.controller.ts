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
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { QueryIngredientsDto } from './dto/query-ingredients.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientsService } from './ingredients.service';

@ApiTags('ingredients')
@Controller('ingredients')
export class IngredientsController {
    constructor(private readonly ingredientsService: IngredientsService) {}

    @Get()
    @ApiOperation({ summary: 'List ingredients with FCFA reference prices' })
    findAll(@Query() query: QueryIngredientsDto) {
        return this.ingredientsService.findAll(query);
    }

    @Get('admin/test')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @ApiOperation({ summary: 'Smoke test for the ingredients module' })
    adminTest() {
        return { status: 'ok', module: 'ingredients' };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an ingredient by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ingredientsService.findOne(id);
    }

    @Post()
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin', 'contributor')
    @ApiOperation({ summary: 'Create an ingredient' })
    create(@Body() dto: CreateIngredientDto) {
        return this.ingredientsService.create(dto);
    }

    @Patch(':id')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin', 'contributor')
    @ApiOperation({ summary: 'Update an ingredient' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateIngredientDto,
    ) {
        return this.ingredientsService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @ApiOperation({ summary: 'Delete an ingredient' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.ingredientsService.remove(id);
    }
}
