// components/sign-in-form.tsx

import { Button } from "@clinic-app/ui/components/button";
import { Input } from "@clinic-app/ui/components/input";
import { Label } from "@clinic-app/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";

export default function SignInForm({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const navigate = useNavigate({ from: "/" });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.signIn.email(
          {
            email: value.email,
            password: value.password,
          },
          {
            onSuccess: (context) => {
              console.log("Sign in successful:", context);
              navigate({ to: "/dashboard" });
              toast.success("Welcome back! Successfully signed in.");
            },
            onError: (error) => {
              console.error("Sign in error:", error);
              toast.error(
                error.error?.message ||
                  "Failed to sign in. Please check your credentials.",
              );
            },
          },
        );
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-3xl">Welcome Back</h1>
        <p className="text-muted-foreground">
          Sign in to access your pediatric clinic dashboard
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email Address</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="doctor@pediatricclinic.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-destructive text-sm">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>Password</Label>
                <button
                  type="button"
                  className="text-primary text-sm hover:underline"
                  onClick={() => {
                    // Add forgot password logic
                    toast.info(
                      "Password reset link will be sent to your email",
                    );
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                placeholder="Enter your password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-destructive text-sm">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? (
                <>
                  <span className="mr-2">Signing in...</span>
                  <Loader />
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
