import { fetcher } from "./fetcher";

export function authFetch<T>(
  url: string,
  options?: Parameters<typeof fetcher>[1]
) {
  return fetcher<T>(url, {
    cache: "no-store", // ❗ disable caching
    ...options,
  });
}
