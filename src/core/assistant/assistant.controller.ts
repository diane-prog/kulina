import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AssistantService } from './assistant.service';
import { SuggestRecipesDto } from './dto/suggest-recipes.dto';

@ApiTags('assistant')
@Controller('assistant')
export class AssistantController {
    constructor(private readonly assistantService: AssistantService) {}

    @Public()
    @Post('suggest')
    @ApiOperation({
        summary: 'Get recipe suggestions and beginner guidance',
    })
    suggest(@Body() dto: SuggestRecipesDto) {
        return this.assistantService.suggest(dto);
    }

    @Public()
    @Get('guide/:recipeId')
    @ApiOperation({ summary: 'Get a beginner-friendly recipe guide' })
    guide(@Param('recipeId', ParseUUIDPipe) recipeId: string) {
        return this.assistantService.guide(recipeId);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the assistant module' })
    adminTest() {
        return { status: 'ok', module: 'assistant' };
    }
}
