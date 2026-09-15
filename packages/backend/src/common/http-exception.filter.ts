import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  /** Whatever context the thrower attached, e.g. `currentVersion` on a 409. */
  [key: string]: unknown;
};

/** Keys the envelope owns; anything else in a payload is caller-supplied context. */
const RESERVED = new Set(['statusCode', 'code', 'message', 'error']);

const DEFAULT_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'bad_request',
  [HttpStatus.UNAUTHORIZED]: 'unauthorized',
  [HttpStatus.FORBIDDEN]: 'forbidden',
  [HttpStatus.NOT_FOUND]: 'not_found',
  [HttpStatus.CONFLICT]: 'conflict',
  [HttpStatus.PRECONDITION_REQUIRED]: 'precondition_required',
  [HttpStatus.TOO_MANY_REQUESTS]: 'too_many_requests',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'service_unavailable',
};

/**
 * Produces one error shape for every HTTP failure, so the frontend can branch on a
 * stable `code` rather than on message text. Conflict handling for optimistic
 * concurrency (SPEC-0004/FR-013) depends on this.
 *
 * Nothing from the request is logged beyond method and path — headers carry the admin
 * session cookie, the workspace bearer token and the CSRF token, none of which may
 * reach a log (SPEC-0013/FR-008).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.toBody(exception, status);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.path} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.debug(
        `${request.method} ${request.path} -> ${status} (${body.code})`,
      );
    }

    response.status(status).json(body);
  }

  private toBody(exception: unknown, status: number): ApiErrorBody {
    const fallbackCode = DEFAULT_CODES[status] ?? 'internal_error';

    if (!(exception instanceof HttpException)) {
      return {
        statusCode: status,
        code: fallbackCode,
        message: 'Internal server error',
      };
    }

    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { statusCode: status, code: fallbackCode, message: payload };
    }

    const record = payload as Record<string, unknown>;
    const message = Array.isArray(record.message)
      ? record.message.join(', ')
      : typeof record.message === 'string'
        ? record.message
        : exception.message;

    // Extra keys are carried through rather than dropped. A 409 from an optimistic-
    // concurrency save is only actionable if `currentVersion` survives the envelope —
    // otherwise the client has to re-fetch just to learn what it collided with.
    const extra = Object.fromEntries(
      Object.entries(record).filter(([key]) => !RESERVED.has(key)),
    );

    return {
      ...extra,
      statusCode: status,
      code: typeof record.code === 'string' ? record.code : fallbackCode,
      message,
    };
  }
}
