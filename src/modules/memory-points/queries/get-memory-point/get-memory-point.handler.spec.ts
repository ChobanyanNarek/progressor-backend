import { describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { PublicationState } from '../../../../constants/publication-state.ts';
import { RoleType } from '../../../../constants/role-type.ts';
import type { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { GetMemoryPointHandler } from './get-memory-point.handler.ts';
import { GetMemoryPointQuery } from './get-memory-point.query.ts';

interface IQb {
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  getOne: jest.Mock;
}

function makeQb(getOneResult: unknown): IQb {
  const qb: Partial<IQb> = {};

  for (const m of ['leftJoinAndSelect', 'where', 'andWhere'] as const) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }

  qb.getOne = jest.fn<() => Promise<unknown>>().mockResolvedValue(getOneResult);

  return qb as IQb;
}

/*
 * Mirrors GcsStorageService.getSignedReadUrlOrNull: null/empty in → null out,
 * else a recognizable signed URL so tests can assert paths were actually signed.
 */
function makeGcs(): {
  getSignedReadUrlOrNull: jest.Mock<
    (path: string | null | undefined) => Promise<string | null>
  >;
} {
  return {
    getSignedReadUrlOrNull: jest
      .fn<(path: string | null | undefined) => Promise<string | null>>()
      .mockImplementation((path) =>
        Promise.resolve(path ? `https://signed/${path}` : null),
      ),
  };
}

describe('GetMemoryPointHandler', () => {
  let handler: GetMemoryPointHandler;
  let qb: IQb;
  let createQueryBuilder: jest.Mock;
  let gcs: ReturnType<typeof makeGcs>;

  const memoryPointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;
  const dto = { id: 'point-1' };

  function setup(getOneResult: unknown): void {
    qb = makeQb(getOneResult);
    createQueryBuilder = jest.fn().mockReturnValue(qb);
    gcs = makeGcs();
    handler = new GetMemoryPointHandler(
      { createQueryBuilder } as never,
      gcs as unknown as GcsStorageService,
    );
  }

  function entity(toDtoResult: unknown = dto): { toDto: jest.Mock } {
    return { toDto: jest.fn().mockReturnValue(toDtoResult) };
  }

  it('joins the details and user relations so the creator embed can be built', async () => {
    setup(entity());

    await handler.execute(new GetMemoryPointQuery(memoryPointId));

    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'mp.memoryPointDetails',
      'details',
    );
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('mp.user', 'user');
  });

  it('public read (no userId) adds the APPROVED status filter and ACTIVE publicationState filter', async () => {
    setup(entity());

    await handler.execute(new GetMemoryPointQuery(memoryPointId));

    expect(qb.where).toHaveBeenCalledWith('mp.id = :id', { id: memoryPointId });
    expect(qb.andWhere).toHaveBeenCalledTimes(2);
    expect(qb.andWhere).toHaveBeenCalledWith('mp.status = :status', {
      status: MemoryPointStatus.APPROVED,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('mp.publicationState = :pub', {
      pub: PublicationState.ACTIVE,
    });
  });

  it('CREATOR role with userId adds the ownership filter (and no status/publicationState filter)', async () => {
    setup(entity());

    await handler.execute(
      new GetMemoryPointQuery(memoryPointId, userId, RoleType.CREATOR),
    );

    expect(qb.andWhere).toHaveBeenCalledTimes(1);
    expect(qb.andWhere).toHaveBeenCalledWith('mp.userId = :userId', { userId });

    const statusCall = qb.andWhere.mock.calls.find(
      (c) => c[0] === 'mp.status = :status',
    );
    expect(statusCall).toBeUndefined();
  });

  it('ADMIN role with userId adds NEITHER an ownership NOR a status/publicationState filter', async () => {
    setup(entity());

    await handler.execute(
      new GetMemoryPointQuery(memoryPointId, userId, RoleType.ADMIN),
    );

    // Admin sees everything: only the id where clause, no andWhere constraints.
    expect(qb.andWhere).not.toHaveBeenCalled();

    const ownershipCall = qb.andWhere.mock.calls.find(
      (c) => c[0] === 'mp.userId = :userId',
    );
    const statusCall = qb.andWhere.mock.calls.find(
      (c) => c[0] === 'mp.status = :status',
    );
    expect(ownershipCall).toBeUndefined();
    expect(statusCall).toBeUndefined();
  });

  it('throws MemoryPointNotFoundException when getOne returns null', async () => {
    setup(null);

    await expect(
      handler.execute(new GetMemoryPointQuery(memoryPointId)),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });

  it('returns entity.toDto() on the happy path', async () => {
    const ent = entity();
    setup(ent);

    const result = await handler.execute(
      new GetMemoryPointQuery(memoryPointId),
    );

    expect(ent.toDto).toHaveBeenCalledTimes(1);
    expect(result).toBe(dto);
  });

  it('ADMIN read exposes the source URLs to the DTO', async () => {
    const ent = entity();
    setup(ent);

    await handler.execute(
      new GetMemoryPointQuery(memoryPointId, userId, RoleType.ADMIN),
    );

    expect(ent.toDto).toHaveBeenCalledWith({ includeSourceUrls: true });
  });

  it('CREATOR read does NOT expose the source URLs to the DTO', async () => {
    const ent = entity();
    setup(ent);

    await handler.execute(
      new GetMemoryPointQuery(memoryPointId, userId, RoleType.CREATOR),
    );

    expect(ent.toDto).toHaveBeenCalledWith({ includeSourceUrls: false });
  });

  it('public read (no role) does NOT expose the source URLs to the DTO', async () => {
    const ent = entity();
    setup(ent);

    await handler.execute(new GetMemoryPointQuery(memoryPointId));

    expect(ent.toDto).toHaveBeenCalledWith({ includeSourceUrls: false });
  });

  it('ADMIN read signs the video and both source object paths', async () => {
    const detailsDto = {
      videoUrl: 'generations/p1/g1/result.mp4',
      sourcePhotoUrl: 'memory-points/p1/photo/a.jpg',
      sourceAudioUrl: 'memory-points/p1/audio/a.m4a',
    };
    setup(entity({ memoryPointDetails: detailsDto }));

    const result = await handler.execute(
      new GetMemoryPointQuery(memoryPointId, userId, RoleType.ADMIN),
    );

    const details = result.memoryPointDetails!;
    expect(details.videoUrl).toBe(
      'https://signed/generations/p1/g1/result.mp4',
    );
    expect(details.sourcePhotoUrl).toBe(
      'https://signed/memory-points/p1/photo/a.jpg',
    );
    expect(details.sourceAudioUrl).toBe(
      'https://signed/memory-points/p1/audio/a.m4a',
    );
    expect(gcs.getSignedReadUrlOrNull).toHaveBeenCalledTimes(3);
  });

  it('non-admin read signs only the video URL, never the source paths', async () => {
    const detailsDto: { videoUrl?: string } = {
      videoUrl: 'generations/p1/g1/result.mp4',
    };
    setup(entity({ memoryPointDetails: detailsDto }));

    const result = await handler.execute(
      new GetMemoryPointQuery(memoryPointId, userId, RoleType.CREATOR),
    );

    expect(result.memoryPointDetails!.videoUrl).toBe(
      'https://signed/generations/p1/g1/result.mp4',
    );
    expect(gcs.getSignedReadUrlOrNull).toHaveBeenCalledTimes(1);
  });

  it('leaves a video-less details DTO unsigned (null path → null)', async () => {
    const detailsDto: { videoUrl?: string } = {};
    setup(entity({ memoryPointDetails: detailsDto }));

    const result = await handler.execute(
      new GetMemoryPointQuery(memoryPointId, userId, RoleType.CREATOR),
    );

    expect(result.memoryPointDetails!.videoUrl).toBeUndefined();
  });
});
