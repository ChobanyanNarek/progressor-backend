import type { NextFunction, Request, Response } from 'express';

interface IBodyParserError {
  status?: number;
  type?: string;
}

/*
 * body-parser rejects an oversized or malformed body before Nest's CORS layer runs, so
 * the 413/400 went out without Access-Control-Allow-Origin. The browser then hides the
 * response entirely and the client can only report a generic network failure -- which
 * is how an oversized pm-tracker state looked like "couldn't reach the server" on every
 * save. This answers those errors with the CORS header for allowed origins, so the real
 * status reaches the client. Any other error is passed on untouched.
 */
export function bodyParserErrorHandler(allowedOrigins: ReadonlySet<string>) {
  return (
    error: IBodyParserError,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const isBodyError =
      error.type?.startsWith('entity.') === true ||
      error.type === 'encoding.unsupported';

    if (!isBodyError) {
      next(error);

      return;
    }

    const origin = req.headers.origin;

    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }

    const status = error.status ?? 400;

    res.status(status).json({
      statusCode: status,
      message:
        error.type === 'entity.too.large'
          ? 'error.payloadTooLarge'
          : 'error.invalidBody',
    });
  };
}
