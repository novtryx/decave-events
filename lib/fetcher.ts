const BASE_URL = process.env.API_URL!;

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: HeadersInit;
  timeout?: number;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
};

export class ApiError extends Error {
  statusCode: number;
  error: string;

  constructor(message: string, statusCode: number, error: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
  }
}

export async function fetcher<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, body, headers, cache, next, ...rest } = options;

  if (!BASE_URL) {
    throw new ApiError("API_URL environment variable is not set", 500, "Configuration Error");
  }

  const fullUrl = `${BASE_URL}${url}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const isFormData = body instanceof FormData;

  try {
    const res = await fetch(fullUrl, {
      ...rest,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache,
      next,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorData: any;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: await res.text(), statusCode: res.status, error: res.statusText };
      }

      // 👇 log on the server so it shows in Vercel runtime logs
      console.error(`[API Error] ${options.method ?? "GET"} ${fullUrl}`, {
        statusCode: errorData.statusCode ?? res.status,
        message: errorData.message,
        error: errorData.error,
      });

      throw new ApiError(
        errorData.message || "Something went wrong",
        errorData.statusCode ?? res.status,
        errorData.error ?? res.statusText,
      );
    }

    return res.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new ApiError(`Request timed out after ${timeout}ms`, 408, "Timeout");
    }
    throw error;
  }
}