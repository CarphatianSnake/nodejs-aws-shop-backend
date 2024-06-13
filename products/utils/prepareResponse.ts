import type { Product } from "../mock/products";

type ErrorMessage = {
  message: string;
};

type IBody = ErrorMessage | Product | Product[];

const prepareResponse = (statusCode: number, body: IBody) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
};

export default prepareResponse;
