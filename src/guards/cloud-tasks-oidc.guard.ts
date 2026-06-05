import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { OAuth2Client } from 'google-auth-library';

import { ApiConfigService } from '../shared/services/api-config.service.ts';

/**
 * Verifies that a request was issued by Cloud Tasks on our behalf.
 *
 * Cloud Tasks attaches a Google-signed OIDC identity token minted for the
 * configured invoker service account. We verify the token's signature, its
 * audience (must equal our target URL) and that it was issued for the expected
 * service account. Anything else is rejected — so the internal endpoint cannot
 * be triggered by arbitrary callers even though it is reachable over HTTP.
 */
@Injectable()
export class CloudTasksOidcGuard implements CanActivate {
  private readonly oauthClient = new OAuth2Client();

  private readonly audience: string;

  private readonly serviceAccountEmail: string;

  constructor(apiConfigService: ApiConfigService) {
    const { targetUrl, invokerServiceAccount } = apiConfigService.gcpConfig;

    this.audience = targetUrl;
    this.serviceAccountEmail = invokerServiceAccount;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const idToken = authorization.slice('Bearer '.length);

    let payload;

    try {
      const ticket = await this.oauthClient.verifyIdToken({
        idToken,
        audience: this.audience,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException();
    }

    if (
      !payload ||
      payload.email !== this.serviceAccountEmail ||
      payload.email_verified !== true
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
