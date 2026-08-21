"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";

import { NewPasswordSchema } from "@/schemas";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { CardWrapper } from "@/features/auth/components/card-wrapper";
import { PasswordInput } from "@/features/auth/components/password-input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { newPassword } from "@/actions/new-password";

export const NewPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      newPassword(values, token).then((data) => {
        setError(data?.error);
        setSuccess(data?.success);
      });
    });
  };

  return (
    <CardWrapper
      title="Create new password"
      description="Choose a strong password you haven't used before on this account."
      backButtonLabel="Back to sign in"
      backButtonHref="/auth/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            {...register("password")}
            disabled={isPending}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <FormError message={error} />
        <FormSuccess message={success} />

        <Button disabled={isPending} type="submit" className="auth-submit h-11 w-full" size="lg">
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </CardWrapper>
  );
};
