"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, MailIcon } from "lucide-react";

import { ResetSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { CardWrapper } from "@/features/auth/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { reset } from "@/actions/reset";

export const ResetForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ResetSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      reset(values).then((data) => {
        setError(data?.error);
        setSuccess(data?.success);
      });
    });
  };

  return (
    <CardWrapper
      title="Reset password"
      description="Enter the email linked to your account. We'll send you a link to choose a new password."
      backButtonLabel="Back to sign in"
      backButtonHref="/auth/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <FormError message={error} />
        <FormSuccess message={success} />

        <Button disabled={isPending} type="submit" className="auth-submit h-11 w-full" size="lg">
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Sending link…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </CardWrapper>
  );
};
