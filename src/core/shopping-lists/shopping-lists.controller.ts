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
import { AddShoppingListItemDto } from './dto/add-shopping-list-item.dto';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { GenerateShoppingListDto } from './dto/generate-shopping-list.dto';
import { QueryShoppingListsDto } from './dto/query-shopping-lists.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { ShoppingListsService } from './shopping-lists.service';

@ApiTags('shopping-lists')
@ApiBearerAuth('JWT')
@Controller('shopping-lists')
export class ShoppingListsController {
    constructor(private readonly shoppingListsService: ShoppingListsService) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'List my shopping lists' })
    findMine(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: QueryShoppingListsDto,
    ) {
        return this.shoppingListsService.findAll(user.id, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the shopping lists module' })
    adminTest() {
        return { status: 'ok', module: 'shopping-lists' };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Create a shopping list' })
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateShoppingListDto,
    ) {
        return this.shoppingListsService.create(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('generate')
    @ApiOperation({ summary: 'Generate a shopping list from a meal plan' })
    generate(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: GenerateShoppingListDto,
    ) {
        return this.shoppingListsService.generate(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Get one shopping list' })
    findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.shoppingListsService.findOne(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a shopping list' })
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateShoppingListDto,
    ) {
        return this.shoppingListsService.update(id, user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a shopping list' })
    remove(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.shoppingListsService.remove(id, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/items')
    @ApiOperation({ summary: 'Add an ingredient to a shopping list' })
    addItem(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AddShoppingListItemDto,
    ) {
        return this.shoppingListsService.addItem(id, user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/items/:itemId')
    @ApiOperation({ summary: 'Remove an ingredient from a shopping list' })
    removeItem(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Param('itemId', ParseUUIDPipe) itemId: string,
    ) {
        return this.shoppingListsService.removeItem(id, itemId, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/items/:itemId/toggle')
    @ApiOperation({ summary: 'Check or uncheck an ingredient' })
    toggleItem(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Param('itemId', ParseUUIDPipe) itemId: string,
    ) {
        return this.shoppingListsService.toggleItem(id, itemId, user.id);
    }
}
