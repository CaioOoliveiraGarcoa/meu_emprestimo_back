import { createApp } from '../src/bootstrap';
import type { Request, Response } from 'express';
let cached: ReturnType<typeof createApp> | undefined;
export default async function handler(req: Request, res: Response) {
  cached ??= createApp().catch(error => { cached = undefined; throw error; });
  const app = await cached;
  return app.getHttpAdapter().getInstance()(req, res);
}
