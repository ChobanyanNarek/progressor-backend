import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PageDto } from '../../common/dto/page.dto.ts';
import type { PageOptionsDto } from '../../common/dto/page-options.dto.ts';
import { MemoryPointStatus } from '../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../constants/memory-point-type.ts';
import { MediaItemDto } from '../memory-points/dtos/media-item.dto.ts';
import type { MemoryPointService } from '../memory-points/memory-point.service.ts';
import { AdminMediaController } from './admin-media.controller.ts';

describe('AdminMediaController', () => {
  let controller: AdminMediaController;
  let getMedia: jest.Mock<() => Promise<unknown>>;
  let page: PageDto<MediaItemDto>;

  beforeEach(() => {
    const meta = { itemCount: 1 } as never;
    page = PageDto.create({
      data: [
        MediaItemDto.create({
          id: '11111111-1111-4111-8111-111111111111' as Uuid,
          memoryPointId: '22222222-2222-4222-8222-222222222222' as Uuid,
          title: 'Grandpa',
          type: MemoryPointType.GRAVE,
          status: MemoryPointStatus.APPROVED,
          photoUrl: 'memory-points/mp1/photo/x.jpg',
          audioUrl: 'memory-points/mp1/audio/x.mp3',
          videoUrl: null,
          createdAt: new Date('2026-01-05T00:00:00.000Z'),
        }),
      ],
      meta,
    });
    getMedia = jest.fn<() => Promise<unknown>>().mockResolvedValue(page);

    controller = new AdminMediaController({
      getMedia,
    } as unknown as MemoryPointService);
  });

  it('returns the media page from the service', async () => {
    const result = await controller.getAll({} as PageOptionsDto);

    expect(getMedia).toHaveBeenCalledTimes(1);
    expect(result).toBe(page);
    expect(result.data[0]).toBeInstanceOf(MediaItemDto);
    expect(result.data[0]!.memoryPointId).toBe(
      '22222222-2222-4222-8222-222222222222',
    );
    expect(result.data[0]!.videoUrl).toBeNull();
  });
});
