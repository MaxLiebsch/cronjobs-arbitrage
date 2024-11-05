import axios, { AxiosError, AxiosRequestConfig } from "axios";
import "dotenv/config";
import { config } from "dotenv";
import { Dimensions, sleep } from "@dipmaxtech/clr-pkg";
import { HttpsProxyAgent } from "https-proxy-agent";

import { ProductMatchResponse } from "../types/ProductMatch.js";
import {
  FeeFinderRequestBuilder,
  NewFeeFinderRequestBuilder,
} from "../util/feeFinderRequestBuilder.js";
import { FeeFinderResponse } from "../types/FeeFinder.js";
import { NewFeeFinderResponse } from "../types/NewFeeFinderResponse.js";
import {
  MAX_RETRIES_SC,
  SC_REQUEST_TIMEOUT,
  SC_TIMEOUT,
} from "../constants.js";
import { AdditionalProductInfoResponse } from "../types/AdditionalProductInfoResponse.js";

config({
  path: [`.env`],
});

// Retry configuration

const retryDelay = SC_TIMEOUT; // Delay in milliseconds (e.g., 1000 ms = 1 second)
const maxRetries = MAX_RETRIES_SC; // Maximum number of retries
const timeout = SC_REQUEST_TIMEOUT; // Timeout in milliseconds

const username = process.env.BASIC_AUTH_USERNAME!;
const password = process.env.BASIC_AUTH_PASSWORD!;
const baseURL = process.env.SC_URL!;
const mix = process.env.PROXY_GATEWAY_URL!;
const de = process.env.PROXY_GATEWAY_URL_DE!;
const des = process.env.PROXY_GATEWAY_URL_DES!;

const mixProxyUrl = `http://${username}:${password}@${mix}`;
const deProxyUrl = `http://${username}:${password}@${de}`;
const desProxyUrl = `http://${username}:${password}@${des}`;

const proxyAgent = new HttpsProxyAgent(mixProxyUrl);
const deProxyAgent = new HttpsProxyAgent(deProxyUrl);
const desProxyAgent = new HttpsProxyAgent(desProxyUrl);

const agents = [proxyAgent, deProxyAgent, desProxyAgent];

function* yiedProxys() {
  let index = 0;
  while (true) {
    yield agents[index];
    index = (index + 1) % agents.length;
  }
}

const iterator = yiedProxys();
const init = iterator.next().value;

const axiosOptions: AxiosRequestConfig = {
  baseURL,
  headers: {
    "Content-type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  },
  timeout,
  httpAgent: init,
  httpsAgent: init,
};
const aznApi = axios.create(axiosOptions);

aznApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    let timeoutId = 0;
    const { config, code, response } = error;

    const __retryCount = (config as any)?.__retryCount
      ? (config as any).__retryCount
      : 0;

    const shouldRetry =
      code === "ECONNABORTED" || // Retry on timeout
      code === "ERR_CANCELED" || // Retry on canceled
      code === "ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC" ||
      (response &&
        (response.status === 429 ||
          response.status === 400 ||
          response.status === 500)); // Retry on 429, 400, 500
    console.log("shouldRetry:", shouldRetry, code);

    if (config && shouldRetry && __retryCount < maxRetries) {
      (config as any)["__retryCount"] = __retryCount;
      (config as any)["__retryCount"] += 1;

      await sleep(retryDelay);
      console.log("...try another time....", __retryCount);

      if (code === "ERR_CANCELED") {
        console.log("retrying due to cancellation...setting up new timeout");
        // Set a new AbortController for each retry attempt
        const controller = new AbortController();
        config.signal = controller.signal;

        // Automatically abort this retry if it takes longer than 15 seconds
        (timeoutId as unknown as NodeJS.Timeout) = setTimeout(() => {
          console.log("aborting retry due to timeout...");
          controller.abort();
        }, timeout);
      }

      if (__retryCount > 0 && __retryCount % 2 === 0) {
        const next = iterator.next().value;
        console.log("Next proxy:", next!.proxy.host);
        config.httpAgent = next;
        config.httpsAgent = next;
      }
      try {
        return await aznApi(config);
      } finally {
        // Clear the timeout after each retry attempt
        clearTimeout(timeoutId);
      }
    }

    return Promise.reject(error);
  }
);

