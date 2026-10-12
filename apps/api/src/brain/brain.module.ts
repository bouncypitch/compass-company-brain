import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BrainController } from './brain.controller';
import { BrainService } from './brain.service';
import { HydraService } from './hydra.service';
import { LlmService } from './llm.service';

@Module({
  imports: [PrismaModule, OrganizationsModule],
  controllers: [BrainController],
  providers: [BrainService, HydraService, LlmService],
})
export class BrainModule {}
