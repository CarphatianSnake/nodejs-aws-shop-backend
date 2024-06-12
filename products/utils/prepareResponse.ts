import type { Product } from "./products";

type ErrorMessage = {
  message: string;
};

type ReponseData = {
  data: Product | Product[];
}

type IBody = ErrorMessage | ReponseData;

const prepareResponse = (statusCode: number, body: IBody) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};

export default prepareResponse;
