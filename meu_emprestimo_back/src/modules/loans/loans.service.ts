import { Injectable } from '@nestjs/common';
import { LoansRepository } from './loans.repository';
import { RequestContext } from '../../common/context';
@Injectable()
export class LoansService {
  constructor(private readonly repository: LoansRepository, private readonly context: RequestContext) {}
  request(id: string) { return this.repository.request(this.context.identity, id); }
  async list(limit: number, cursor?: string) {
    const result = await this.repository.list(this.context.identity, limit, cursor);
    const more = result.length > limit; const items = result.slice(0, limit);
    return { items, nextCursor: more ? items[items.length - 1].id : null };
  }
}
