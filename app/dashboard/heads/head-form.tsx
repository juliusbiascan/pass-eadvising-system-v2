"use client";

import * as z from "zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail } from "lucide-react";

import { registerHead } from "@/actions/register-head";
import { updateHead } from "@/actions/update-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { CourseOption } from "@/lib/courses";

const HeadFormSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(3, {
    message: "Full name must be at least 3 characters",
  }),
  email: z.string().email({
    message: "Valid email is required",
  }),
  courseIds: z.array(z.string().min(1)).min(1, {
    message: "Assign at least one department",
  }),
});

type FormValues = z.infer<typeof HeadFormSchema>;

export type HeadFormCourse = CourseOption;

interface HeadFormProps {
  courses: HeadFormCourse[];
  mode: "register" | "edit";
  head?: {
    id: string;
    fullName: string;
    email: string;
    courseIds: string[];
  };
}

const HeadForm = ({ courses, mode, head }: HeadFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(HeadFormSchema),
    defaultValues: {
      id: head?.id ?? "",
      fullName: head?.fullName ?? "",
      email: head?.email ?? "",
      courseIds: head?.courseIds ?? [],
    },
  });

  const selectedCourseIds = watch("courseIds") ?? [];

  const toggleCourse = (courseId: string, checked: boolean) => {
    const next = checked
      ? [...selectedCourseIds, courseId]
      : selectedCourseIds.filter((id) => id !== courseId);
    setValue("courseIds", next, { shouldValidate: true });
  };

  const onSubmit = (values: FormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      const request = isEdit
        ? updateHead({
            id: values.id || head?.id || "",
            fullName: values.fullName,
            email: values.email,
            courseIds: values.courseIds,
          })
        : registerHead({
            fullName: values.fullName,
            email: values.email,
            courseIds: values.courseIds,
          });

      request.then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }

        if (data?.success) {
          setSuccess(data.success);
          router.push("/dashboard/heads");
          router.refresh();
        }
      });
    });
  };

  const hasCourses = courses.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      {!hasCourses && (
        <Alert>
          <Building2 />
          <AlertTitle>No departments available</AlertTitle>
          <AlertDescription>
            Create a course first so the head can be assigned to a department.{" "}
            <Link href="/dashboard/courses">Manage courses</Link>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Head identity</CardTitle>
          <CardDescription>
            These details create the department head record and the dashboard
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
                Enter the complete name as it should appear on evaluations.
              </FieldDescription>
              <FieldError errors={[errors.fullName]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="head@email.com"
                autoComplete="email"
                disabled={isPending}
                {...register("email")}
              />
              <FieldDescription>
                {isEdit
                  ? "This email is used to sign in to the dashboard."
                  : "Login credentials will be sent to this address."}
              </FieldDescription>
              <FieldError errors={[errors.email]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Assigned departments</CardTitle>
          <CardDescription>
            The head can only view the dashboard, students, and records for
            these courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <div className="grid gap-3 sm:grid-cols-2">
                {courses.map((course) => {
                  const checked = selectedCourseIds.includes(course.id);

                  return (
                    <label
                      key={course.id}
                      htmlFor={`course-${course.id}`}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-disabled:opacity-50"
                    >
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={checked}
                        disabled={isPending || !course.isActive}
                        onCheckedChange={(value) =>
                          toggleCourse(course.id, value === true)
                        }
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {course.code}
                          {!course.isActive ? " (inactive)" : ""}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {course.title}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <FieldError errors={[errors.courseIds]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {!isEdit && (
        <Alert>
          <Mail />
          <AlertTitle>Dashboard account</AlertTitle>
          <AlertDescription>
            A department head account will be created automatically. A temporary
            password will be emailed so they can sign in. They must change that
            password before they can use the dashboard.
          </AlertDescription>
        </Alert>
      )}

      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="outline" type="button" disabled={isPending}>
          <Link href="/dashboard/heads">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending || !hasCourses}>
          {isPending
            ? isEdit
              ? "Saving..."
              : "Registering..."
            : isEdit
              ? "Save Head"
              : "Register Head"}
        </Button>
      </div>
    </form>
  );
};

export default HeadForm;
