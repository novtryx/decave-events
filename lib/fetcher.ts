const BASE_URL = process.env.API_URL!;

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: HeadersInit;
  timeout?: number;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
};

export async function fetcher<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, body, headers, cache, next, ...rest } = options;

  if (!BASE_URL) {
    throw new Error("API_URL environment variable is not set");
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
    errorData = { message: await res.text() };
  }

  const error = new Error(
    errorData.message || "Something went wrong"
  ) as any;

  error.statusCode = errorData.statusCode;
  error.error = errorData.error;

  throw error;
}

    return res.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}
