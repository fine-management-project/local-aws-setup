import { ddbDocClient } from "../dynamodb-client";
import {
  ProducerService,
  TemplateId,
  TemplateObject,
  UserManagementServiceEvents,
} from "../types";
import { BaseEventHandler } from "./base.event-handler";
import { constructGetTemplateCommand, sendEmail } from "./utils";

export type RequestChangeEmailEventPayload = {
  userEmail: string;
  changeEmailLink: string;
};

export class RequestedChangeEmailEventHandler extends BaseEventHandler {
  constructor() {
    super(
      ProducerService.userManagementService,
      UserManagementServiceEvents.RequestedChangeEmail
    );
  }

  async processEvent(
    eventData?: Partial<RequestChangeEmailEventPayload>
  ): Promise<void> {
    try {
      const getCommand = constructGetTemplateCommand(TemplateId.changeEmail);

      if (!eventData?.userEmail || !eventData?.changeEmailLink) {
        throw new Error("User email and change email link should be provided!");
      }

      const result = (await ddbDocClient.send(getCommand))
        .Item as TemplateObject;

      const preparedTemplate = result.template
        .replaceAll("{userEmail}", eventData.userEmail)
        .replaceAll("{changeEmailLink}", eventData.changeEmailLink);

      await sendEmail(eventData.userEmail, result.subject, preparedTemplate);
    } catch (error) {
      console.error(
        `Error retrieving template ${TemplateId.changeEmail}:`,
        error
      );

      throw error;
    }
  }
}
