import { Controller, Get } from '@nestjs/common';
import type { HealthCheckResult } from '@nestjs/terminus';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthCheckerController {
  constructor(
    private healthCheckService: HealthCheckService,
    // biome-ignore lint/correctness/noUnusedPrivateClassMembers: kept for future DB health checks
    private ormIndicator: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    // Lightweight check — skip DB ping so the health endpoint responds
    // immediately after NestJS boots (DB ping adds latency on cold start).
    return this.healthCheckService.check([]);
  }
}
