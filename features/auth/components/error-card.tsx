"use client";

import { AlertTriangleIcon } from "lucide-react";

import { CardWrapper } from "@/features/auth/components/card-wrapper";

export const ErrorCard = () => {
  return (
    <CardWrapper
      title="Authentication error"
      description="We couldn't complete your sign-in request. Please try again or contact support if the problem continues."
      backButtonLabel="Back to sign in"
      backButtonHref="/auth/login"
    >
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="auth-scale-in flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangleIcon className="size-8 text-destructive" aria-hidden />
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your session may have expired, or the sign-in provider returned an unexpected
          response.
        </p>
      </div>
    </CardWrapper>
  );
};
