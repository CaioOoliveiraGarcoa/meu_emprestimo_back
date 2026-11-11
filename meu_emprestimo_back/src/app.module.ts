import { Module } from '@nestjs/common';
import { CONFIG, readConfig } from './config';
import { AppController } from './app.controller';
import { PrismaService } from './common/prisma.service';
import { RequestContext } from './common/context';
import { AuthRepository } from './modules/auth/auth.repository';
import { AuthGuard, ContextInterceptor } from './modules/auth/auth.guard';
import { TokenVerifier } from './modules/auth/token-verifier';
import { CatalogController } from './modules/catalog/catalog.controller';
import { CatalogService } from './modules/catalog/catalog.service';
import { CatalogRepository } from './modules/catalog/catalog.repository';
import { LoansController } from './modules/loans/loans.controller';
import { LoansService } from './modules/loans/loans.service';
import { LoansRepository } from './modules/loans/loans.repository';
@Module({ controllers: [AppController, CatalogController, LoansController], providers: [
  { provide: CONFIG, useFactory: readConfig }, PrismaService, RequestContext,
  AuthRepository, AuthGuard, ContextInterceptor, TokenVerifier, CatalogService,
  CatalogRepository, LoansService, LoansRepository,
] })
export class AppModule {}
