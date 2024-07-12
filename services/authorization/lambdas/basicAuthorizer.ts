import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent, Handler } from "aws-lambda";

interface IEvent extends APIGatewayRequestAuthorizerEvent {
  authorizationToken: string;
}

export const handler: Handler<IEvent> = async (event, _, cb) => {
  console.log('Event: ', event);

  const { type, authorizationToken, methodArn } = event;

  if (type !== 'REQUEST') {
    console.log('Token type not provided.');
    cb('Unauthorized');
  }

  if (authorizationToken === 'null') {
    console.log('Token not provided.');
    cb('Unauthorized');
  }

  try {
    const credentials = authorizationToken.replace('Basic ', '');
    const [username, password] = Buffer.from(credentials, 'base64').toString('utf8').split(':');

    console.log(`Username: ${username}, Password: ${password}`);

    const effect = !process.env[username] || process.env[username] !== password ? 'Deny' : 'Allow';

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
