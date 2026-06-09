import { describe, expect, it } from '@jest/globals';

import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import type { MemoryPointEntity } from '../entities/memory-point.entity.ts';
import { CreatorSummaryDto } from './creator-summary.dto.ts';
import { MemoryPointDto } from './memory-point.dto.ts';

const baseEntity = {
  id: '0190f8e2-0000-4000-8000-000000000000' as Uuid,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
  location: { type: 'Point' as const, coordinates: [44.5, 40.1] },
  status: MemoryPointStatus.ADMIN_REVIEWING,
  userId: '0190f8e2-1111-4000-8000-000000000000' as Uuid,
  memoryPointDetails: undefined,
};

describe('MemoryPointDto creator embed', () => {
  it('embeds a CreatorSummaryDto when the user relation is loaded', () => {
    const userRelation = {
      id: '0190f8e2-1111-4000-8000-000000000000' as Uuid,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      avatar: null,
    };
    const entity = {
      ...baseEntity,
      user: userRelation,
    } as unknown as MemoryPointEntity;

    const dto = new MemoryPointDto(entity);

    expect(dto.creator).toBeInstanceOf(CreatorSummaryDto);
    expect(dto.creator).toEqual(
      CreatorSummaryDto.create({
        id: userRelation.id,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        avatar: null,
      }),
    );
  });

  it('leaves creator undefined when the user relation is not loaded', () => {
    const entity = {
      ...baseEntity,
      user: undefined,
    } as unknown as MemoryPointEntity;

    const dto = new MemoryPointDto(entity);

    expect(dto.creator).toBeUndefined();
  });
});
