"use client";

import * as z from "zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Mail } from "lucide-react";

import { StudentRegistrationSchema } from "@/schemas";
import { registerStudent } from "@/actions/register-student";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import CurriculumPicker, {
  type CurriculumOption,
} from "./curriculum-picker";

type FormInput = z.input<typeof StudentRegistrationSchema>;
type FormValues = z.output<typeof StudentRegistrationSchema>;

interface RegisterStudentFormProps {
  curriculums: CurriculumOption[];
}

const YEAR_LEVELS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
] as const;

const RegisterStudentForm = ({ curriculums }: RegisterStudentFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(StudentRegistrationSchema),
    defaultValues: {
      studentId: "",
      email: "",
      fullName: "",
      yearLevel: 1,
      curriculumId:
        curriculums.length === 1 ? curriculums[0].id : "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      registerStudent(values).then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }

        if (data?.success) {
          setSuccess(data.success);
          router.push("/dashboard/students");
          router.refresh();
        }
      });
    });
  };

  const hasCurriculums = curriculums.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      {!hasCurriculums && (
        <Alert>
          <GraduationCap />
          <AlertTitle>No curriculum available</AlertTitle>
          <AlertDescription>
            Create a curriculum first so the student can be assigned to a
            program.{" "}
            <Link href="/dashboard/curriculum/create">Create curriculum</Link>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Student identity</CardTitle>
          <CardDescription>
            These details create the student record and the portal login
            account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="studentId">Student ID</FieldLabel>
                <Input
                  id="studentId"
                  placeholder="e.g. 26-00001"
                  autoComplete="off"
                  disabled={isPending}
                  {...register("studentId")}
                />
                <FieldDescription>
                  Official school ID. This must be unique.
                </FieldDescription>
                <FieldError errors={[errors.studentId]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  placeholder="Juan Dela Cruz"
                  autoComplete="name"
                  disabled={isPending}
                  {...register("fullName")}
                />
                <FieldDescription>
                  Enter the complete name as it appears in school records.
                </FieldDescription>
                <FieldError errors={[errors.fullName]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="student@email.com"
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

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Academic placement</CardTitle>
          <CardDescription>
            Set the student&apos;s year level, then choose a program and
            curriculum batch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field className="max-w-xs">
              <FieldLabel>Year Level</FieldLabel>
              <input type="hidden" {...register("yearLevel")} />
              <Select
                value={String(watch("yearLevel") || 1)}
                onValueChange={(value) => {
                  setValue("yearLevel", Number(value), {
                    shouldValidate: true,
                  });
                }}
                disabled={isPending}
              >
                <SelectTrigger id="yearLevel" className="w-full h-10">
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_LEVELS.map((level) => (
                    <SelectItem
                      key={level.value}
                      value={String(level.value)}
                    >
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.yearLevel]} />
            </Field>

            <div className="space-y-2">
              <input type="hidden" {...register("curriculumId")} />
              <CurriculumPicker
                curriculums={curriculums}
                value={watch("curriculumId")}
                onChange={(curriculumId) => {
                  setValue("curriculumId", curriculumId, {
                    shouldValidate: true,
                  });
                }}
                disabled={isPending}
                error={errors.curriculumId}
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Alert>
        <Mail />
        <AlertTitle>Portal account</AlertTitle>
        <AlertDescription>
          A student portal account will be created automatically. A temporary
          password will be emailed so the student can sign in. They must change
          that password before they can use the portal.
        </AlertDescription>
      </Alert>

      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="outline" type="button" disabled={isPending}>
          <Link href="/dashboard/students">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending || !hasCurriculums}>
          {isPending ? "Registering..." : "Register Student"}
        </Button>
      </div>
    </form>
  );
};

export default RegisterStudentForm;
