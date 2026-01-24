# Nova Sonic Application

This application consists of the following components:

* Common
    * `common`: Shared files including event type definitions and data access layer
* Next.js related
    * `app`: Next.js App Router app directory
    * `components`: Next.js (React) common components, including [shadcn](https://ui.shadcn.com/) files
    * `lib`: Next.js common libraries
* Lambda functions
    * `agent`: Backend that operates Nova Sonic API, runs as long-running tasks on Lambda
    * `lambda`: Entry points for Lambda functions (agent)

## Local Development

You can run the frontend locally while using the following real AWS resources:

* Cognito UserPool
* DynamoDB Table
* AppSync Events API
* Nova Sonic Lambda Function

First, copy the environment file: `cp .env.local.example .env.local`, then populate the `.env.local` file with the correct values from the CDK Stack deployment output.

After that, run the following commands to start the frontend:

```sh
npm ci # Install dependencies (only needed for initial setup)
npm run dev # Start local server
# Access http://localhost:3005 in your browser
```
