import type { ClientProxy } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { firstValueFrom } from 'rxjs';

import { PageTypeException } from '../exceptions/page-type.exception.ts';
import type { Constructor } from '../types.ts';
import type { PageDto } from './dto/page.dto.ts';
import type { PageMetaDto } from './dto/page-meta.dto.ts';

/**
 * Reusable base for `@nestjs/microservices` clients: extend this class to create
 * a typed client that sends action patterns and maps the response into a plain
 * DTO (or paginated `PageDto`). It is a generic building block; concrete clients
 * supply their own `ActionType` and inject a `ClientProxy`.
 */
export class AbstractClientService<ActionType> {
  constructor(private client: ClientProxy) {}

  public async send(pattern: ActionType, data: unknown): Promise<void>;

  public async send<R>(
    pattern: ActionType,
    data: unknown,
    returnDataOptions: { class: Constructor<R>; isPage: true },
  ): Promise<PageDto<R>>;

  public async send<R>(
    pattern: ActionType,
    data: unknown,
    returnDataOptions?: { class: Constructor<R>; isPage?: false },
  ): Promise<R>;

  public async send<R, I>(
    pattern: ActionType,
    data: I,
    returnDataOptions?: Partial<{
      class?: Constructor<R>;
      isPage?: boolean;
    }>,
  ): Promise<R | PageDto<R> | void> {
    const returnData = await firstValueFrom(
      this.client.send<{ data?: R; meta?: PageMetaDto }>(pattern, data),
      {
        defaultValue: undefined,
      },
    );

    if (returnDataOptions?.isPage && (!returnData?.data || !returnData.meta)) {
      throw new PageTypeException();
    }

    if (!returnDataOptions?.class || returnDataOptions.isPage) {
      return returnData as R;
    }

    return plainToInstance(returnDataOptions.class, returnData);
  }
}
