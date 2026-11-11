import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, ContextInterceptor } from '../auth/auth.guard';
import { LoansService } from './loans.service';
import { LoanDto, LoanPageDto, LoanQueryDto, RequestLoanDto, loanQuerySchema } from './loans.dto';
import { zodToOpenAPI } from 'nestjs-zod';
import { requestLoanSchema } from './loans.dto';
import { ApiPageQuery, ApiProblems } from '../../common/contract';
@Controller('emprestimos')
@ApiTags('emprestimos')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@UseInterceptors(ContextInterceptor)
export class LoansController {
  constructor(private readonly service: LoansService) {}
  @Get()
  @ApiOperation({ operationId: 'listEmprestimos' })
  @ApiOkResponse({ type: LoanPageDto })
  @ApiPageQuery(loanQuerySchema)
  @ApiProblems(400, 401, 403, 429, 500)
  list(@Query() query: LoanQueryDto) { return this.service.list(query.limit, query.cursor); }
  @Post()
  @ApiOperation({ operationId: 'requestEmprestimo' })
  @ApiCreatedResponse({ type: LoanDto })
  @ApiBody({ schema: { ...zodToOpenAPI(requestLoanSchema), additionalProperties: false } })
  @ApiProblems(400, 401, 403, 404, 409, 429, 500)
  request(@Body() body: RequestLoanDto) { return this.service.request(body.equipamentoId); }
}
