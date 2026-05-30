import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, admin, doctor, patient, staff } from "./permissions";
import type { Auth } from "./types";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: process.env.VITE_BASE_URL,
    plugins: [
      adminClient({
        ac,
        roles: { staff, admin, patient, doctor },
      }),
      inferAdditionalFields<Auth>(),
    ],
  },
);

export type Session = typeof authClient.$Infer.Session;

export const { signIn, signOut, useSession } = authClient;

export const useAuth = () => {
  const { data, isPending, error } = useSession();
  const isAuthenticated = !!data?.user;
  const user = data?.user;

  return {
    isAuthenticated,
    user,
    isPending, // Good for showing loading states
    error, // Good for error handling
  };
};

export type AuthClientUser = (typeof authClient.$Infer.Session)["user"];
export type AuthClientSession = typeof authClient.$Infer.Session;
export type AuthClient = typeof authClient;
