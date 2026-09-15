import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions, Socket } from 'socket.io';
import {
  LTI_COOKIE_NAME,
  parseCookieHeader,
  parseLtiCookie,
} from '../lti/lti-cookie.js';

export class WebSocketCookieAdapter extends IoAdapter {
  // Named to avoid colliding with the `logger` property introduced in the base IoAdapter
  private readonly adapterLogger = new Logger(WebSocketCookieAdapter.name);

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, options);

    // Add middleware to parse cookies and attach them to the socket handshake
    server.use((socket: Socket, next) => {
      try {
        const cookies = parseCookieHeader(socket.handshake.headers.cookie);
        socket.handshake.auth.parsedCookies = cookies;

        const raw = cookies[LTI_COOKIE_NAME];
        const ltiCookie = parseLtiCookie(raw);

        if (ltiCookie) {
          socket.handshake.auth.ltiCookie = ltiCookie;
          this.adapterLogger.debug(
            `LTI cookie parsed for socket: ${ltiCookie.user_id}`,
          );
        } else if (raw) {
          this.adapterLogger.warn('Invalid LTI cookie structure');
        }
      } catch (error) {
        this.adapterLogger.error('Error in WebSocket middleware:', error);
      }

      // An absent or malformed cookie means an unauthenticated visitor, not a rejected
      // connection: the editor connects before any identity has been established.
      next();
    });

    return server;
  }
}
