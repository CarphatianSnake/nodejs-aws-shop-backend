import type { HttpResponseBody } from "@/types";

const prepareResponse = (statusCode: number, body: HttpResponseBody) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
};

export default prepareResponse;
