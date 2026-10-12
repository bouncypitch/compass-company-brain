import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AcceptRecommendationResult,
  BrainPerson,
  CompassResult,
  RadarResult,
  TimeMachineResult,
  TokenPayload,
} from '@app-starter/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/email-verified.guard';
import { BrainService } from './brain.service';

/** Company brain routes, scoped to an organization like every other vertical. */
@ApiTags('brain')
@Controller('organizations/:organizationId/brain')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class BrainController {
  constructor(private readonly brainService: BrainService) {}

  @Get('radar')
  @ApiOperation({ summary: 'Latest cached competitor radar' })
  getRadar(@Request() req: { user: TokenPayload }, @Param('organizationId') organizationId: string): Promise<RadarResult | null> {
    return this.brainService.getRadar(req.user.sub, organizationId);
  }

  @Post('radar/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-run the competitor radar through HydraDB and Claude' })
  runRadar(@Request() req: { user: TokenPayload }, @Param('organizationId') organizationId: string): Promise<RadarResult> {
    return this.brainService.runRadar(req.user.sub, organizationId);
  }

  @Post('radar/time-machine')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Predict from pre-cutoff signals only, then reveal what happened' })
  timeMachine(@Request() req: { user: TokenPayload }, @Param('organizationId') organizationId: string): Promise<TimeMachineResult> {
    return this.brainService.runTimeMachine(req.user.sub, organizationId);
  }

  @Post('recommendations/:gapId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a recommendation: write it back to the brain and draft the code change' })
  accept(
    @Request() req: { user: TokenPayload },
    @Param('organizationId') organizationId: string,
    @Param('gapId') gapId: string,
  ): Promise<AcceptRecommendationResult> {
    return this.brainService.acceptRecommendation(req.user.sub, organizationId, gapId);
  }

  @Get('priorities/:priorityId/status')
  @ApiOperation({ summary: 'HydraDB indexing status of an accepted priority' })
  priorityStatus(
    @Request() req: { user: TokenPayload },
    @Param('organizationId') organizationId: string,
    @Param('priorityId') priorityId: string,
  ): Promise<{ id: string; status: string }> {
    return this.brainService.priorityStatus(req.user.sub, organizationId, priorityId);
  }

  @Get('people')
  @ApiOperation({ summary: 'Forgeline employees the compass can coach' })
  people(@Request() req: { user: TokenPayload }, @Param('organizationId') organizationId: string): Promise<BrainPerson[]> {
    return this.brainService.listPeople(req.user.sub, organizationId);
  }

  @Post('compass/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Promotion plan for one employee (cached unless refresh=true)' })
  compass(
    @Request() req: { user: TokenPayload },
    @Param('organizationId') organizationId: string,
    @Param('employeeId') employeeId: string,
    @Query('refresh') refresh?: string,
  ): Promise<CompassResult> {
    return this.brainService.getCompass(req.user.sub, organizationId, employeeId, refresh === 'true');
  }
}
