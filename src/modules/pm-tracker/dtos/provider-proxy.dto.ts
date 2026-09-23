import { Expose } from 'class-transformer';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

/*
 * GitHub and GitLab calls go through the backend so their tokens can stay in the vault.
 * Each endpoint has its own request/result pair (unique-endpoint-dtos). The caller sends a
 * path relative to the provider's fixed API host; the server checks it against an
 * allow-list, so these cannot be used to reach arbitrary URLs or endpoints.
 */

export class GithubProxyRequestDto extends BaseDto {
  // e.g. /repos/acme/web/pulls?state=open&per_page=100
  @StringField({ maxLength: 2000 })
  readonly path!: string;

  // Which connection's stored token to use.
  @StringFieldOptional({ maxLength: 100 })
  readonly connectionId?: string;

  // Only while a connection's token has not yet moved to the vault.
  @StringFieldOptional({ maxLength: 1024 })
  readonly token?: string;
}

export class GithubProxyResultDto extends BaseDto {
  @NumberField({ int: true })
  status!: number;

  // The provider's JSON body, passed through untouched.
  @Expose()
  data!: unknown;
}

export class GitlabProxyRequestDto extends BaseDto {
  // e.g. /api/v4/groups/acme/merge_requests?state=opened
  @StringField({ maxLength: 2000 })
  readonly path!: string;

  @StringFieldOptional({ maxLength: 100 })
  readonly connectionId?: string;

  @StringFieldOptional({ maxLength: 1024 })
  readonly token?: string;
}

export class GitlabProxyResultDto extends BaseDto {
  @NumberField({ int: true })
  status!: number;

  @Expose()
  data!: unknown;
}
