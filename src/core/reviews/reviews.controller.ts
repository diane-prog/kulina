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
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'List reviews for a recipe' })
    findByRecipe(
        @Query('recipeId', ParseUUIDPipe) recipeId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.reviewsService.findByRecipe(
            recipeId,
            page ? Number.parseInt(page, 10) : 1,
            limit ? Number.parseInt(limit, 10) : 10,
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'List my reviews' })
    findMine(@CurrentUser() user: AuthenticatedUser) {
        return this.reviewsService.findByUser(user.id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the reviews module' })
    adminTest() {
        return { status: 'ok', module: 'reviews' };
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Review a recipe' })
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateReviewDto,
    ) {
        return this.reviewsService.create(user.id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Update your review' })
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateReviewDto,
    ) {
        return this.reviewsService.update(id, user.id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete your review' })
    remove(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const isAdmin = ['super_admin', 'admin'].includes(
            user.role?.label?.toLowerCase(),
        );

        return this.reviewsService.remove(id, user.id, isAdmin);
    }
}
