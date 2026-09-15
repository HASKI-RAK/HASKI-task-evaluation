import { LtiBasicLaunchRequest } from '@haski/lti';

/**
 * Reduces a launch payload to the fields that are safe to log.
 *
 * The payload carries `lis_person_name_full` and `lis_person_contact_email_primary`;
 * logging it wholesale put personal data into every debug line (SPEC-0013/FR-008).
 */
export function describeLaunch(
  payload: LtiBasicLaunchRequest,
): Record<string, unknown> {
  return {
    context_id: payload.context_id,
    resource_link_id: payload.resource_link_id,
    tool_consumer_instance_guid: payload.tool_consumer_instance_guid,
    roles: payload.roles,
    custom_activityname: payload.custom_activityname,
    lti_message_type: payload.lti_message_type,
    lti_version: payload.lti_version,
  };
}
