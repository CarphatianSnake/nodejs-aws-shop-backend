import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent, Handler } from "aws-lambda";

export const handler: Handler<APIGatewayRequestAuthorizerEvent> = async (event, _, cb) => {
  console.log('Event: ', event);

  const { type, headers, methodArn } = event;

  try {
    if (type !== 'REQUEST') {
      throw new Error('Token type is not provided');
    }

    if (!headers?.authorization) {
      throw new Error('Token is not provided');
    }

    const credentials = headers.authorization.replace('Basic ', '');
    const [username, password] = Buffer.from(credentials, 'base64').toString('utf8').split(':');

    console.log(`Username: ${username}, Password: ${password}`);

    const effect = process.env.hasOwnProperty(username) && process.env[username] === password ? 'Allow' : 'Deny';

    console.log(`Policy effect: ${effect}`);

    const policy: APIGatewayAuthorizerResult = {
      principalId: credentials,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: methodArn,
          },
        ],
      }
    };

    cb(null, policy);
  } catch (error) {
    console.error(error);
    cb('Unauthorized');
  }
};
