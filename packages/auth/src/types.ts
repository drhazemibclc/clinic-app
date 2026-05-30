import type { auth } from "./index";

export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session;
export type User = AuthSession["user"];
export type UserRole = (typeof auth.$Infer.Session)["user"]["role"];
