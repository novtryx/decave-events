import { fetcher } from "./fetcher";
import { getAccessToken, getInfluencerAccessToken } from "./authCookies";

export async function protectedFetch<T>(
  url: string,
  options?: Parameters<typeof fetcher>[1]
) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  return fetcher<T>(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function influencerProtectedFetch<T>(
  url: string,
  options?: Parameters<typeof fetcher>[1]
) {
  const token = await getInfluencerAccessToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  return fetcher<T>(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}


