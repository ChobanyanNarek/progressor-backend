import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { AdminAiJobDto } from '../../dtos/admin-ai-job.dto.ts';
import { GetAdminAiJobsHandler } from './get-admin-ai-jobs.handler.ts';
import { GetAdminAiJobsQuery } from './get-admin-ai-jobs.query.ts';

interface IQb {
  innerJoinAndSelect: jest.Mock;
  leftJoinAndSelect: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  paginate: jest.Mock;
}

const GEN_ID = '0190f8e2-0000-4000-8000-000000000001' as Uuid;
const MEMORY_POINT_ID = '0190f8e2-0000-4000-8000-000000000002' as Uuid;
const createdAt = new Date('2024-01-01T00:00:00.000Z');
const updatedAt = new Date('2024-01-02T00:00:00.000Z');

function makeQb(items: unknown, meta: unknown): IQb {
  const qb: Partial<IQb> = {};
  qb.innerJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.paginate = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue([items, meta]);

  return qb as IQb;
}

describe('GetAdminAiJobsHandler', () => {
  let handler: GetAdminAiJobsHandler;
  let qb: IQb;
  let createQueryBuilder: jest.Mock;

  const meta = { meta: true };

  function buildHandler(items: unknown): void {
    qb = makeQb(items, meta);
    createQueryBuilder = jest.fn().mockReturnValue(qb);
    handler = new GetAdminAiJobsHandler({ createQueryBuilder } as never);
  }

  beforeEach(() => {
    buildHandler([
      {
        id: GEN_ID,
        memoryPointId: MEMORY_POINT_ID,
        status: AiGenerationStatus.COMPLETED,
        didTalkId: 'talk-1',
        resultVideoUrl: 'https://cdn/video.mp4',
        errorMessage: undefined,
        durationSeconds: 12.5,
        attemptNumber: 2,
        createdAt,
        updatedAt,
        memoryPoint: { memoryPointDetails: { title: 'A title' } },
      },
    ]);
  });

  it('joins memoryPoint -> details, paginates, and maps to AdminAiJobDto', async () => {
    const pageOptionsDto = { order: 'DESC' } as never;

    const result = await handler.execute(
      new GetAdminAiJobsQuery(pageOptionsDto),
    );

    expect(createQueryBuilder).toHaveBeenCalledWith('gen');
    expect(qb.innerJoinAndSelect).toHaveBeenCalledWith(
      'gen.memoryPoint',
      'memoryPoint',
    );
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'memoryPoint.memoryPointDetails',
      'details',
    );
    expect(qb.paginate).toHaveBeenCalledWith(pageOptionsDto);
    expect(result.meta).toBe(meta);
    expect(result.data[0]).toBeInstanceOf(AdminAiJobDto);
    expect(result.data[0]).toEqual({
      id: GEN_ID,
      memoryPointId: MEMORY_POINT_ID,
      memoryPointTitle: 'A title',
      status: AiGenerationStatus.COMPLETED,
      didTalkId: 'talk-1',
      resultVideoUrl: 'https://cdn/video.mp4',
      durationSeconds: 12.5,
      attemptNumber: 2,
      createdAt,
      updatedAt,
    });
  });

  it('orders by gen.createdAt using the requested page order', async () => {
    await handler.execute(new GetAdminAiJobsQuery({ order: 'ASC' } as never));

    expect(qb.orderBy).toHaveBeenCalledWith('gen.createdAt', 'ASC');
  });

  it('does NOT apply the status filter when status is not set', async () => {
    await handler.execute(new GetAdminAiJobsQuery({ order: 'DESC' } as never));

    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('applies the gen.status filter when status is set', async () => {
    const pageOptionsDto = {
      order: 'DESC',
      status: AiGenerationStatus.FAILED,
    } as never;

    await handler.execute(new GetAdminAiJobsQuery(pageOptionsDto));

    expect(qb.andWhere).toHaveBeenCalledTimes(1);
    expect(qb.andWhere).toHaveBeenCalledWith('gen.status = :status', {
      status: AiGenerationStatus.FAILED,
    });
  });

  it('maps memoryPointTitle to null when details/title are absent', async () => {
    buildHandler([
      {
        id: GEN_ID,
        memoryPointId: MEMORY_POINT_ID,
        status: AiGenerationStatus.PENDING,
        attemptNumber: 1,
        createdAt,
        updatedAt,
        memoryPoint: { memoryPointDetails: undefined },
      },
    ]);

    const result = await handler.execute(
      new GetAdminAiJobsQuery({ order: 'DESC' } as never),
    );

    expect(result.data[0]?.memoryPointTitle).toBeNull();
  });
});
