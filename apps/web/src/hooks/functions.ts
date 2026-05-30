import { auth } from "@clinic-app/auth";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import {
  getRequest,
  getRequestHeaders,
  setResponseHeader,
} from "@tanstack/react-start/server";

export const $getUser = createServerFn({ method: "GET" }).handler(async () => {
  const user = await _getUser();
  return user;
});

type GetUserServerQuery = {
  disableCookieCache?: boolean | undefined;
  disableRefresh?: boolean | undefined;
};

export const _getUser = createServerOnlyFn(
  async (query?: GetUserServerQuery) => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
      query,
      returnHeaders: true,
    });

    // Forward any Set-Cookie headers to the client, e.g. for session/cache refresh
    const cookies = session.headers?.getSetCookie();
    if (cookies?.length) {
      setResponseHeader("Set-Cookie", cookies);
    }

    return session.response?.user ?? null;
  },
);
/**
 * Shared logic for session retrieval.
 * Kept as a standard function to avoid TanStack Start compiler collisions.
 * This should only be called within a server context (e.g., createServerFn).
 */

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const headers = getRequestHeaders();
    return await auth.api.getSession({ headers });
  },
);
export const ensureSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });
    if (!session) throw new Error("Unauthorized");
    return session;
  },
);

export const authQueryOptions = () =>
  queryOptions({
    queryKey: ["auth"],
    queryFn: ({ signal }) => $getUser({ signal }),
  });

export type AuthQueryResult = Awaited<ReturnType<typeof $getUser>>;
