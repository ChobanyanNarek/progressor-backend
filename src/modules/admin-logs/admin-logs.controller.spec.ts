import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PageDto } from '../../common/dto/page.dto.ts';
import { LogLevel } from '../../constants/log-level.ts';
import { LogSource } from '../../constants/log-source.ts';
import { AdminLogEntryEntity } from './admin-log-entry.entity.ts';
import { AdminLogsController } from './admin-logs.controller.ts';
import type { AdminLogsService } from './admin-logs.service.ts';
import { AdminLogEntryDto } from './dtos/admin-log-entry.dto.ts';
import type { AdminLogOptionsDto } from './dtos/admin-log-options.dto.ts';

describe('AdminLogsController', () => {
  let controller: AdminLogsController;
  let getLogs: jest.Mock<() => Promise<unknown>>;
  let page: PageDto<AdminLogEntryDto>;

  beforeEach(() => {
    const meta = { itemCount: 1 } as never;
    const entity = Object.assign(new AdminLogEntryEntity(), {
      id: '11111111-1111-4111-8111-111111111111' as Uuid,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      timestamp: new Date('2026-01-03T00:00:00.000Z'),
      level: LogLevel.INFO,
      source: LogSource.API,
      message: 'request handled',
      context: { route: '/admin/logs' },
    });
    page = PageDto.create({
      data: [entity.toDto()],
      meta,
    });
    getLogs = jest.fn<() => Promise<unknown>>().mockResolvedValue(page);

    controller = new AdminLogsController({
      getLogs,
    } as unknown as AdminLogsService);
  });

  it('returns the logs page from the service', async () => {
    const result = await controller.getLogs({} as AdminLogOptionsDto);

    expect(getLogs).toHaveBeenCalledTimes(1);
    expect(result).toBe(page);
    expect(result.data[0]).toBeInstanceOf(AdminLogEntryDto);
    expect(result.data[0]!.source).toBe(LogSource.API);
    expect(result.data[0]!.context).toEqual({ route: '/admin/logs' });
  });

  it('passes the options dto straight through to the service', async () => {
    const options = {
      level: LogLevel.ERROR,
      source: LogSource.DID,
    } as AdminLogOptionsDto;

    await controller.getLogs(options);

    expect(getLogs).toHaveBeenCalledWith(options);
  });
});
