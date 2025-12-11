import { GetCommand, GetCommandInput } from "@aws-sdk/lib-dynamodb";
import { EMAIL_TEMPLATES_TABLE_NAME } from "../constants";
import { TemplateId } from "../types";
import { SendEmailCommand, SendEmailCommandInput } from "@aws-sdk/client-ses";
import { sesClient } from "../ses-client";

export const constructGetTemplateCommand = (templateId: TemplateId) => {
  const input: GetCommandInput = {
    TableName: EMAIL_TEMPLATES_TABLE_NAME,
    Key: {
      templateId: templateId,
    },
  };

  return new GetCommand(input);
};

export const sendEmail = async (
  userEmail: string,
  subject: string,
  template: string
) => {
  const params: SendEmailCommandInput = {
    Destination: {
      ToAddresses: [userEmail],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: template,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: "fine-management-app@gmail.com",
  };

  const command = new SendEmailCommand(params);
  return sesClient.send(command);
};
