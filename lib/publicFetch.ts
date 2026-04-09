import { fetcher } from "./fetcher";

export function publicFetch<T>(
  url: string,
  options?: Parameters<typeof fetcher>[1]
) {
  return fetcher<T>(url, {
    next: { revalidate: 60 },
    ...options,
  });
}