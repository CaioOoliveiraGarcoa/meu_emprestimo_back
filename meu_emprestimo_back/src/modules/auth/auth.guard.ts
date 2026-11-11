import { CanActivate, ExecutionContext, Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { AbilityBuilder, createMongoAbility, subject } from '@casl/ability';
import { createHash } from 'node:crypto';
import { AuthRepository } from './auth.repository';
import { TokenVerifier } from './token-verifier';
import { Problem } from '../../common/problem';
import { Identity, RequestContext } from '../../common/context';
export type AuthRequest = Request & { identity: Identity };
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenVerifier, private readonly repository: AuthRepository) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ') || authorization.length > 12000)
      throw new Problem(401, 'AUTH_REQUIRED', 'Entre para acessar o catálogo.');
    const identity = await this.tokens.verify(authorization.slice(7));
    const membership = await this.repository.membership(identity.tenantId, identity.userId);
    if (!membership) throw new Problem(403, 'MEMBERSHIP_REQUIRED', 'Usuário sem acesso a esta área.');
    const builder = new AbilityBuilder(createMongoAbility);
    if (['COLABORADOR', 'OPERACOES'].includes(membership.role))
      builder.can('access', 'Catalog', { tenantId: identity.tenantId });
    if (!builder.build().can('access', subject('Catalog', { tenantId: identity.tenantId })))
      throw new Problem(403, 'ACCESS_DENIED', 'Perfil sem acesso ao catálogo.');
    const ipHash = createHash('sha256').update(request.ip || request.socket.remoteAddress || 'unknown').digest('hex');
    for (const suffix of [`user:${identity.userId}`, `ip:${ipHash}`]) {
      if (!await this.repository.rate(identity.tenantId, `${identity.tenantId}:${suffix}`))
        throw new Problem(429, 'RATE_LIMIT', 'Muitas solicitações. Aguarde um minuto.');
    }
    request.identity = { ...identity, role: membership.role };
    return true;
  }
}
@Injectable()
export class ContextInterceptor implements NestInterceptor {
  constructor(private readonly context: RequestContext) {}
  intercept(execution: ExecutionContext, next: CallHandler): Observable<unknown> {
    const identity = execution.switchToHttp().getRequest<AuthRequest>().identity;
    return new Observable(subscriber => {
      let subscription: ReturnType<Observable<unknown>['subscribe']> | undefined;
      this.context.storage.run(identity, () => { subscription = next.handle().subscribe(subscriber); });
      return () => subscription?.unsubscribe();
    });
  }
}
