import { AppController } from './app.controller';
it('CA-E01: health não divulga configuração ou credenciais', () => {
  expect(new AppController().health()).toEqual({ status: 'ok', service: 'emprest-ai' });
});
