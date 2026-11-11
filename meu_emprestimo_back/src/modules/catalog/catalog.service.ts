import { Injectable } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository';
import { RequestContext } from '../../common/context';
@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository, private readonly context: RequestContext) {}
  async list(limit: number, cursor?: string) {
    const result = await this.repository.list(this.context.identity.tenantId, limit, cursor);
    const more = result.length > limit; const items = result.slice(0, limit);
    return { items, nextCursor: more ? items[items.length - 1].patrimonio : null };
  }
}
