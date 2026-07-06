import { describe, expect, it, jest } from '@jest/globals';

import { PublicStrategy } from './public.strategy.ts';

describe('PublicStrategy', () => {
  it('authenticate() succeeds with the public sentinel and does not throw', () => {
    const strategy = new PublicStrategy();
    const success = jest.fn();
    /* passport injects `success` before calling authenticate(); stub it here. */
    (strategy as unknown as { success: (user: unknown) => void }).success =
      success;

    /*
     * Regression: overriding validate() (not authenticate()) left the base
     * Strategy#authenticate in place, which throws for @Auth([], {public:true}).
     */
    expect(() => {
      strategy.authenticate();
    }).not.toThrow();
    expect(success).toHaveBeenCalledWith({ [Symbol.for('isPublic')]: true });
  });
});
