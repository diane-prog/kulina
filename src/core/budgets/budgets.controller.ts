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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { QueryBudgetsDto } from './dto/query-budgets.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@ApiTags('budgets')
@ApiBearerAuth('JWT')
@Controller('budgets')
export class BudgetsController {
    constructor(private readonly budgetsService: BudgetsService) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'List my budgets' })
    findMine(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: QueryBudgetsDto,
    ) {
        return this.budgetsService.findAll(user.id, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/summary')
    @ApiOperation({ summary: 'Get my budget summary' })
    summary(@CurrentUser() user: AuthenticatedUser) {
        return this.budgetsService.getSummary(user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the budgets module' })
    adminTest() {
        return { status: 'ok', module: 'budgets' };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Create a food budget' })
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateBudgetDto,
    ) {
        return this.budgetsService.create(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Get one budget' })
    findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.budgetsService.findOne(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a budget' })
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateBudgetDto,
    ) {
        return this.budgetsService.update(id, user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a budget' })
    remove(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.budgetsService.remove(id, user.id);
    }
}
