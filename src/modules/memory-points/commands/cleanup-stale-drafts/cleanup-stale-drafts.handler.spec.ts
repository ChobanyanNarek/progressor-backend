import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { CleanupStaleDraftsHandler } from './cleanup-stale-drafts.handler.ts';

interface Qb {
  leftJoin: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  getMany: jest.Mock<() => Promise<unknown>>;
}

const TTL_MS = 24 * 60 * 60 * 1000;

function makeQb(drafts: unknown): Qb {
  const qb: Partial<Qb> = {};
  qb.leftJoin = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.getMany = jest.fn<() => Promise<unknown>>().mockResolvedValue(drafts);

  return qb as Qb;
}

describe('CleanupStaleDraftsHandler', () => {
  let handler: CleanupStaleDraftsHandler;
  let qb: Qb;
  let createQueryBuilder: jest.Mock;
  let deleteRows: jest.Mock<(ids: Uuid[]) => Promise<unknown>>;
  let deletePrefix: jest.Mock<(prefix: string) => Promise<void>>;

  const draftA = { id: 'draft-a' as Uuid };
  const draftB = { id: 'draft-b' as Uuid };

  function buildHandler(drafts: unknown): void {
    qb = makeQb(drafts);
    createQueryBuilder = jest.fn().mockReturnValue(qb);
    deleteRows = jest
      .fn<(ids: Uuid[]) => Promise<unknown>>()
      .mockResolvedValue({ affected: 0 });
    handler = new CleanupStaleDraftsHandler(
      { createQueryBuilder, delete: deleteRows } as never,
      { deletePrefix } as never,
      { memoryPointDraftTtl: TTL_MS } as never,
    );
  }

  beforeEach(() => {
    deletePrefix = jest
      .fn<(prefix: string) => Promise<void>>()
      .mockResolvedValue();
  });

  it('selects only detail-less PENDING drafts older than the TTL', async () => {
    buildHandler([]);

    await handler.execute();

    expect(qb.where).toHaveBeenCalledWith('mp.status = :status', {
      status: MemoryPointStatus.PENDING,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('details.id IS NULL');
    expect(qb.andWhere).toHaveBeenCalledWith('mp.createdAt < :threshold', {
      threshold: expect.any(Date),
    });
  });

  it('returns 0 and deletes nothing when there are no stale drafts', async () => {
    buildHandler([]);

    const result = await handler.execute();

    expect(result).toBe(0);
    expect(deletePrefix).not.toHaveBeenCalled();
    expect(deleteRows).not.toHaveBeenCalled();
  });

  it('purges each draft media prefix then deletes the rows', async () => {
    buildHandler([draftA, draftB]);

    const result = await handler.execute();

    expect(deletePrefix).toHaveBeenCalledWith('memory-points/draft-a/');
    expect(deletePrefix).toHaveBeenCalledWith('memory-points/draft-b/');
    expect(deleteRows).toHaveBeenCalledWith([draftA.id, draftB.id]);
    expect(result).toBe(2);
  });

  it('skips DB deletion for a draft whose media purge fails', async () => {
    buildHandler([draftA, draftB]);
    deletePrefix.mockImplementation((prefix: string) =>
      prefix === 'memory-points/draft-a/'
        ? Promise.reject(new Error('gcs down'))
        : Promise.resolve(),
    );

    const result = await handler.execute();

    expect(deleteRows).toHaveBeenCalledWith([draftB.id]);
    expect(result).toBe(1);
  });
});
