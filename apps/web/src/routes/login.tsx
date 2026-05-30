// login.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Baby, Heart } from "lucide-react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-linear-to-br from-blue-50/50 via-white to-cyan-50/30 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      <div className="container mx-auto flex max-w-5xl flex-col-reverse overflow-hidden rounded-2xl border bg-card shadow-xl lg:flex-row">
        {/* Left side - Branding */}
        <div className="flex flex-1 flex-col justify-between bg-linear-to-br from-blue-600 to-cyan-600 p-8 text-white lg:p-12">
          <div>
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Heart className="h-6 w-6 fill-white/30" />
            </div>
            <h2 className="mb-3 font-bold text-2xl">
              Welcome to Smart Clinic Pediatrics
            </h2>
            <p className="text-blue-100">
              Secure access to intelligent pediatric care management. Access
              patient records, track growth, and manage immunizations all in one
              place.
            </p>
          </div>
          <div className="mt-8 hidden lg:block">
            <div className="flex gap-1 text-blue-200 text-xs">
              <Baby className="h-3 w-3" />
              <span>HIPAA Compliant • SOC 2 Certified • 24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Right side - Forms */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12">
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
