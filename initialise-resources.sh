#!/bin/bash

echo "Initializing localstack resources started... ⌛️"

echo "--- Verifying Environment Variables ---"
echo "AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
echo "AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY"
echo "AWS_REGION: $AWS_REGION"
echo "---------------------------------------"

echo "Creating SQS queues... ⌛️"
awslocal sqs create-queue --queue-name user-management-service-queue

EMAIL_NOTIFICATION_LAMBDA_SQS_QUEUE_URL=$(awslocal sqs create-queue \
    --queue-name email-notifications-lambda-queue \
    --output text \
    --query 'QueueUrl')

EMAIL_NOTIFICATION_LAMBDA_SQS_QUEUE_ARN=$(awslocal sqs get-queue-attributes \
    --queue-url "$EMAIL_NOTIFICATION_LAMBDA_SQS_QUEUE_URL" \
    --attribute-names QueueArn \
    --output text \
    --query 'Attributes.QueueArn')

echo "EMAIL_NOTIFICATION_LAMBDA_SQS_QUEUE_ARN: $EMAIL_NOTIFICATION_LAMBDA_SQS_QUEUE_ARN"

echo "SQS queues were created successfully! ✅️"


echo "Creating SNS topics... ⌛️"

USER_MANAGEMENT_EVENT_SERVICE_EVENTS_TOPIC_ARN=$(awslocal sns create-topic \
    --name user-management-service-events-topic \
    --output text \
    --query 'TopicArn')

echo "USER_MANAGEMENT_EVENT_SERVICE_EVENTS_TOPIC_ARN: $USER_MANAGEMENT_EVENT_SERVICE_EVENTS_TOPIC_ARN"


echo "SNS topics were created successfully! ✅️"

echo "Subscribing SQS queue to SNS topic... ⌛️"

LAMBDA_USER_MANAGEMENT_SERVICE_TOPIC_SUBSCRIPTION=$(awslocal sns subscribe \
    --topic-arn "$USER_MANAGEMENT_EVENT_SERVICE_EVENTS_TOPIC_ARN" \
    --protocol sqs \
    --notification-endpoint "$EMAIL_NOTIFICATION_LAMBDA_SQS_QUEUE_ARN" \
    --query 'SubscriptionArn' --output text)

awslocal sns set-subscription-attributes \
    --subscription-arn "$LAMBDA_USER_MANAGEMENT_SERVICE_TOPIC_SUBSCRIPTION" \
    --attribute-name "RawMessageDelivery" \
    --attribute-value "true"
    
echo "Subscriptions are created successfully! ✅️"

echo "Creating DynamoDB's tables... ⌛️"

awslocal dynamodb create-table \
  --table-name email-templates \
  --key-schema AttributeName=templateId,KeyType=HASH \
  --attribute-definitions AttributeName=templateId,AttributeType=S \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
  --region $AWS_REGION

awslocal dynamodb batch-write-item \
    --request-items file:///app/init_data/templates.json \
    --region $AWS_REGION \
    --endpoint-url=$LOCALSTACK_URL

echo "DynamoDB's tables are created successfully! ✅️"

echo "Creating Lambdas... ⌛️"

awslocal lambda create-function \
  --function-name email-notifications-lambda \
  --runtime nodejs22.x \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler index.handler \
  --zip-file fileb:///app/init_data/email-notifications-lambda.zip

echo "Lambdas are created successfully! ✅️"

echo "Subscribing Lambdas to corresponding SQS queues... ⌛️"

awslocal lambda create-event-source-mapping \
  --function-name email-notifications-lambda \
  --batch-size 1 \
  --event-source-arn $EMAIL_NOTIFICATION_LAMBDA_SQS_QUEUE_ARN

echo "Subscriptions are created successfully! ✅️"

echo "Creating SES instances... ⌛️"

awslocal ses verify-email-identity --email-address fine-management-app@gmail.com

echo "SES instances are created successfully! ✅️"

echo "Creating S3 buckets... ⌛️"

awslocal s3 mb s3://fine-app-documents

awslocal s3api put-bucket-cors --bucket fine-app-documents --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"]
    }
  ]
}'

echo "S3 buckets are created successfully! ✅️"

echo "localstack resources were set up successfully! ✅️"


