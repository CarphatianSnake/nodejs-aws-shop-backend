import { CustomError } from "/opt/utils";
import type { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from "aws-lambda";

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult | CustomError> => {
  console.log('Event: ', event);

  const { type, authorizationToken, methodArn } = event;

  if (type !== 'TOKEN') {
    console.log('Token type not provided.');
    return new CustomError('Unauthorized', 401);
  }

  try {
    const credentials = authorizationToken.replace('Basic ', '');
    const [username, password] = Buffer.from(credentials, 'base64').toString('utf8').split(':');

    console.log(`Username: ${username}, Password: ${password}`);

    const effect = process.env[username] === password ? 'Allow' : 'Deny';

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

    return policy;
  } catch (error) {
    console.error(error);
    return new CustomError('Unauthorized', 401);
  }
};
