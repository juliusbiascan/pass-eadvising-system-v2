"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { KeyRoundIcon, Loader2Icon, MailIcon } from "lucide-react";

import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { CardWrapper } from "@/features/auth/components/card-wrapper";
import { PasswordInput } from "@/features/auth/components/password-input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { login } from "@/actions/login";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with a different provider."
      : "";

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            reset();
            setError(data.error);
          }

          if (data?.success) {
            reset();
            setSuccess(data.success);
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch((e) => {
          if (e.message?.includes("NEXT_REDIRECT")) {
            return;
          }
          setError("Something went wrong. Please try again.");
        });
    });
  };

  return (
    <>
      <span
        className="pointer-events-none fixed top-4 right-4 z-40 select-none font-heading text-sm font-semibold tracking-wide text-(--pass-red)/50 dark:text-(--pass-gold)/45"
        aria-hidden
      >
        v2
      </span>
      <CardWrapper
        title={showTwoFactor ? "Two-factor authentication" : "Sign in"}
        description={
          showTwoFactor
            ? "Enter the 6-digit code from your authenticator app."
            : "Use your school email and password to access your account."
        }
      >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          {showTwoFactor ? (
            <Field>
              <FieldLabel htmlFor="code">Verification code</FieldLabel>
              <div className="auth-input-wrap relative">
                <KeyRoundIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="code"
                  {...register("code")}
                  disabled={isPending}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="h-11 bg-background/80 pl-10 tracking-widest"
                />
              </div>
              <FieldError errors={[errors.code]} />
            </Field>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <div className="auth-input-wrap relative">
                  <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    {...register("email")}
                    disabled={isPending}
                    placeholder="you@school.edu"
                    type="email"
                    autoComplete="email"
                    className="h-11 bg-background/80 pl-10"
                  />
                </div>
                <FieldError errors={[errors.email]} />
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Button
                    size="sm"
                    variant="link"
                    asChild
                    className="h-auto px-0 text-xs text-muted-foreground transition-colors hover:text-(--pass-red)"
                  >
                    <Link href="/auth/reset">Forgot password?</Link>
                  </Button>
                </div>
                <PasswordInput
                  id="password"
                  {...register("password")}
                  disabled={isPending}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <FieldError errors={[errors.password]} />
              </Field>
            </>
          )}
        </div>

        <FormError message={error || urlError} />
        <FormSuccess message={success} />

        <Button disabled={isPending} type="submit" className="auth-submit h-11 w-full" size="lg">
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {showTwoFactor ? "Verifying…" : "Signing in…"}
            </>
          ) : showTwoFactor ? (
            "Verify code"
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      </CardWrapper>
    </>
  );
};
