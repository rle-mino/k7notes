import { test as base, APIRequestContext } from "@playwright/test";

/**
 * API test fixture providing typed request helpers for testing the K7Notes API.
 * Extends Playwright's base test with an `api` fixture pre-configured for the API base URL.
 */

export interface ApiFixture {
  /**
   * The Playwright API request context configured for the K7Notes API.
   */
  request: APIRequestContext;

  /**
   * Make a GET request to the API.
   * @param path - The API path (e.g., "/health")
   * @param options - Optional request options
   */
  get: <T = unknown>(
    path: string,
    options?: { headers?: Record<string, string> }
  ) => Promise<{ status: number; data: T }>;

  /**
   * Make a POST request to the API.
   * @param path - The API path
   * @param data - Request body data
   * @param options - Optional request options
   */
  post: <T = unknown>(
    path: string,
    data?: unknown,
    options?: { headers?: Record<string, string> }
  ) => Promise<{ status: number; data: T }>;

  /**
   * Make a PUT request to the API.
   * @param path - The API path
   * @param data - Request body data
   * @param options - Optional request options
   */
  put: <T = unknown>(
    path: string,
    data?: unknown,
    options?: { headers?: Record<string, string> }
  ) => Promise<{ status: number; data: T }>;

  /**
   * Make a DELETE request to the API.
   * @param path - The API path
   * @param options - Optional request options
   */
  delete: <T = unknown>(
    path: string,
    options?: { headers?: Record<string, string> }
  ) => Promise<{ status: number; data: T }>;
}

/**
 * Extended test fixture with API helpers.
 * Use this for API-only tests that don't need browser interaction.
 */
export const test = base.extend<{ api: ApiFixture }>({
  api: async ({ request }, use) => {
    const makeRequest = async <T>(
      method: "get" | "post" | "put" | "delete",
      path: string,
      data?: unknown,
      options?: { headers?: Record<string, string> }
    ): Promise<{ status: number; data: T }> => {
      const url = path.startsWith("/") ? path : `/${path}`;

      const requestOptions: Parameters<typeof request.get>[1] = {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      };

      if (data !== undefined && (method === "post" || method === "put")) {
        requestOptions.data = data;
      }

      const response = await request[method](url, requestOptions);
      const status = response.status();

      let responseData: T;
      try {
        responseData = await response.json();
      } catch {
        responseData = (await response.text()) as unknown as T;
      }

      return { status, data: responseData };
    };

    const api: ApiFixture = {
      request,
      get: <T>(path: string, options?: { headers?: Record<string, string> }) =>
        makeRequest<T>("get", path, undefined, options),
      post: <T>(
        path: string,
        data?: unknown,
        options?: { headers?: Record<string, string> }
      ) => makeRequest<T>("post", path, data, options),
      put: <T>(
        path: string,
        data?: unknown,
        options?: { headers?: Record<string, string> }
      ) => makeRequest<T>("put", path, data, options),
      delete: <T>(
        path: string,
        options?: { headers?: Record<string, string> }
      ) => makeRequest<T>("delete", path, undefined, options),
    };

    await use(api);
  },
});

export { expect } from "@playwright/test";
