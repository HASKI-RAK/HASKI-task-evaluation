import { UseGuards, applyDecorators } from '@nestjs/common';
import { AdminSessionGuard } from '../guards/admin-session.guard.js';

/**
 * Marks a controller or handler as facilitator-only (SPEC-0013).
 *
 * Every administrative surface — templates, workshops, providers, model policy — is
 * expected to carry this rather than wiring the guard itself, so there is one place to
 * change if the role model ever grows.
 */
export const Facilitator = () => applyDecorators(UseGuards(AdminSessionGuard));
