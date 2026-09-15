import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
  Res,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LtiBasicLaunchRequest } from '@haski/lti';
import { sessionCookieOptions } from '../config/cookies.js';
import { LTI_COOKIE_NAME } from './lti-cookie.js';
import { describeLaunch } from './lti-log.js';
import { LtiService } from './lti.service.js';
import { LtiBasicLaunchValidationPipe } from './pipes/lti-validation.pipe.js';
import { LtiCookie } from '../utils/LtiCookie.js';

@Controller('lti')
export class LtiController {
  private readonly logger = new Logger(LtiController.name);

  constructor(private readonly ltiService: LtiService) {}

  @Post('basiclogin')
  handleBasicLogin(
    @Body(new LtiBasicLaunchValidationPipe()) payload: LtiBasicLaunchRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): void {
    try {
      this.logger.debug(
        `Processing LTI basic login: ${JSON.stringify(describeLaunch(payload))}`,
      );

      // Set cookies for LTI launch request data
      const cookie: LtiCookie = {
        user_id: payload.user_id,
        tool_consumer_instance_guid: payload.tool_consumer_instance_guid,
        isEditor:
          payload.roles.includes('Instructor') ||
          payload.roles.includes('Administrator'),
        lis_person_name_full: payload.lis_person_name_full,
        timestamp: new Date().toISOString(),
        tool_consumer_instance_name: payload.tool_consumer_instance_name,
        lis_person_contact_email_primary:
          payload.lis_person_contact_email_primary,
      };
      response.cookie(
        LTI_COOKIE_NAME,
        JSON.stringify(cookie),
        sessionCookieOptions(5 * 60 * 60 * 1000), // 5 hours
      );
      this.logger.debug(`Set cookie ${LTI_COOKIE_NAME}`);

      const { redirectUrl } = this.ltiService.handleBasicLogin(payload);

      this.logger.debug(`Redirecting to: ${redirectUrl.split('?')[0]}`);
      response.redirect(302, redirectUrl);
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Unknown error processing LTI request';

      // Log detailed error information
      this.logger.error(
        `Error in LTI basic login: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );

      // If it's a validation error, we already have details from the pipe
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For other errors, provide a more descriptive error
      throw new BadRequestException(
        `Failed to process LTI request: ${errorMsg}`,
      );
    }
  }
}
