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
import { CommunityService } from './community.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('community')
@Controller('community')
export class CommunityController {
    constructor(private readonly communityService: CommunityService) {}

    @Public()
    @Get('posts')
    @ApiOperation({ summary: 'List community posts' })
    findAll(@Query() query: QueryPostsDto) {
        return this.communityService.findAll(query);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the community module' })
    adminTest() {
        return { status: 'ok', module: 'community' };
    }

    @Public()
    @Get('posts/:id')
    @ApiOperation({ summary: 'Get a community post' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.communityService.findOne(id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Post('posts')
    @ApiOperation({ summary: 'Create a community post' })
    createPost(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreatePostDto,
    ) {
        return this.communityService.createPost(user.id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Patch('posts/:id')
    @ApiOperation({ summary: 'Update your post' })
    updatePost(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePostDto,
    ) {
        return this.communityService.updatePost(
            id,
            user.id,
            this.isAdminUser(user),
            dto,
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Delete('posts/:id')
    @ApiOperation({ summary: 'Delete your post' })
    removePost(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.communityService.removePost(
            id,
            user.id,
            this.isAdminUser(user),
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Post('posts/:id/like')
    @ApiOperation({ summary: 'Like a post' })
    likePost(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.communityService.likePost(id, user.id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Delete('posts/:id/like')
    @ApiOperation({ summary: 'Unlike a post' })
    unlikePost(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.communityService.unlikePost(id, user.id);
    }

    @Public()
    @Get('posts/:id/comments')
    @ApiOperation({ summary: 'List comments for a post' })
    listComments(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.communityService.listComments(
            id,
            page ? Number.parseInt(page, 10) : 1,
            limit ? Number.parseInt(limit, 10) : 20,
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Post('posts/:id/comments')
    @ApiOperation({ summary: 'Comment on a post' })
    addComment(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateCommentDto,
    ) {
        return this.communityService.addComment(id, user.id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Patch('comments/:id')
    @ApiOperation({ summary: 'Update your comment' })
    updateComment(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCommentDto,
    ) {
        return this.communityService.updateComment(id, user.id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Delete('comments/:id')
    @ApiOperation({ summary: 'Delete your comment' })
    removeComment(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.communityService.removeComment(
            id,
            user.id,
            this.isAdminUser(user),
        );
    }

    /**
     * Checks whether the current user can moderate any community content.
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
