import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminCredentials } from './admin-credentials.js';
import { AdminSessionGuard } from './guards/admin-session.guard.js';
import { LoginThrottle } from './login-throttle.js';

@Module({
  controllers: [AdminAuthController],
  providers: [
    AdminAuthService,
    AdminCredentials,
    AdminSessionGuard,
    LoginThrottle,
  ],
  // Exported so the template, workshop and provider modules can apply @Facilitator()
  // without re-declaring the guard's dependencies.
  exports: [AdminAuthService, AdminCredentials, AdminSessionGuard],
})
export class AdminAuthModule {}
