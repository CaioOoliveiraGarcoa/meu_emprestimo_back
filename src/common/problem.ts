import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ZodError } from 'zod';
import type { Response, Request } from 'express';
import * as Sentry from '@sentry/node';
import pino from 'pino';
const logger = pino({ level: process.env.NODE_ENV === 'test' ? 'silent' : 'info' });
export class Problem extends HttpException {
  constructor(status: number, code: string, detail: string) {
    super({ type: `urn:emprest-ai:problem:${code}`, title: code, status, detail, code }, status);
  }
}
@Catch()
export class ProblemFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = error instanceof ZodError ? 400 : error instanceof HttpException ? error.getStatus() : 500;
    const original = error instanceof HttpException ? error.getResponse() : null;
    const data = original && typeof original === 'object' && 'code' in original ? original : {
      type: 'about:blank', title: status === 500 ? 'Erro interno' : 'Requisição inválida', status,
      detail: status === 500 ? 'Não foi possível concluir. Tente novamente.' : 'Confira os dados enviados.',
      code: status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST',
    };
    if (status === 500) {
      // Não registrar error.message: erros do driver podem conter parâmetros e URLs.
      logger.error({ request_id: response.getHeader('x-request-id'), event: 'request_failed', tenant_id: (request as Request & { identity?: { tenantId: string } }).identity?.tenantId, path: request.path });
      if (process.env.SENTRY_DSN) Sentry.captureMessage('API request failed', { level: 'error', extra: { path: request.path } });
    }
    response.status(status).type('application/problem+json').json({ ...data, instance: request.path });
  }
}
