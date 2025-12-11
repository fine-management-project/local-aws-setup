import { ddbDocClient } from "../dynamodb-client";
import {
  ProducerService,
  TemplateId,
  TemplateObject,
  UserManagementServiceEvents,
} from "../types";
import { BaseEventHandler } from "./base.event-handler";
import { constructGetTemplateCommand, sendEmail } from "./utils";

export type RequestEmailVerificationEventPayload = {
  userEmail: string;
  verificationLink: string;
};

export class RequestedEmailVerificationEventHandler extends BaseEventHandler {
  constructor() {
    super(
      ProducerService.userManagementService,
      UserManagementServiceEvents.RequestedEmailVerification
    );
  }

  async processEvent(
    eventData?: Partial<RequestEmailVerificationEventPayload>
  ): Promise<void> {
    try {
      const getCommand = constructGetTemplateCommand(
        TemplateId.verificationEmail
      );

      if (!eventData?.userEmail || !eventData?.verificationLink) {
        throw new Error("User email and verification link should be provided!");
      }

      const result = (await ddbDocClient.send(getCommand))
        .Item as TemplateObject;

      const preparedTemplate = result.template
        .replaceAll("{userEmail}", eventData.userEmail)
        .replaceAll("{verificationLink}", eventData.verificationLink);

      await sendEmail(eventData.userEmail, result.subject, preparedTemplate);
    } catch (error) {
      console.error(
        `Error retrieving template ${TemplateId.verificationEmail}:`,
        error
      );

      throw error;
    }
  }
}
