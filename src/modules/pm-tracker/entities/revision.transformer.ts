import type { ColumnOptions } from 'typeorm';

/*
 * Revisions are bigint in Postgres, which the driver returns as a string. They stay far
 * below 2^53, so reading them as numbers is exact.
 */
export const revisionColumn: ColumnOptions = {
  type: 'bigint',
  default: 0,
  transformer: {
    to: (value: number | undefined) => value,
    from: (value: string | null) => (value === null ? null : Number(value)),
  },
};
