import type { ReportClientErrorDto } from '../../dtos/report-client-error.dto.ts';

export class ReportClientErrorCommand {
  constructor(
    public readonly userId: Uuid,
    public readonly report: ReportClientErrorDto,
    public readonly userAgent: string | undefined,
  ) {}
}
