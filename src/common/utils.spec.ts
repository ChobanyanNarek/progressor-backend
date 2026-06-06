import { parseCorsOrigins } from './utils.ts';

describe('parseCorsOrigins', () => {
  it('returns an empty array when the value is undefined', () => {
    // eslint-disable-next-line unicorn/no-useless-undefined -- explicitly covering the unset env case
    expect(parseCorsOrigins(undefined)).toEqual([]);
  });

  it('returns an empty array for an empty string', () => {
    expect(parseCorsOrigins('')).toEqual([]);
  });

  it('splits a comma-separated list into origins', () => {
    expect(
      parseCorsOrigins('https://admin.example.com,https://staging.example.com'),
    ).toEqual(['https://admin.example.com', 'https://staging.example.com']);
  });

  it('trims whitespace around each origin', () => {
    expect(
      parseCorsOrigins(
        ' https://admin.example.com , https://staging.example.com ',
      ),
    ).toEqual(['https://admin.example.com', 'https://staging.example.com']);
  });

  it('drops empty entries from trailing or duplicate commas', () => {
    expect(parseCorsOrigins('https://admin.example.com,,')).toEqual([
      'https://admin.example.com',
    ]);
  });

  it('returns an empty array when the value is only separators/whitespace', () => {
    expect(parseCorsOrigins(' , , ')).toEqual([]);
  });
});
