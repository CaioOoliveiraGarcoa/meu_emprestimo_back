import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
export interface Identity { userId: string; tenantId: string; role: string }
@Injectable()
export class RequestContext {
  readonly storage = new AsyncLocalStorage<Identity>();
  get identity(): Identity {
    const identity = this.storage.getStore();
    if (!identity) throw new Error('Contexto autenticado ausente.');
    return identity;
  }
}
