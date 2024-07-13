import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  console.log('Event: ', event);

  const { headers, methodArn } = event;

  try {
    if (!headers?.authorization) {
      throw new Error('Token is not provided');
    }

    const credentials = headers.authorization.replace('Basic ', '');
    const [username, password] = Buffer.from(credentials, 'base64').toString('utf8').split(':');

    console.log(`Username: ${username}, Password: ${password}`);

    const effect = process.env.hasOwnProperty(username) && process.env[username] === password ? 'Allow' : 'Deny';

    console.log(`Policy effect: ${effect}`);

    return {
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
  } catch (error) {
    console.error(error);
    throw new Error('Unauthorized');
  }
};
