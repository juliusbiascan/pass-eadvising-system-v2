"use client";

import * as z from "zod/v4";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeClosedIcon } from "lucide-react";

import { RegisterSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { CardWrapper } from "@/features/auth/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { register } from "@/actions/register";

export const SetupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register: formRegister,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      register(values)
        .then((data) => {
          if (data.error) {
            setError(data.error);
          }

          if (data.success) {
            reset();
            setSuccess(data.success);
          }
        })
        .catch(() => {
          setError("Something went wrong");
        });
    });
  };

  return (
    <CardWrapper
      title="Initial System Setup"
      backButtonLabel="Already have an account? Login"
      backButtonHref="/auth/login"
    >
      <div className="auth-scale-in mb-4 rounded-xl border border-(--pass-gold)/30 bg-(--pass-gold)/12 p-3 text-center">
        <p className="text-xs font-medium text-(--pass-cod) sm:text-sm dark:text-(--pass-gold)">
          No users found yet. Create the first root administrator account to get started.
        </p>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-6"
      >
        <div className="space-y-3 sm:space-y-4">
          <Field>
            <FieldLabel htmlFor="username" className="text-sm">
              Username
            </FieldLabel>
            <Input
              id="username"
              {...formRegister("username")}
              disabled={isPending}
              placeholder="admin"
              className="h-10 sm:h-11"
            />
            <FieldError errors={[errors.username]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="email" className="text-sm">
              Email
            </FieldLabel>
            <Input
              id="email"
              {...formRegister("email")}
              disabled={isPending}
              placeholder="admin@example.com"
              type="email"
              className="h-10 sm:h-11"
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="password" className="text-sm">
              Password
            </FieldLabel>
            <div className="relative">
              <Input
                id="password"
                {...formRegister("password")}
                disabled={isPending}
                placeholder="******"
                type={showPassword ? "text" : "password"}
                className="h-10 sm:h-11 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 sm:h-11 px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
              >
                {showPassword ? (
                  <EyeClosedIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
            <FieldError errors={[errors.password]} />
          </Field>
        </div>
        <FormError message={error} />
        <FormSuccess message={success} />
        <Button
          disabled={isPending}
          type="submit"
          className="auth-submit h-10 w-full text-sm sm:h-11 sm:text-base"
        >
          Create Root Admin Account
        </Button>
      </form>
    </CardWrapper>
  );
};
