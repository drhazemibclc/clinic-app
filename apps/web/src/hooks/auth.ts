import { authClient } from "@clinic-app/auth/client";
import {
  queryOptions,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getSession as $getSession,
  $getUser,
  authQueryOptions,
} from "./functions";

export type AuthUser = {
  clinicId?: string | null;
  email: string;
  id: string;
  image?: string;
  name?: string | null;
  // Based on your error message, your user also has these:
  primaryClinic?: {
    userId: string;
    role: UserRole | null;
    userName: string | null;
  };
  role?: UserRole;
};

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
};

const AUTH_KEYS = {
  session: ["auth", "session"],
  user: ["auth", "user"],
} as const;

/**
 * Client-side bridge to the server-side getSession function.
 */
export const getSession = async () => await $getSession();

export type UserRole = "admin" | "doctor" | "patient" | "staff";

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: session,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: AUTH_KEYS.session,
    queryFn: async () => {
      const session = await $getSession();

      if (!session) {
        throw new Error("No session");
      }
      return session;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: user, isPending } = useQuery(authQueryOptions());
  const signOut = async () => {
    try {
      await authClient.signOut();
      await queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session });
      queryClient.removeQueries({ queryKey: AUTH_KEYS.session });
      queryClient.removeQueries({ queryKey: AUTH_KEYS.user });
      navigate({ to: "/login" });
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error(error);
    }
  };
  const refreshSession = async () => {
    await refetch();
  };

  const getUserInitials = () => {
    const name = session?.user?.name;
    if (!name) {
      return "U";
    }
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  return {
    isPending,
    user: user ?? null,
    isAuthenticated: !!session?.user,
    isLoading,
    error,
    signOut,
    refreshSession,
    getUserInitials,
  };
}

export function useAuthSuspense() {
  const { data: user } = useSuspenseQuery(authQueryOptions());
  if (!user) {
    throw new Error("Unauthorized");
  }
  return { user };
}

export const ensureSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await $getSession(); // Use the existing bridge

    if (!session) {
      throw new Error("Unauthorized");
    }
    return session;
  },
);

export const signOut = async () => {
  await authClient.signOut();
};

export const authQueryKeys = {
  user: ["user"],
};

export function getAuthUserQueryOptions() {
  return queryOptions({
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    queryKey: authQueryKeys.user,
    queryFn: () => $getUser(),
  });
}
