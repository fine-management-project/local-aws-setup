# local-aws-setup

This repository is created to store config for the local AWS setup for the development purposes. It includes commands from the initialise-resources.sh and the commands that may be used for manual testing in the docker container.

# Prerequisites

Please, create an external network for all applications to work with.

```
docker network create fine-management-app-network
```

# SQS

#### Create SQS queue for user-management-service

```
awslocal sqs create-queue --queue-name user-management-service-queue
```

**Response example**

```
{
    "QueueUrl": "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-management-service-queue"
}
```

#### The returned link should be placed to user-management-service app env.

```
SQS_QUEUE = http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-management-service-queue
```

### View all queues

```
awslocal sqs list-queues
```

### For testing purposes: Send and receive messages

```
awslocal sqs send-message \
    --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-management-service-queue \
    --message-body "This is a test message for SQS."
```

```
awslocal sqs receive-message \
    --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-management-service-queue \
    --max-number-of-messages 10
```

```
awslocal sqs send-message \
  --queue-url "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/user-management-service-queue" \
  --message-body '{  "userId": "test3"  }' \
  --message-attributes \
    '{"ProducerService": {"DataType": "String", "StringValue": "fine-management-service"},
      "EventType": {"DataType": "String", "StringValue": "test"}
    }'
```

# SNS

### Create SNS topic for user management service

```
awslocal sns create-topic --name user-management-service-events
```

**Response example**

```
{
"TopicArn": "arn:aws:sns:us-east-1:000000000000:user-management-service-events"
}
```

#### The returned link should be placed to user-management-service app env.

```
SNS_TOPIC = arn:aws:sns:us-east-1:000000000000:user-management-service-events
```

### View all topics

```
awslocal sns list-topics
```

# SES

To send emails, SES service was set up.

> [!WARNING]
> SES do not actually send emails from the localstack using the free tier version, so MailTrap, MailHog or other similar services will not be able to intercept emails and show them on UI. So, to check whether the email was sent, you can look up in the /localstack-data/state/ses directory for the sent emails.

### Verify SES email

```
awslocal ses verify-email-identity --email-address fine-management-app@gmail.com
```

### See the list of sent emails

```
curl -s http://localhost:4566/\_aws/ses
```

# Dynamo DB

To store email templates to be used in the lambada, a DynamoDB table was set up.

### Create DynamoDB table

```
awslocal dynamodb create-table \
  --table-name email-templates \
  --key-schema AttributeName=templateId,KeyType=HASH \
  --attribute-definitions AttributeName=templateId,AttributeType=S \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
  --region $AWS_REGION
```

### Initialize templates from the templates.json

```
awslocal dynamodb batch-write-item \
    --request-items file:///app/init_data/templates.json \
    --region $AWS_REGION \
    --endpoint-url=$LOCALSTACK_URL
```

# Lambda

To send emails, an email-notification-lambda was created.

It operates with TypeScript, and is located in /lambda/email-notification/index.js.

Other files are connections to SES, DynamoDB, or event handlers.

### How to build the lambda?

> [!WARNING]
> Without this step, the lambda will not work!

First of all, we need to build the lambda via npm commands. Please, verify that you have Node 22 installed and active, then run:

```
npm run build-email-lambda
```

Then proceed with the command:

```
npm run zip-email-lambda
```

After this step, build and zip should appear in the project. They won't be transferred to Git with commits.

The zip file will be used for creating of the lambda in the initialise-resources.sh.

### Create Lambda

```
awslocal lambda create-function \
  --function-name email-notifications-lambda \
  --runtime nodejs22.x \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler index.handler \
  --zip-file fileb:///app/init_data/email-notifications-lambda.zip
```

### Subscribe the Lambda to events from the SQS

```
awslocal lambda create-event-source-mapping \
  --function-name email-notifications-lambda \
  --batch-size 1 \
  --event-source-arn $EMAIL_NOTIFICATION_LAMBDA_SQS_QUEUE_ARN
```

### How to test that the email notification flow is working?

Please, send the following command:

```
awslocal sqs send-message \
 --queue-url "http://sqs.us-east-1.localstack:4566/000000000000/email-notifications-lambda-queue" \
 --message-body '{ "userEmail": "username@localhost", "forgotPasswordLink": "http://localhost:3000/auth/sign-in" }' \
 --message-attributes \
 '{"ProducerService": {"DataType": "String", "StringValue": "user-management-service"},
"EventType": {"DataType": "String", "StringValue": "requested-forgot-password"}
}'
```

After the command is finished you should see a new JSON file in the /localstack-data/state/ses directory.

Here you can see a template, subject, and all other stuff that will be sent from the AWS via email.

# S3

To store raw and signed fine documents S3 is used.

### Create S3 Bucket (fine-app-documents)

```
awslocal s3 mb s3://fine-app-documents
```

### Upload files to S3 bucket

```
aws --endpoint-url=http://localhost:4566 s3 cp test.txt s3://fine-app-documents/raw/test.txt
```

### List all uploaded files by prefix

```
aws --endpoint-url=http://localhost:4566 s3 ls s3://fine-app-documents/raw/
```

### Download file

```
aws --endpoint-url=http://localhost:4566 s3 cp s3://fine-app-documents/raw/test.txt ./contract_01.pdf
```
