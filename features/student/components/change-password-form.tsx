"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2Icon, ShieldCheck } from "lucide-react";

import { changePassword } from "@/actions/change-password";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { PasswordInput } from "@/features/auth/components/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { ChangePasswordSchema } from "@/schemas";

type FormValues = z.infer<typeof ChangePasswordSchema>;

interface ChangePasswordFormProps {
  audience?: "student" | "staff";
}

export function ChangePasswordForm({
  audience = "student",
}: ChangePasswordFormProps) {
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setError("");

    startTransition(() => {
      changePassword(values)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
          }
        })
        .catch((error: { digest?: string; message?: string }) => {
          if (
            error?.digest?.startsWith("NEXT_REDIRECT") ||
            error?.message?.includes("NEXT_REDIRECT")
          ) {
            throw error;
          }
          setError("Something went wrong. Please try again.");
        });
    });
  };

  return (
    <div className="student-portal-main student-portal-fade-up mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-12">
      <Alert className="mb-5 border-(--pass-gold)/40 bg-card">
        <ShieldCheck />
        <AlertTitle>Password change required</AlertTitle>
        <AlertDescription>
          You signed in with a temporary password from your registration email.
          Choose a new password to continue to the{" "}
          {audience === "staff" ? "dashboard" : "student portal"}.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-(--pass-red)" />
            Set a new password
          </CardTitle>
          <CardDescription>
            Use at least 6 characters. Do not reuse the temporary password that
            was emailed to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="currentPassword">
                  Temporary password
                </FieldLabel>
                <PasswordInput
                  id="currentPassword"
                  {...register("currentPassword")}
                  disabled={isPending}
                  placeholder="Password from your email"
                  autoComplete="current-password"
                />
                <FieldError errors={[errors.currentPassword]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <PasswordInput
                  id="password"
                  {...register("password")}
                  disabled={isPending}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <FieldError errors={[errors.password]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm new password
                </FieldLabel>
                <PasswordInput
                  id="confirmPassword"
                  {...register("confirmPassword")}
                  disabled={isPending}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                />
                <FieldError errors={[errors.confirmPassword]} />
              </Field>
            </FieldGroup>

            <FormError message={error} />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <LogoutButton>
                <Button type="button" variant="outline" disabled={isPending}>
                  Sign out
                </Button>
              </LogoutButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save and continue"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
