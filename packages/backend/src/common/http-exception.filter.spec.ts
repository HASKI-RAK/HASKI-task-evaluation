import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiErrorBody, HttpExceptionFilter } from './http-exception.filter.js';

const hostFor = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'PUT', path: '/workflows/wf-1' }),
    }),
  } as unknown as ArgumentsHost;

  return { host, status, body: () => json.mock.calls[0][0] as ApiErrorBody };
};

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('carries context attached by the thrower, not just code and message', () => {
    const { host, status, body } = hostFor();

    filter.catch(
      new ConflictException({
        code: 'version_conflict',
        currentVersion: 5,
        message: 'Changed elsewhere.',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(body()).toEqual({
      statusCode: 409,
      code: 'version_conflict',
      currentVersion: 5,
      message: 'Changed elsewhere.',
    });
  });

  it('falls back to a code derived from the status', () => {
    const { host, body } = hostFor();

    filter.catch(new HttpException('Nope', HttpStatus.NOT_FOUND), host);

    expect(body()).toEqual({
      statusCode: 404,
      code: 'not_found',
      message: 'Nope',
    });
  });

  it('flattens the validation pipe’s message array', () => {
    const { host, body } = hostFor();

    filter.catch(
      new BadRequestException({
        message: ['name must be a string', 'content should not be empty'],
      }),
      host,
    );

    expect(body().message).toBe(
      'name must be a string, content should not be empty',
    );
    // `error: 'Bad Request'` duplicates `code`; it is not echoed alongside it.
    expect(body()).not.toHaveProperty('error');
  });

  it('never leaks an internal failure to the client', () => {
    const { host, status, body } = hostFor();

    filter.catch(new Error('connect ECONNREFUSED 127.0.0.1:5432'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(body()).toEqual({
      statusCode: 500,
      code: 'internal_error',
      message: 'Internal server error',
    });
  });
});
