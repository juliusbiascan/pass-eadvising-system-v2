"use client";

import * as z from "zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

import { registerAdmin } from "@/actions/register-admin";
import { AdminRegistrationSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

type FormValues = z.infer<typeof AdminRegistrationSchema>;

const AdminForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(AdminRegistrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      registerAdmin({
        fullName: values.fullName,
        email: values.email,
      }).then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }

        if (data?.success) {
          setSuccess(data.success);
          router.push("/dashboard/teams");
          router.refresh();
        }
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Admin identity</CardTitle>
          <CardDescription>
            These details create the administrator record and the dashboard
            login account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
              <Input
                id="fullName"
                placeholder="Maria Santos"
                autoComplete="name"
                disabled={isPending}
                {...register("fullName")}
              />
              <FieldDescription>
                Enter the name as it should appear on the team list.
              </FieldDescription>
              <FieldError errors={[errors.fullName]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="admin@email.com"
                autoComplete="email"
                disabled={isPending}
                {...register("email")}
              />
              <FieldDescription>
                Login credentials will be sent to this address.
              </FieldDescription>
              <FieldError errors={[errors.email]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Alert>
        <Mail />
        <AlertTitle>Dashboard account</AlertTitle>
        <AlertDescription>
          An administrator account will be created automatically. A temporary
          password will be emailed so they can sign in. They must change that
          password before they can use the dashboard. They will not be Root —
          only the first setup admin has that badge.
        </AlertDescription>
      </Alert>

      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="outline" type="button" disabled={isPending}>
          <Link href="/dashboard/teams">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Registering..." : "Register Admin"}
        </Button>
      </div>
    </form>
  );
};

export default AdminForm;
