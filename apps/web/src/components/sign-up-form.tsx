// components/sign-up-form.tsx

import { Button } from "@clinic-app/ui/components/button";
import { Input } from "@clinic-app/ui/components/input";
import { Label } from "@clinic-app/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const navigate = useNavigate({ from: "/" });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      // Check if passwords match
      if (value.password !== value.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      try {
        await authClient.signUp.email(
          {
            email: value.email,
            password: value.password,
            name: value.name,
          },
          {
            onSuccess: (context) => {
              console.log("Sign up successful:", context);
              toast.success(
                "Account created successfully! Welcome to Pediatric Care Clinic.",
              );
              navigate({ to: "/dashboard" });
            },
            onError: (error) => {
              console.error("Sign up error:", error);
              toast.error(
                error.error?.message ||
                  "Failed to create account. Please try again.",
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
      onSubmit: z
        .object({
          name: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must be less than 100 characters"),
          email: z
            .string()
            .email("Invalid email address")
            .min(5, "Email must be at least 5 characters"),
          password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
              /[A-Z]/,
              "Password must contain at least one uppercase letter",
            )
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(
              /[^a-zA-Z0-9]/,
              "Password must contain at least one special character",
            ),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-3xl">Create Account</h1>
        <p className="text-muted-foreground">
          Join Pediatric Care Clinic to manage your patients
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
        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Full Name</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                placeholder="Dr. John Doe"
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
              <Label htmlFor={field.name}>Password</Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                placeholder="Create a strong password"
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
              <p className="text-muted-foreground text-xs">
                Password must contain at least 8 characters, one uppercase
                letter, one number, and one special character
              </p>
            </div>
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Confirm Password</Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                placeholder="Confirm your password"
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
                  <span className="mr-2">Creating account...</span>
                  <Loader />
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-medium text-primary hover:underline"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
