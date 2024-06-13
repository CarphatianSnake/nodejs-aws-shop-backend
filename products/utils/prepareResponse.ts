import type { Product } from "./products";

type ErrorMessage = {
  message: string;
};

type IBody = ErrorMessage | Product | Product[];

const prepareResponse = (statusCode: number, body: IBody) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};

export default prepareResponse;
