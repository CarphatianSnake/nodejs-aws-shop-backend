import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    return {
      statusCode: 200,
      body: 'OK'
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: 'Error'
    };
  }
};
