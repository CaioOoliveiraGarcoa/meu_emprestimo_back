import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return { message: "Hello World" }', () => {
      const response = appController.getRoot();
      expect(response).toEqual({ message: 'Hello World' });
    });
  });

  describe('health check', () => {
    it('should return status ok and service name', () => {
      const response = appController.getHealth();
      expect(response.status).toBe('ok');
      expect(response.service).toBe('EMPREST.AI-Back');
      expect(response.timestamp).toBeDefined();
    });
  });
});
