export enum TemplateId {
  verificationEmail = "verification-email",
  changeEmail = "change-email",
  forgotPassword = "forgot-password",
}

export enum ProducerService {
  userManagementService = "user-management-service",
}

export enum UserManagementServiceEvents {
  RequestedEmailVerification = "requested-email-verification",
  RequestedForgotPassword = "requested-forgot-password",
  RequestedChangeEmail = "requested-change-email",
}

export type ServiceEventMap = {
  [ProducerService.userManagementService]: UserManagementServiceEvents;
};

export type TemplateObject = {
  templateId: string;
  template: string;
  subject: string;
};
