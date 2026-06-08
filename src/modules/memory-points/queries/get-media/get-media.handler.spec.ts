import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import type { PageOptionsDto } from '../../../../common/dto/page-options.dto.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../../../constants/memory-point-type.ts';
import { GetMediaHandler } from './get-media.handler.ts';
import { GetMediaQuery } from './get-media.query.ts';

describe('GetMediaHandler', () => {
  const meta = { itemCount: 1 };
  const detailsRow = {
    id: 'd1',
    memoryPointId: 'mp1',
    title: 'Grandpa',
    type: MemoryPointType.GRAVE,
    sourcePhotoUrl: 'memory-points/mp1/photo/x.jpg',
    sourceAudioUrl: 'memory-points/mp1/audio/x.mp3',
    videoUrl: null,
    createdAt: new Date('2026-01-05T00:00:00.000Z'),
    memoryPoint: { status: MemoryPointStatus.APPROVED },
  };

  let handler: GetMediaHandler;
  let andWhere: jest.Mock;
  let paginate: jest.Mock<() => Promise<unknown>>;

  beforeEach(() => {
    const qb: Record<string, unknown> = {};
    qb.innerJoinAndSelect = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    andWhere = jest.fn().mockReturnValue(qb);
    qb.andWhere = andWhere;
    paginate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([[detailsRow], meta]);
    qb.paginate = paginate;

    handler = new GetMediaHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  });

  it('projects details + point status into media items', async () => {
    const result = await handler.execute(
      new GetMediaQuery({ order: 'ASC' } as PageOptionsDto),
    );

    expect(result).toBeInstanceOf(PageDto);
    expect(andWhere).not.toHaveBeenCalled();
    const item = result.data[0]!;
    expect(item.memoryPointId).toBe('mp1');
    expect(item.status).toBe(MemoryPointStatus.APPROVED);
    expect(item.photoUrl).toBe('memory-points/mp1/photo/x.jpg');
    expect(item.videoUrl).toBeNull();
  });

  it('filters by title when q is present', async () => {
    await handler.execute(
      new GetMediaQuery({ order: 'ASC', q: 'grand' } as PageOptionsDto),
    );

    expect(andWhere).toHaveBeenCalledWith('details.title ILIKE :q', {
      q: '%grand%',
    });
  });
});
