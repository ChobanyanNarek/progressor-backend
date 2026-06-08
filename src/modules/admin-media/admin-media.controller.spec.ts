import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PageDto } from '../../common/dto/page.dto.ts';
import type { PageOptionsDto } from '../../common/dto/page-options.dto.ts';
import { MemoryPointStatus } from '../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../constants/memory-point-type.ts';
import type { MemoryPointService } from '../memory-points/memory-point.service.ts';
import { AdminMediaController } from './admin-media.controller.ts';
import { MediaItemDto } from './dtos/media-item.dto.ts';

describe('AdminMediaController', () => {
  let controller: AdminMediaController;
  let getMedia: jest.Mock<() => Promise<unknown>>;

  beforeEach(() => {
    const meta = { itemCount: 1 } as never;
    getMedia = jest.fn<() => Promise<unknown>>().mockResolvedValue(
      PageDto.create({
        data: [
          {
            id: '11111111-1111-4111-8111-111111111111' as Uuid,
            memoryPointId: '22222222-2222-4222-8222-222222222222' as Uuid,
            title: 'Grandpa',
            type: MemoryPointType.GRAVE,
            status: MemoryPointStatus.APPROVED,
            photoUrl: 'memory-points/mp1/photo/x.jpg',
            audioUrl: 'memory-points/mp1/audio/x.mp3',
            videoUrl: null,
            createdAt: new Date('2026-01-05T00:00:00.000Z'),
          },
        ],
        meta,
      }),
    );

    controller = new AdminMediaController({
      getMedia,
    } as unknown as MemoryPointService);
  });

  it('maps the projection page to MediaItemDto', async () => {
    const result = await controller.getAll({} as PageOptionsDto);

    expect(getMedia).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(PageDto);
    expect(result.data[0]).toBeInstanceOf(MediaItemDto);
    expect(result.data[0]!.memoryPointId).toBe(
      '22222222-2222-4222-8222-222222222222',
    );
    expect(result.data[0]!.videoUrl).toBeNull();
  });
});
