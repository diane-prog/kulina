import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Public()
    @Get()
    @ApiOperation({
        summary: 'Search recipes, tutorials, ingredients, and posts',
    })
    search(@Query() dto: SearchQueryDto) {
        return this.searchService.search(dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the search module' })
    adminTest() {
        return { status: 'ok', module: 'search' };
    }
}
