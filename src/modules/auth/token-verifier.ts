import { Inject, Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { CONFIG, Config } from '../../config';
import { Problem } from '../../common/problem';
const claimsSchema = z.object({
  sub: z.string().uuid(), iss: z.string(), aud: z.union([z.string(), z.array(z.string())]),
  exp: z.number().finite(), nbf: z.number().finite().optional(),
  app_metadata: z.object({ tenant_id: z.string().min(1).max(100) }),
});
@Injectable()
export class TokenVerifier {
  private readonly client: SupabaseClient;
  constructor(@Inject(CONFIG) private readonly config: Config) {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  async verify(token: string): Promise<{ userId: string; tenantId: string }> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error();
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) as { alg: string };
      if (!['ES256', 'RS256'].includes(header.alg)) throw new Error();
      const { data, error } = await this.client.auth.getClaims(token);
      if (error || !data) throw new Error();
      const claims = claimsSchema.parse(data.claims);
      const now = Date.now() / 1000;
      const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      if (claims.iss !== `${this.config.SUPABASE_URL.replace(/\/$/, '')}/auth/v1` ||
          !audience.includes('authenticated') || claims.exp <= now || (claims.nbf !== undefined && claims.nbf > now)) throw new Error();
      return { userId: claims.sub, tenantId: claims.app_metadata.tenant_id };
    } catch {
      throw new Problem(401, 'INVALID_TOKEN', 'Sessão inválida ou expirada. Entre novamente.');
    }
  }
}
