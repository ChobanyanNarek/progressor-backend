import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Injectable, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';

import { LanguageCode } from '../constants/language-code.ts';
import { ContextProvider } from '../providers/context.provider.ts';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const language = request.headers['x-language-code'] as
      | LanguageCode
      | undefined;

    if (
      language !== undefined &&
      Object.values(LanguageCode).includes(language)
    ) {
      ContextProvider.setLanguage(language);
    }

    return next.handle();
  }
}

export function UseLanguageInterceptor(): MethodDecorator & ClassDecorator {
  return UseInterceptors(LanguageInterceptor);
}
