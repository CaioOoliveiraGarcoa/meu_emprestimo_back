import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return { message: 'Hello World' };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'EMPREST.AI-Back',
      timestamp: new Date().toISOString(),
    };
  }
}
