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
import { AccountEmailSchema } from "@/schemas";
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
import { HeadReviewDialog } from "./head-review-dialog";

const HeadFormSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(3, {
    message: "Full name must be at least 3 characters",
  }),
  email: AccountEmailSchema,
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
  const [review, setReview] = useState<FormValues | null>(null);
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
    setReview(values);
  };

  const confirmHead = () => {
    if (!review) return;

    setError("");
    setSuccess("");

    startTransition(() => {
      const request = isEdit
        ? updateHead({
            id: review.id || head?.id || "",
            fullName: review.fullName,
            email: review.email,
            courseIds: review.courseIds,
          })
        : registerHead({
            fullName: review.fullName,
            email: review.email,
            courseIds: review.courseIds,
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

  const reviewedDepartments = review
    ? courses.filter((course) => review.courseIds.includes(course.id))
    : [];
  const reviewEmailChanged = Boolean(
    isEdit &&
      review &&
      review.email.trim().toLowerCase() !== (head?.email ?? "").trim().toLowerCase()
  );

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
                placeholder="name@gmail.com"
                autoComplete="email"
                disabled={isPending}
                {...register("email")}
              />
              <FieldDescription>
                {isEdit
                  ? "Use a valid address, including Gmail. Changing this email replaces the password and emails a new temporary password to the updated address."
                  : "Use a valid address, including Gmail. Login credentials will be sent to this address."}
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
          {isEdit ? "Review and save" : "Review and register"}
        </Button>
      </div>

      {review && (
        <HeadReviewDialog
          open
          onOpenChange={(open) => {
            if (!open) setReview(null);
          }}
          mode={mode}
          fullName={review.fullName.trim().replace(/\s+/g, " ")}
          email={review.email.trim().toLowerCase()}
          departments={reviewedDepartments}
          emailChanged={reviewEmailChanged}
          isPending={isPending}
          error={error}
          onConfirm={confirmHead}
        />
      )}
    </form>
  );
};

export default HeadForm;
