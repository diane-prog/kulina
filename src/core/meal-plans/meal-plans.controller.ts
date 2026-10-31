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
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AddMealPlanItemDto } from './dto/add-meal-plan-item.dto';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { QueryMealPlansDto } from './dto/query-meal-plans.dto';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto';
import { MealPlansService } from './meal-plans.service';

@ApiTags('meal-plans')
@ApiBearerAuth('JWT')
@Controller('meal-plans')
export class MealPlansController {
    constructor(private readonly mealPlansService: MealPlansService) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'List my meal plans' })
    findMine(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: QueryMealPlansDto,
    ) {
        return this.mealPlansService.findAll(user.id, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the meal plans module' })
    adminTest() {
        return { status: 'ok', module: 'meal-plans' };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Create a weekly meal plan' })
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateMealPlanDto,
    ) {
        return this.mealPlansService.create(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('generate')
    @ApiOperation({ summary: 'Generate a weekly meal plan automatically' })
    generate(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: GenerateMealPlanDto,
    ) {
        return this.mealPlansService.generate(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Get one meal plan' })
    findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.mealPlansService.findOne(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/budget')
    @ApiOperation({ summary: 'Get the budget summary of a meal plan' })
    budget(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.mealPlansService.getBudgetSummary(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a meal plan' })
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateMealPlanDto,
    ) {
        return this.mealPlansService.update(id, user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a meal plan' })
    remove(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.mealPlansService.remove(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/items')
    @ApiOperation({ summary: 'Add a recipe to a meal plan' })
    addItem(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AddMealPlanItemDto,
    ) {
        return this.mealPlansService.addItem(id, user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/items/:itemId')
    @ApiOperation({ summary: 'Remove a recipe from a meal plan' })
    removeItem(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Param('itemId', ParseUUIDPipe) itemId: string,
    ) {
        return this.mealPlansService.removeItem(id, itemId, user.id);
    }
}
