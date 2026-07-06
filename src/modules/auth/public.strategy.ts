import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport';

@Injectable()
export class PublicStrategy extends PassportStrategy(Strategy, 'public') {
  /**
   * The bare `passport` base Strategy has no working `authenticate()` — it throws
   * "Strategy#authenticate must be overridden by subclass". The PassportStrategy
   * mixin only routes into `validate()` when the wrapped strategy invokes a verify
   * callback, which the base one never does. So an always-succeed "public" strategy
   * must override `authenticate()` directly; a `@Auth([], { public: true })` route
   * that falls back here 500s otherwise.
   */
  override authenticate(): void {
    this.success({ [Symbol.for('isPublic')]: true });
  }

  /**
   * Required only to satisfy the mixin's abstract `validate` signature. Never
   * reached at runtime because `authenticate()` short-circuits above.
   */
  override validate(): void {
    this.success({ [Symbol.for('isPublic')]: true });
  }
}
