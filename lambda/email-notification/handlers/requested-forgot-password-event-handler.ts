import { ddbDocClient } from "../dynamodb-client";
import {
  ProducerService,
  TemplateId,
  TemplateObject,
  UserManagementServiceEvents,
} from "../types";
import { BaseEventHandler } from "./base.event-handler";
import { constructGetTemplateCommand, sendEmail } from "./utils";

export type RequestForgotPasswordEventPayload = {
  userEmail: string;
  forgotPasswordLink: string;
};

export class RequestedForgotPasswordEventHandler extends BaseEventHandler {
  constructor() {
    super(
      ProducerService.userManagementService,
      UserManagementServiceEvents.RequestedForgotPassword
    );
  }

  async processEvent(
    eventData?: Partial<RequestForgotPasswordEventPayload>
  ): Promise<void> {
    try {
      const getCommand = constructGetTemplateCommand(TemplateId.forgotPassword);

      if (!eventData?.userEmail || !eventData?.forgotPasswordLink) {
        throw new Error(
          "User email and forgot password link should be provided!"
        );
      }

      const result = (await ddbDocClient.send(getCommand))
        .Item as TemplateObject;

      const preparedTemplate = result.template
        .replaceAll("{userEmail}", eventData.userEmail)
        .replaceAll("{forgotPasswordLink}", eventData.forgotPasswordLink);

      await sendEmail(eventData.userEmail, result.subject, preparedTemplate);
    } catch (error) {
      console.error(
        `Error retrieving template ${TemplateId.forgotPassword}:`,
        error
      );

      throw error;
    }
  }
}