function errorHandler(error: unknown) {
  if (error instanceof AxiosError) {
    const cause = error.cause;
    if (cause) {
      if (
        cause.message.includes(
          "Proxy connection ended before receiving CONNECT response"
        )
      ) {
        console.log("CONNECT response error");
      } else if (
        cause.message.includes(
          "Client network socket disconnected before secure TLS connection was established"
        )
      ) {
        console.log("TLS connection error");
      } else {
        console.log("Axios Error", error);
      }
    } else {
      // console.log("Axios Error ", error);
      if (error.response?.status === 400) {
        console.log("Bad Request");
      } else if (error.response?.status === 429) {
        console.log("Too Many Requests");
      } else {
        console.log("Other Axios Error", error.message, error.response?.status);
      }
    }
  } else if (error instanceof Error) {
    console.log("Unknown Error", error);
  }
}

export const scAdditionalProductInfo = async (
  asin: string,
  countryCode: string = "DE",
  locale: string = "de-DE"
) => {
  const abortController = new AbortController();

  const _timeout = setTimeout(() => {
    console.log("abort...");
    abortController.abort();
  }, timeout);

  try {
    return await aznApi.get<AdditionalProductInfoResponse>(
      `/rcpublic/getadditionalpronductinfo`,
      {
        signal: abortController.signal,
        params: {
          asin: asin,
          countryCode,
          fnsku: "",
          locale,
        },
      }
    );
  } catch (error) {
    errorHandler(error);
  } finally {
    clearTimeout(_timeout);
  }
};

export const scProductMatch = async (
  asin: string,
  countryCode: string = "DE",
  locale: string = "de-DE"
) => {
  const abortController = new AbortController();

  const _timeout = setTimeout(() => {
    console.log("abort...");
    abortController.abort();
  }, timeout);

  try {
    return await aznApi.get<ProductMatchResponse>(`/rcpublic/productmatch`, {
      signal: abortController.signal,
      params: {
        searchKey: asin,
        countryCode,
        locale,
      },
    });
  } catch (error) {
    errorHandler(error);
  } finally {
    clearTimeout(_timeout);
  }
};

export const scFeeFinder = async (
  asin: string,
  glProductGroupName: string,
  sellPrice: number,
  countryCode: string = "DE",
  locale: string = "de-DE"
) => {
  const abortController = new AbortController();

  const _timeout = setTimeout(() => {
    console.log("abort...");
    abortController.abort();
  }, timeout);

  const request = FeeFinderRequestBuilder(
    asin,
    countryCode,
    glProductGroupName,
    sellPrice.toString()
  );
  try {
    return await aznApi.post<FeeFinderResponse>(`/rcpublic/getfees`, request, {
      signal: abortController.signal,
      params: {
        countryCode,
        locale,
      },
    });
  } catch (error) {
    errorHandler(error);
  } finally {
    clearTimeout(_timeout);
  }
};

export const scNewFeeFinder = async (
  tRexId: string,
  sellPrice: number,
  dimensions: Dimensions,
  countryCode: string = "DE",
  locale: string = "de-DE"
) => {
  const abortController = new AbortController();

  const _timeout = setTimeout(() => {
    console.log("abort...");
    abortController.abort();
  }, timeout);

  const request = NewFeeFinderRequestBuilder(
    tRexId,
    sellPrice.toString(),
    dimensions,
    countryCode
  );
  try {
    return await aznApi.post<NewFeeFinderResponse>(
      `/rcpublic/getfeeswithnew`,
      request,
      {
        signal: abortController.signal,
        params: {
          countryCode,
          locale,
        },
      }
    );
  } catch (error) {
    errorHandler(error);
  } finally {
    clearTimeout(_timeout);
  }
};
