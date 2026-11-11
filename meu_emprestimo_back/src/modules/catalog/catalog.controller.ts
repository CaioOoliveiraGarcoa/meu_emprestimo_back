import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, ContextInterceptor } from '../auth/auth.guard';
import { CatalogService } from './catalog.service';
import { CatalogQueryDto, EquipmentPageDto, querySchema } from './catalog.dto';
import { ApiPageQuery, ApiProblems } from '../../common/contract';
@Controller('equipamentos')
@ApiTags('equipamentos')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@UseInterceptors(ContextInterceptor)
export class CatalogController {
  constructor(private readonly service: CatalogService) {}
  @Get()
  @ApiOperation({ operationId: 'listEquipamentos' })
  @ApiOkResponse({ type: EquipmentPageDto })
  @ApiPageQuery(querySchema)
  @ApiProblems(400, 401, 403, 429, 500)
  list(@Query() query: CatalogQueryDto) { return this.service.list(query.limit, query.cursor); }
}
