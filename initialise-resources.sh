#!/bin/bash

echo "Initializing localstack resources started... ⌛️"

echo "Creating SQS queues... ⌛️"
awslocal sqs create-queue --queue-name user-management-service-queue

echo "SQS queues were created successfully! ✅️"


echo "Creating SNS topics... ⌛️"
awslocal sns create-topic --name user-management-service-events

echo "SNS topics were created successfully! ✅️"

echo "localstack resources were set up successfully! ✅️"
