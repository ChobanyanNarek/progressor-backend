import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { Order } from '../../constants/order.ts';
import { PageOptionsDto } from './page-options.dto.ts';

describe('PageOptionsDto', () => {
  it('applies the documented defaults when params are omitted', () => {
    const dto = plainToInstance(PageOptionsDto, {});

    expect(dto.page).toBe(1);
    expect(dto.take).toBe(10);
    expect(dto.order).toBe(Order.ASC);
    expect(dto.skip).toBe(0);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('keeps client-supplied values and derives skip', () => {
    const dto = plainToInstance(PageOptionsDto, {
      page: 3,
      take: 25,
      order: Order.DESC,
    });

    expect(dto.page).toBe(3);
    expect(dto.take).toBe(25);
    expect(dto.order).toBe(Order.DESC);
    expect(dto.skip).toBe(50);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects take above the max bound', () => {
    const errors = validateSync(
      plainToInstance(PageOptionsDto, { take: 100_000 }),
    );

    expect(errors.some((error) => error.property === 'take')).toBe(true);
  });

  it('rejects page below the min bound', () => {
    const errors = validateSync(plainToInstance(PageOptionsDto, { page: 0 }));

    expect(errors.some((error) => error.property === 'page')).toBe(true);
  });
});
