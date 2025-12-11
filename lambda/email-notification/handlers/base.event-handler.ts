import { EVENT_TYPE_ATTRIBUTE, PRODUCER_SERVICE_ATTRIBUTE } from "../constants";
import { ProducerService, ServiceEventMap } from "../types";
import { SQSMessageAttributes } from "aws-lambda";

export abstract class BaseEventHandler {
  constructor(
    protected readonly serviceName: ProducerService,
    protected readonly eventType: ServiceEventMap[ProducerService]
  ) {}

  abstract processEvent(eventData?: unknown): Promise<void>;

  canProcess(attributes: SQSMessageAttributes) {
    const producerService = attributes[PRODUCER_SERVICE_ATTRIBUTE].stringValue;
    const eventType = attributes[EVENT_TYPE_ATTRIBUTE].stringValue;

    return producerService === this.serviceName && eventType === this.eventType;
  }
}
