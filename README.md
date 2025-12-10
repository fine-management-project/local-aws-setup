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
