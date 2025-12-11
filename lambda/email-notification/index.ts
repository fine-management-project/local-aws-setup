import { SQSHandler, Context } from "aws-lambda";
import { RequestedEmailVerificationEventHandler } from "./handlers/requested-email-verification-event-handler";
import { BaseEventHandler } from "./handlers/base.event-handler";
import { RequestedChangeEmailEventHandler } from "./handlers/requested-change-email-event-handler";
import { RequestedForgotPasswordEventHandler } from "./handlers/requested-forgot-password-event-handler";

const handlers: BaseEventHandler[] = [
  new RequestedEmailVerificationEventHandler(),
  new RequestedChangeEmailEventHandler(),
  new RequestedForgotPasswordEventHandler(),
];

export const handler: SQSHandler = async (event, context: Context) => {
  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);
      const handler = handlers.find((handler) =>
        handler.canProcess(record.messageAttributes)
      );

      if (handler) {
        handler.processEvent(messageBody);
      }
    } catch (e) {
      console.error("Error parsing message body:", record.body, e);
    }
  }
};
