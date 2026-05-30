import { auth } from "@clinic-app/auth";
import type {
  AuthSession,
  User as AuthUser,
  UserRole,
} from "@clinic-app/auth/types";
import { db } from "@clinic-app/db";

export type Context = {
  headers: Headers;
  db: typeof db;
  auth: typeof auth;
  session: AuthSession | null;
  user: AuthUser | null;
  clinicId: string | null;
  isAuthorized: (requiredRole: UserRole) => boolean;
};

export async function createContext(opts: { req: Request }): Promise<Context> {
  const headers = opts.req.headers;
  const session = await auth.api.getSession({ headers });
  const user = session?.user ?? null;
  const clinicId = user?.clinicId ?? null;

  return {
    headers,
    db,
    auth,
    session,
    user,
    clinicId,
    isAuthorized: (requiredRole: UserRole) =>
      user?.role === "admin" || user?.role === requiredRole,
  };
}
