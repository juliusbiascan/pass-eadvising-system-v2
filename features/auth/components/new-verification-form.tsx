"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";

import { newVerification } from "@/actions/new-verification";
import { CardWrapper } from "@/features/auth/components/card-wrapper";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const hasAttemptedVerification = useRef(false);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const isLoading = !success && !error;

  useEffect(() => {
    if (hasAttemptedVerification.current) return;

    hasAttemptedVerification.current = true;

    if (!token) {
      setTimeout(() => setError("Verification link is invalid or has expired."), 0);
      return;
    }

    newVerification(token)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => {
        setError("Something went wrong. Please request a new verification email.");
      });
  }, [token]);

  return (
    <CardWrapper
      title="Email verification"
      description="We're confirming your email address. This only takes a moment."
      backButtonLabel="Back to sign in"
      backButtonHref="/auth/login"
    >
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        {isLoading ? (
          <>
            <div className="auth-scale-in flex size-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Loader2Icon className="size-8 animate-spin text-primary" aria-hidden />
            </div>
            <p className="text-sm text-muted-foreground">Verifying your email…</p>
          </>
        ) : success ? (
          <>
            <div className="auth-scale-in flex size-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/20">
              <CheckCircle2Icon className="size-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </div>
            <FormSuccess message={success} />
          </>
        ) : (
          <>
            <div className="auth-scale-in flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
              <XCircleIcon className="size-8 text-destructive" aria-hidden />
            </div>
            <FormError message={error} />
          </>
        )}
      </div>
    </CardWrapper>
  );
};
