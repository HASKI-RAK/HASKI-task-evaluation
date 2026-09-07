import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as XAPIModule from '@xapi/xapi';

// `@xapi/xapi` ships CJS with ESM-style typings (`export default`), which
// TypeScript's `nodenext` resolver surfaces as the module namespace rather
// than the class constructor. The default export is the class at runtime.
type XAPIInstance = {
  sendStatement(params: Record<string, unknown>): Promise<unknown>;
};

type XAPIClass = {
  new (config: {
    endpoint: string;
    auth?: string;
    version?: string;
  }): XAPIInstance;
  toBasicAuth(username: string, password: string): string;
};

const XAPI = XAPIModule.default as unknown as XAPIClass;

// XAPI
export const xAPI = new XAPI({
  endpoint: process.env.XAPI_ENDPOINT ?? '',
  auth: XAPI.toBasicAuth(
    process.env.XAPI_USERNAME ?? '',
    process.env.XAPI_PASSWORD ?? '',
  ),
  version: '1.0.3',
});

@Injectable()
export class XapiService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Add any initialization logic if needed
  }

  async onModuleDestroy() {
    // Add any cleanup logic if needed
  }

  // We can access the xAPI instance through this service
  getXapi() {
    return xAPI;
  }
}
